// Correção de redação por IA (Google Gemini), rodando como Cloudflare Pages Function.
//
// O front-end (área de Redação do dashboard) faz POST { texto, prova, tema? } e
// recebe de volta uma correção estruturada por competência/critério. A chave da
// API fica em env.GEMINI_API_KEY (secret do Cloudflare) e NUNCA chega ao browser.
//
// Mesmo espírito do proxy em functions/api/exam-download.js: validar a entrada,
// falar com a origem e devolver só o necessário, com mensagens de erro em pt-BR.

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Piso de avaliação: 7 linhas ou menos zeram a redação no ENEM ("texto
// insuficiente"). A folha oficial cabe ~70–90 caracteres por linha; uso a ponta
// baixa (70) para não superestimar quantas linhas o aluno escreveu.
const CHARS_PER_LINE = 70;
const MIN_CHARS = 500; // ≈ 7–8 linhas: piso para a redação ser avaliável
const MAX_CHARS = 6000;

const estimarLinhas = (texto) => Math.round(texto.length / CHARS_PER_LINE);

// Rubricas autoritativas no servidor (espelham dashboard/redacao.js). Cada item
// traz a nota máxima por critério — a escala muda entre ENEM e UERJ.
const RUBRICAS = {
  enem: {
    label: "ENEM",
    max: 200,
    total: 1000,
    formato:
      "texto dissertativo-argumentativo em prosa, com tese, argumentação e proposta de intervenção que respeite os direitos humanos",
    criterios: [
      { id: "c1", titulo: "C1 · Norma culta", descricao: "Domínio da escrita formal: ortografia, concordância, regência, pontuação e acentuação." },
      { id: "c2", titulo: "C2 · Compreensão do tema", descricao: "Atender à proposta dissertativo-argumentativa sem fugir do tema e usar repertório legitimado." },
      { id: "c3", titulo: "C3 · Projeto de texto", descricao: "Selecionar, relacionar e organizar argumentos em defesa de um ponto de vista (autoria)." },
      { id: "c4", titulo: "C4 · Coesão", descricao: "Articular as partes do texto com conectivos e referências bem empregados." },
      { id: "c5", titulo: "C5 · Proposta de intervenção", descricao: "Propor solução com agente, ação, meio/modo, finalidade e detalhamento, respeitando os direitos humanos." },
    ],
  },
  uerj: {
    label: "UERJ (Exame Discursivo)",
    max: 5,
    total: 20,
    formato:
      "texto dissertativo-argumentativo de 20 a 30 linhas que dialoga com a obra do edital SEM resumi-la e SEM proposta de intervenção",
    criterios: [
      { id: "u1", titulo: "Diálogo com a obra", descricao: "Mobiliza a obra indicada pelo edital sem resumi-la, usando-a para sustentar a tese." },
      { id: "u2", titulo: "Tese e argumentação", descricao: "Dissertativo-argumentativo de 20–30 linhas, com tese clara e argumentos consistentes." },
      { id: "u3", titulo: "Coesão e progressão", descricao: "Encadeamento lógico das ideias, sem repetição nem salto de raciocínio." },
      { id: "u4", titulo: "Norma culta", descricao: "Gramática, vocabulário preciso e adequação ao registro formal." },
    ],
  },
};

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const buildError = (message, status) => jsonResponse({ error: message }, status);

// Proteção da cota do Gemini. Duas camadas, ambas antes de ler o corpo:
// 1) Origin: só o próprio site (ou origens extras em env.ALLOWED_ORIGINS,
//    separadas por vírgula) pode chamar. Barra embutir o endpoint em outro site
//    e scripts ingênuos; não é autenticação, por isso existe a camada 2.
// 2) Limite por IP via binding de Rate Limiting do Cloudflare
//    (env.REDACAO_RATE_LIMITER). Sem o binding, ou se ele falhar, o recurso
//    continua funcionando (fail-open) — correção de redação não pode cair por
//    causa da proteção.
const isOriginAllowed = (request, env) => {
  const origin = request.headers.get("Origin");
  if (!origin) return false;

  const allowed = new Set([new URL(request.url).origin]);
  String(env?.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => allowed.add(item));

  return allowed.has(origin);
};

const isRateLimited = async (request, env) => {
  const limiter = env?.REDACAO_RATE_LIMITER;
  if (!limiter || typeof limiter.limit !== "function") return false;

  const ip = request.headers.get("CF-Connecting-IP") || "desconhecido";
  try {
    const { success } = await limiter.limit({ key: `redacao:${ip}` });
    return success === false;
  } catch {
    return false;
  }
};

const buildPrompt = (rubrica, texto, tema) => {
  const criteriosTexto = rubrica.criterios
    .map((c) => `- ${c.titulo} (0 a ${rubrica.max}): ${c.descricao}`)
    .join("\n");

  const temaLinha = tema
    ? `Tema proposto: "${tema}".`
    : "O aluno não informou o tema; avalie pela coerência interna do texto.";

  return `Você é um corretor experiente de redação do vestibular ${rubrica.label}.
Avalie a redação do aluno com rigor e justiça, no mesmo padrão da banca.

${temaLinha}
Formato esperado: ${rubrica.formato}.

Critérios de correção (atribua uma nota inteira a cada um, de 0 até o máximo indicado):
${criteriosTexto}

Regras da sua resposta:
- Dê notas realistas e calibradas pela banca; não infle.
- Em "comentario" de cada critério, seja específico: aponte trechos e diga como melhorar (1 a 3 frases).
- Em "comentarioGeral", resuma o diagnóstico em 2 a 4 frases.
- "pontosFortes" e "pontosFracos": listas curtas e acionáveis.
- Responda SEMPRE em português do Brasil.

Redação do aluno (entre as marcas):
<<<
${texto}
>>>`;
};

// Schema que força o Gemini a devolver JSON pronto pra renderizar na grade.
const buildResponseSchema = (rubrica) => ({
  type: "object",
  properties: {
    competencias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", enum: rubrica.criterios.map((c) => c.id) },
          nota: { type: "integer" },
          comentario: { type: "string" },
        },
        required: ["id", "nota", "comentario"],
      },
    },
    comentarioGeral: { type: "string" },
    pontosFortes: { type: "array", items: { type: "string" } },
    pontosFracos: { type: "array", items: { type: "string" } },
  },
  required: ["competencias", "comentarioGeral", "pontosFortes", "pontosFracos"],
});

