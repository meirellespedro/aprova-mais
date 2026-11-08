import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../functions/api/corrigir-redacao.js";
import {
  checkRateLimits,
  consumeWindow,
  createMemoryStore,
  resolveLimits,
  validatePayload,
  validateRequestShape,
} from "../functions/_shared/redacao-guard.js";

const ORIGIN = "https://aprovamais.example";
const TEXTO_VALIDO = "A educação brasileira enfrenta desafios estruturais. ".repeat(14);

const geminiOk = () =>
  new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  competencias: [
                    { id: "c1", nota: 160, comentario: "ok" },
                    { id: "c2", nota: 999, comentario: "acima do teto" },
                  ],
                  comentarioGeral: "Bom texto.",
                  pontosFortes: ["tese"],
                  pontosFracos: ["coesão"],
                }),
              },
            ],
          },
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

const makeRequest = ({ body, headers = {}, raw } = {}) =>
  new Request(`${ORIGIN}/api/corrigir-redacao`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN,
      "CF-Connecting-IP": "203.0.113.10",
      ...headers,
    },
    body: raw ?? JSON.stringify(body ?? { texto: TEXTO_VALIDO, prova: "enem" }),
  });

const makeEnv = (overrides = {}) => ({
  GEMINI_API_KEY: "test-key",
  RATE_LIMIT_KV: createMemoryStore(),
  ...overrides,
});

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn(async () => geminiOk());
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("validação da requisição", () => {
  it("rejeita Content-Type que não é JSON (415) sem chamar o Gemini", async () => {
    const res = await onRequestPost({
      request: makeRequest({ headers: { "Content-Type": "text/plain" } }),
      env: makeEnv(),
    });
    expect(res.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejeita Origin de outro site (403)", async () => {
    const res = await onRequestPost({
      request: makeRequest({ headers: { Origin: "https://evil.example" } }),
      env: makeEnv(),
    });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejeita Sec-Fetch-Site cross-site mesmo sem Origin", () => {
    const req = new Request(`${ORIGIN}/api/corrigir-redacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" },
      body: "{}",
    });
    expect(validateRequestShape(req, {})?.status).toBe(403);
  });

  it("aceita origens extras declaradas em ALLOWED_ORIGINS", () => {
    const req = makeRequest({ headers: { Origin: "https://www.aprovamais.com.br" } });
    expect(validateRequestShape(req, { ALLOWED_ORIGINS: "https://www.aprovamais.com.br/" })).toBeNull();
  });

  it("rejeita corpo acima do teto real de bytes (413), mesmo sem Content-Length confiável", async () => {
    const res = await onRequestPost({
      request: makeRequest({ raw: JSON.stringify({ texto: "x".repeat(20000) }) }),
      env: makeEnv(),
    });
    expect(res.status).toBe(413);
  });

  it("rejeita JSON malformado e arrays (400)", async () => {
    for (const raw of ["{nao-json", "[1,2]"]) {
      const res = await onRequestPost({ request: makeRequest({ raw }), env: makeEnv() });
      expect(res.status).toBe(400);
    }
  });

  it("valida campos: prova inválida, texto ausente, tema não-string", () => {
    const opts = { minChars: 500, maxChars: 6000 };
    expect(validatePayload({ texto: TEXTO_VALIDO, prova: "fuvest" }, opts).error.status).toBe(400);
    expect(validatePayload({ prova: "enem" }, opts).error.status).toBe(400);
    expect(validatePayload({ texto: TEXTO_VALIDO, tema: 42 }, opts).error.status).toBe(400);
  });

  it("mantém compatibilidade: prova ausente vira enem", () => {
    const { value } = validatePayload({ texto: TEXTO_VALIDO }, { minChars: 500, maxChars: 6000 });
    expect(value.prova).toBe("enem");
  });

  it("não deixa caracteres de controle inflarem o tamanho mínimo", () => {
    const enchimento = "\u0001".repeat(600) + "curto";
    const { error } = validatePayload({ texto: enchimento }, { minChars: 500, maxChars: 6000 });
    expect(error.status).toBe(400);
  });
});

describe("falha fechada sem armazenamento persistente", () => {
  it("responde 503 sem RATE_LIMIT_KV e sem flag de desenvolvimento", async () => {
    const res = await onRequestPost({
      request: makeRequest(),
      env: { GEMINI_API_KEY: "test-key" },
    });
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("funciona em dev com RATE_LIMIT_ALLOW_MEMORY=1", async () => {
    const res = await onRequestPost({
      request: makeRequest(),
      env: { GEMINI_API_KEY: "test-key", RATE_LIMIT_ALLOW_MEMORY: "1" },
    });
    expect(res.status).toBe(200);
  });
});

describe("rate limit persistente", () => {
  it("bloqueia o 6º pedido do mesmo IP em 10 minutos com 429 + Retry-After", async () => {
    const env = makeEnv();
    for (let i = 0; i < 5; i += 1) {
      const res = await onRequestPost({
        request: makeRequest({ body: { texto: `${TEXTO_VALIDO} variação ${i}` } }),
        env,
      });
      expect(res.status).toBe(200);
    }
    const blocked = await onRequestPost({
      request: makeRequest({ body: { texto: `${TEXTO_VALIDO} variação 99` } }),
      env,
    });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("IPs diferentes têm cotas independentes", async () => {
    const env = makeEnv({ RATE_LIMIT_IP_SHORT: "1" });
    const a = await onRequestPost({ request: makeRequest(), env });
    const b = await onRequestPost({
      request: makeRequest({
        body: { texto: `${TEXTO_VALIDO} outro` },
        headers: { "CF-Connecting-IP": "198.51.100.7" },
      }),
      env,
    });
    expect([a.status, b.status]).toEqual([200, 200]);
  });

  it("teto global segura o custo mesmo com troca de IP", async () => {
    const env = makeEnv({ RATE_LIMIT_GLOBAL_DAILY: "3" });
    const statuses = [];
    for (let i = 0; i < 4; i += 1) {
      const res = await onRequestPost({
        request: makeRequest({
          body: { texto: `${TEXTO_VALIDO} ${i}` },
          headers: { "CF-Connecting-IP": `192.0.2.${i + 1}` },
        }),
        env,
      });
      statuses.push(res.status);
    }
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("a janela expira e libera novos pedidos", async () => {
    let now = 1_000_000_000;
    const store = createMemoryStore(() => now);
    const rule = { limit: 1, windowSeconds: 600 };
    expect((await consumeWindow(store, "t", rule, now)).allowed).toBe(true);
    expect((await consumeWindow(store, "t", rule, now)).allowed).toBe(false);
    now += 601_000;
    expect((await consumeWindow(store, "t", rule, now)).allowed).toBe(true);
  });

  it("não grava o IP em claro no armazenamento", async () => {
    const puts = [];
    const store = createMemoryStore();
    const spy = { get: store.get, put: (k, v, o) => (puts.push(k), store.put(k, v, o)) };
    await onRequestPost({ request: makeRequest(), env: makeEnv({ RATE_LIMIT_KV: spy }) });
    expect(puts.length).toBeGreaterThan(0);
    expect(puts.some((k) => k.includes("203.0.113.10"))).toBe(false);
  });

  it("limites inválidos no ambiente caem no padrão", () => {
    const limits = resolveLimits({ RATE_LIMIT_IP_SHORT: "abc", RATE_LIMIT_IP_DAILY: "-3" });
    expect(limits.perIpShort.limit).toBe(5);
    expect(limits.perIpDaily.limit).toBe(20);
  });

  it("checkRateLimits informa o escopo que bloqueou", async () => {
    const store = createMemoryStore();
    const limits = resolveLimits({ RATE_LIMIT_IP_DAILY: "1" });
    await checkRateLimits(store, { ipHash: "h", limits });
    const verdict = await checkRateLimits(store, { ipHash: "h", limits });
    expect(verdict).toMatchObject({ allowed: false, scope: "ip-daily" });
  });
});

describe("cache de resultado", () => {
  it("reenviar a mesma redação não chama o Gemini nem consome cota", async () => {
    const env = makeEnv({ RATE_LIMIT_IP_SHORT: "1" });
    const first = await onRequestPost({ request: makeRequest(), env });
    const second = await onRequestPost({ request: makeRequest(), env });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((await second.json()).cache).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("Turnstile opcional", () => {
  it("exige token quando TURNSTILE_SECRET_KEY está configurado", async () => {
    const res = await onRequestPost({
      request: makeRequest(),
      env: makeEnv({ TURNSTILE_SECRET_KEY: "secret" }),
    });
    expect(res.status).toBe(403);
  });

  it("aceita token validado pelo Cloudflare", async () => {
    fetchMock.mockImplementation(async (url) =>
      String(url).includes("turnstile")
        ? new Response(JSON.stringify({ success: true }))
        : geminiOk()
    );
    const res = await onRequestPost({
      request: makeRequest({ body: { texto: TEXTO_VALIDO, turnstileToken: "tok" } }),
      env: makeEnv({ TURNSTILE_SECRET_KEY: "secret" }),
    });
    expect(res.status).toBe(200);
  });
});

describe("comportamento existente preservado", () => {
  it("normaliza notas ao teto da rubrica e recalcula o total no servidor", async () => {
    const res = await onRequestPost({ request: makeRequest(), env: makeEnv() });
    const data = await res.json();
    expect(data.competencias.find((c) => c.id === "c2").nota).toBe(200);
    expect(data.total).toBe(360);
    expect(data.totalMax).toBe(1000);
  });

  it("repassa 429 do Gemini como 429 amigável", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 429 }));
    const res = await onRequestPost({ request: makeRequest(), env: makeEnv() });
    expect(res.status).toBe(429);
  });

  it("sem GEMINI_API_KEY continua respondendo 503", async () => {
    const res = await onRequestPost({ request: makeRequest(), env: makeEnv({ GEMINI_API_KEY: "" }) });
    expect(res.status).toBe(503);
  });
});
