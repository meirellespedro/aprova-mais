// Proteções do endpoint /api/corrigir-redacao (Cloudflare Pages Function).
//
// Camadas, da mais barata para a mais cara — o Gemini só é chamado se todas passarem:
//   1. Validação HTTP: Content-Type JSON, tamanho do corpo e Origin/Sec-Fetch-Site.
//      Origin é só uma camada extra contra abuso a partir de outros sites; um script
//      (curl, bot) forja esse cabeçalho com facilidade, por isso NÃO é a defesa principal.
//   2. Turnstile (opcional): se TURNSTILE_SECRET_KEY existir, exige token válido.
//   3. Rate limit persistente em Workers KV (binding RATE_LIMIT_KV):
//      - por IP (CF-Connecting-IP), em janela curta e janela diária;
//      - teto GLOBAL diário, que limita o custo mesmo se o atacante trocar de IP.
//   4. Cache de resultado por hash do texto: reenviar a mesma redação não gasta cota.
//
// Sem o binding RATE_LIMIT_KV o endpoint FALHA FECHADO (503), exceto se
// RATE_LIMIT_ALLOW_MEMORY="1" (somente desenvolvimento local), quando usa um
// armazenamento em memória que NÃO é persistente.

export const DEFAULT_LIMITS = Object.freeze({
  perIpShort: { limit: 5, windowSeconds: 10 * 60 },
  perIpDaily: { limit: 20, windowSeconds: 24 * 60 * 60 },
  globalDaily: { limit: 400, windowSeconds: 24 * 60 * 60 },
});

export const MAX_BODY_BYTES = 16 * 1024;
export const RESULT_CACHE_TTL_SECONDS = 24 * 60 * 60;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const readPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Permite ajustar limites por variável de ambiente sem novo deploy de código.
export const resolveLimits = (env = {}) => ({
  perIpShort: {
    ...DEFAULT_LIMITS.perIpShort,
    limit: readPositiveInt(env.RATE_LIMIT_IP_SHORT, DEFAULT_LIMITS.perIpShort.limit),
  },
  perIpDaily: {
    ...DEFAULT_LIMITS.perIpDaily,
    limit: readPositiveInt(env.RATE_LIMIT_IP_DAILY, DEFAULT_LIMITS.perIpDaily.limit),
  },
  globalDaily: {
    ...DEFAULT_LIMITS.globalDaily,
    limit: readPositiveInt(env.RATE_LIMIT_GLOBAL_DAILY, DEFAULT_LIMITS.globalDaily.limit),
  },
});

// ---------------------------------------------------------------- armazenamento

// Armazenamento em memória com a mesma interface mínima do KV (get/put com TTL).
export const createMemoryStore = (now = () => Date.now()) => {
  const data = new Map();
  return {
    async get(key) {
      const entry = data.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt <= now()) {
        data.delete(key);
        return null;
      }
      return entry.value;
    },
    async put(key, value, options = {}) {
      const ttl = Number(options.expirationTtl) || 0;
      data.set(key, { value: String(value), expiresAt: ttl ? now() + ttl * 1000 : 0 });
    },
  };
};

let devMemoryStore = null;

export const resolveStore = (env = {}) => {
  if (env.RATE_LIMIT_KV && typeof env.RATE_LIMIT_KV.get === "function") {
    return { store: env.RATE_LIMIT_KV, persistent: true };
  }
  if (env.RATE_LIMIT_ALLOW_MEMORY === "1") {
    devMemoryStore ??= createMemoryStore();
    return { store: devMemoryStore, persistent: false };
  }
  return { store: null, persistent: false };
};

// ---------------------------------------------------------------- rate limit

// Janela fixa: a chave inclui o índice da janela, e o TTL do KV apaga a janela vencida.
// KV é eventualmente consistente; rajadas simultâneas podem passar 1–2 pedidos do
// limite, mas o teto diário global segura o custo total.
export const consumeWindow = async (store, name, { limit, windowSeconds }, nowMs) => {
  const windowIndex = Math.floor(nowMs / 1000 / windowSeconds);
  const key = `rl:${name}:${windowIndex}`;
  const current = Number.parseInt((await store.get(key)) ?? "0", 10) || 0;
  const resetAtSeconds = (windowIndex + 1) * windowSeconds;
  const retryAfter = Math.max(1, Math.ceil(resetAtSeconds - nowMs / 1000));

  if (current >= limit) {
    return { allowed: false, retryAfter, remaining: 0 };
  }

  // TTL mínimo do Workers KV é 60 s.
  await store.put(key, String(current + 1), { expirationTtl: Math.max(60, windowSeconds + 60) });
  return { allowed: true, retryAfter, remaining: limit - current - 1 };
};

export const getClientIp = (request) => {
  const ip = request.headers.get("CF-Connecting-IP") || "";
  return ip.trim() || "unknown";
};

const sha256Hex = async (text) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

// O IP é guardado só como hash: o KV não precisa armazenar o endereço em claro (LGPD).
export const hashIdentifier = async (value, salt = "") => (await sha256Hex(`${salt}:${value}`)).slice(0, 32);

