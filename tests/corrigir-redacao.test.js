import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../functions/api/corrigir-redacao.js";
import { createMemoryStore } from "../functions/_shared/redacao-guard.js";

const SITE = "https://aprova-mais.pages.dev";
const TEXTO_VALIDO = "Argumento consistente sobre o tema proposto. ".repeat(15);

const respostaGemini = () =>
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
                    { id: "c2", nota: 160, comentario: "ok" },
                    { id: "c3", nota: 160, comentario: "ok" },
                    { id: "c4", nota: 160, comentario: "ok" },
                    { id: "c5", nota: 160, comentario: "ok" },
                  ],
                  comentarioGeral: "bom",
                  pontosFortes: [],
                  pontosFracos: [],
                }),
              },
            ],
          },
        },
      ],
    }),
    { status: 200 }
  );

function criarContexto({ origin = SITE, ip = "203.0.113.7", env = {}, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (origin !== null) headers.Origin = origin;
  if (ip) headers["CF-Connecting-IP"] = ip;
  return {
    request: new Request(`${SITE}/api/corrigir-redacao`, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? { texto: TEXTO_VALIDO, prova: "enem" }),
    }),
    // RATE_LIMIT_KV: o limite persistente (camada principal) exige o binding KV.
    env: { GEMINI_API_KEY: "chave-de-teste", RATE_LIMIT_KV: createMemoryStore(), ...env },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("corrigir-redacao: proteção da cota do Gemini", () => {
  it("recusa requisição de outra origem sem chamar o Gemini", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await onRequestPost(criarContexto({ origin: "https://site-qualquer.com" }));

    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa requisição sem cabeçalho Origin (ex.: script fora do navegador)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await onRequestPost(criarContexto({ origin: null }));

    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aceita origem extra configurada em ALLOWED_ORIGINS", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaGemini()));

    const res = await onRequestPost(
      criarContexto({
        origin: "https://aprova.exemplo.com.br",
        env: { ALLOWED_ORIGINS: "https://aprova.exemplo.com.br, https://outro.exemplo.com" },
      })
    );

    expect(res.status).toBe(200);
  });

  it("devolve 429 quando o limitador por IP nega, sem chamar o Gemini", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const limiter = { limit: vi.fn().mockResolvedValue({ success: false }) };

    const res = await onRequestPost(criarContexto({ env: { REDACAO_RATE_LIMITER: limiter } }));

    expect(res.status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(limiter.limit).toHaveBeenCalledWith({ key: "redacao:203.0.113.7" });
  });

  it("segue normalmente quando o limitador permite", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaGemini()));
    const limiter = { limit: vi.fn().mockResolvedValue({ success: true }) };

    const res = await onRequestPost(criarContexto({ env: { REDACAO_RATE_LIMITER: limiter } }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.total).toBe(800);
  });

  it("não derruba o recurso se o limitador falhar (fail-open)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaGemini()));
    const limiter = { limit: vi.fn().mockRejectedValue(new Error("indisponível")) };

    const res = await onRequestPost(criarContexto({ env: { REDACAO_RATE_LIMITER: limiter } }));

    expect(res.status).toBe(200);
  });

  it("funciona sem o binding configurado (só checagem de origem)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaGemini()));

    const res = await onRequestPost(criarContexto());

    expect(res.status).toBe(200);
  });

  it("checa origem e limite antes de ler o corpo (não gasta cota com lixo)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const limiter = { limit: vi.fn().mockResolvedValue({ success: false }) };

    const res = await onRequestPost(
      criarContexto({ env: { REDACAO_RATE_LIMITER: limiter }, body: { texto: "curto" } })
    );

    expect(res.status).toBe(429);
  });
});