export async function onRequestPost(context) {
  const apiKey = context.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return buildError("Correção por IA indisponível: a chave do Gemini não está configurada.", 503);
  }

  if (!isOriginAllowed(context.request, context.env)) {
    return buildError("Origem não autorizada.", 403);
  }

  if (await isRateLimited(context.request, context.env)) {
    return buildError("Muitas correções em pouco tempo. Aguarde um minuto e tente de novo.", 429);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return buildError("Corpo da requisição inválido (esperado JSON).", 400);
  }

  const provaKey = body?.prova === "uerj" ? "uerj" : "enem";
  const rubrica = RUBRICAS[provaKey];
  const texto = typeof body?.texto === "string" ? body.texto.trim() : "";
  const tema = typeof body?.tema === "string" ? body.tema.trim().slice(0, 300) : "";

  if (texto.length < MIN_CHARS) {
    return buildError(
      `Texto muito curto: escreva ao menos ${MIN_CHARS} caracteres (~8 linhas). No ENEM, 7 linhas ou menos zeram a redação.`,
      400
    );
  }
  if (texto.length > MAX_CHARS) {
    return buildError(`Texto longo demais (máximo ${MAX_CHARS} caracteres).`, 400);
  }

  const geminiBody = {
    contents: [{ role: "user", parts: [{ text: buildPrompt(rubrica, texto, tema) }] }],
    generationConfig: {
      thinkingConfig: { thinkingLevel: "low" },
      responseMimeType: "application/json",
      responseSchema: buildResponseSchema(rubrica),
    },
  };

  let upstream;
  try {
    upstream = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(geminiBody),
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    return buildError("Não foi possível falar com o serviço de IA. Tente de novo.", 502);
  }

  if (!upstream.ok) {
    // 429 = cota/limite; demais = erro genérico da origem. Não vaza detalhes da API.
    const status = upstream.status === 429 ? 429 : 502;
    const message =
      status === 429
        ? "Limite de uso da IA atingido no momento. Tente novamente em alguns minutos."
        : "O serviço de IA respondeu com erro. Tente novamente.";
    return buildError(message, status);
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    return buildError("Resposta inválida do serviço de IA.", 502);
  }

  const raw = data?.candidates?.[0]?.content?.parts
    ?.filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text).join("");
  if (!raw) {
    return buildError("A IA não retornou uma correção. Tente reescrever e enviar de novo.", 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return buildError("Não foi possível interpretar a correção da IA.", 502);
  }

  // Normaliza: casa cada nota com o critério oficial, recorta ao intervalo válido
  // e recalcula o total no servidor (não confia no somatório do modelo).
  const byId = new Map((parsed.competencias || []).map((item) => [item.id, item]));
  const competencias = rubrica.criterios.map((criterio) => {
    const hit = byId.get(criterio.id) || {};
    const nota = Math.max(0, Math.min(rubrica.max, Math.round(Number(hit.nota) || 0)));
    return {
      id: criterio.id,
      titulo: criterio.titulo,
      nota,
      comentario: typeof hit.comentario === "string" ? hit.comentario : "",
    };
  });
  const total = competencias.reduce((sum, c) => sum + c.nota, 0);

  return jsonResponse({
    prova: provaKey,
    max: rubrica.max,
    total,
    totalMax: rubrica.total,
    linhasEstimadas: estimarLinhas(texto),
    competencias,
    comentarioGeral: typeof parsed.comentarioGeral === "string" ? parsed.comentarioGeral : "",
    pontosFortes: Array.isArray(parsed.pontosFortes) ? parsed.pontosFortes.slice(0, 6) : [],
    pontosFracos: Array.isArray(parsed.pontosFracos) ? parsed.pontosFracos.slice(0, 6) : [],
  });
}