export const checkRateLimits = async (store, { ipHash, limits, nowMs = Date.now() }) => {
  // Ordem: limites por IP primeiro, para um único abusador não consumir o teto global.
  const checks = [
    ["ip-short", `ip10m:${ipHash}`, limits.perIpShort, "Muitas correções seguidas. Aguarde alguns minutos e tente de novo."],
    ["ip-daily", `ipday:${ipHash}`, limits.perIpDaily, "Você atingiu o limite diário de correções por IA. Volte amanhã."],
    ["global-daily", "global:day", limits.globalDaily, "A correção por IA atingiu o limite diário da plataforma. Tente amanhã."],
  ];

  for (const [scope, name, rule, message] of checks) {
    const result = await consumeWindow(store, name, rule, nowMs);
    if (!result.allowed) {
      return { allowed: false, scope, message, retryAfter: result.retryAfter };
    }
  }
  return { allowed: true };
};

// ---------------------------------------------------------------- validação HTTP

const parseAllowedOrigins = (env, requestUrl) => {
  const allowed = new Set();
  try {
    allowed.add(new URL(requestUrl).origin);
  } catch {
    /* URL inválida: nenhuma origem implícita */
  }
  for (const item of String(env.ALLOWED_ORIGINS || "").split(",")) {
    const origin = item.trim().replace(/\/$/, "");
    if (origin) allowed.add(origin);
  }
  return allowed;
};

// Retorna null se a requisição é aceitável, ou { status, message }.
export const validateRequestShape = (request, env = {}) => {
  const contentType = (request.headers.get("Content-Type") || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    return { status: 415, message: "Envie a redação como JSON (Content-Type: application/json)." };
  }

  const declaredLength = Number.parseInt(request.headers.get("Content-Length") || "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return { status: 413, message: "Requisição grande demais." };
  }

  // Navegadores modernos mandam Sec-Fetch-Site; "cross-site" indica outro site chamando.
  const fetchSite = (request.headers.get("Sec-Fetch-Site") || "").toLowerCase();
  if (fetchSite === "cross-site") {
    return { status: 403, message: "Origem da requisição não permitida." };
  }

  const origin = request.headers.get("Origin");
  if (origin && !parseAllowedOrigins(env, request.url).has(origin.replace(/\/$/, ""))) {
    return { status: 403, message: "Origem da requisição não permitida." };
  }

  return null;
};

// Lê o corpo com teto real de bytes (Content-Length pode estar ausente ou mentir).
export const readJsonBody = async (request, maxBytes = MAX_BODY_BYTES) => {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return { error: { status: 413, message: "Requisição grande demais." } };
  }
  try {
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { error: { status: 400, message: "Corpo da requisição inválido (esperado objeto JSON)." } };
    }
    return { body };
  } catch {
    return { error: { status: 400, message: "Corpo da requisição inválido (esperado JSON)." } };
  }
};

// Valida campos de negócio. Mantém compatibilidade: "prova" ausente = "enem".
export const validatePayload = (body, { minChars, maxChars }) => {
  if (body.prova !== undefined && body.prova !== "enem" && body.prova !== "uerj") {
    return { error: { status: 400, message: 'Campo "prova" inválido: use "enem" ou "uerj".' } };
  }
  if (typeof body.texto !== "string") {
    return { error: { status: 400, message: 'Campo "texto" é obrigatório.' } };
  }
  if (body.tema !== undefined && typeof body.tema !== "string") {
    return { error: { status: 400, message: 'Campo "tema" deve ser texto.' } };
  }

  // Remove caracteres de controle (exceto quebra de linha e tab) antes de medir.
  const texto = body.texto.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  const tema = typeof body.tema === "string" ? body.tema.trim().slice(0, 300) : "";

  if (texto.length < minChars) {
    return {
      error: {
        status: 400,
        message: `Texto muito curto: escreva ao menos ${minChars} caracteres (~8 linhas). No ENEM, 7 linhas ou menos zeram a redação.`,
      },
    };
  }
  if (texto.length > maxChars) {
    return { error: { status: 400, message: `Texto longo demais (máximo ${maxChars} caracteres).` } };
  }

  return {
    value: {
      prova: body.prova === "uerj" ? "uerj" : "enem",
      texto,
      tema,
      turnstileToken: typeof body.turnstileToken === "string" ? body.turnstileToken.slice(0, 2048) : "",
    },
  };
};

// ---------------------------------------------------------------- Turnstile (opcional)

export const verifyTurnstile = async ({ secret, token, ip, fetchImpl = fetch }) => {
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip && ip !== "unknown") form.append("remoteip", ip);
  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return data?.success === true;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------- cache de resultado

export const resultCacheKey = async ({ prova, tema, texto }) =>
  `result:${(await sha256Hex(`${prova}\n${tema}\n${texto}`)).slice(0, 40)}`;

export const readCachedResult = async (store, key) => {
  try {
    const raw = await store.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeCachedResult = async (store, key, value) => {
  try {
    await store.put(key, JSON.stringify(value), { expirationTtl: RESULT_CACHE_TTL_SECONDS });
  } catch {
    /* cache é otimização: falha ao gravar não derruba a resposta */
  }
};
