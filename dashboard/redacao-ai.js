// Correção de redação por IA: liga o textarea ao endpoint /api/corrigir-redacao
// (Cloudflare Function que fala com o Gemini) e renderiza a devolutiva por
// competência. Mantido isolado do grader manual para não inflar interactions.js.
import { dom } from "./dom.js";
import { getRedacaoState, getRedacaoTemas } from "./store.js";
import { escapeHTML } from "./utils.js";

// Folha do ENEM: ~70 caracteres por linha (ponta baixa da faixa 70–90, para não
// superestimar). Piso de 500 ≈ 8 linhas; ideal usar 25–30 das 30 linhas.
const CHARS_PER_LINE = 70;
const MIN_CHARS = 500;
const IDEAL_LINES = 25;

const estimarLinhas = (length) => Math.round(length / CHARS_PER_LINE);

const setStatus = (message, tone = "info") => {
  if (!dom.redacaoAiStatus) {
    return;
  }
  dom.redacaoAiStatus.hidden = !message;
  dom.redacaoAiStatus.textContent = message;
  dom.redacaoAiStatus.dataset.tone = tone;
};

const updateCount = () => {
  if (!dom.redacaoTexto || !dom.redacaoCount) {
    return;
  }
  const length = dom.redacaoTexto.value.trim().length;
  const linhas = estimarLinhas(length);
  dom.redacaoCount.textContent = `${length} caractere${length === 1 ? "" : "s"} · ~${linhas} linha${linhas === 1 ? "" : "s"}`;
  dom.redacaoCount.classList.toggle("is-short", length > 0 && length < MIN_CHARS);
};

const renderResult = (data, aviso = "") => {
  if (!dom.redacaoAiResult) {
    return;
  }

  const competenciasHtml = data.competencias
    .map(
      (item) => `
        <div class="redacao-ai-criterio">
          <div class="redacao-ai-criterio-head">
            <strong>${escapeHTML(item.titulo)}</strong>
            <span class="redacao-ai-nota">${item.nota} / ${data.max}</span>
          </div>
          <p>${escapeHTML(item.comentario)}</p>
        </div>`
    )
    .join("");

  const listBlock = (title, items, tone) =>
    items.length
      ? `
        <div class="redacao-ai-list" data-tone="${tone}">
          <strong>${escapeHTML(title)}</strong>
          <ul>${items.map((i) => `<li>${escapeHTML(i)}</li>`).join("")}</ul>
        </div>`
      : "";

  const linhas = Number(data.linhasEstimadas) || 0;

  dom.redacaoAiResult.hidden = false;
  dom.redacaoAiResult.innerHTML = `
    ${aviso ? `<p class="redacao-ai-aviso">${escapeHTML(aviso)}</p>` : ""}
    <div class="redacao-ai-score surface-subtle">
      <span class="redacao-ai-score-label">Nota estimada pela IA</span>
      <strong>${data.total} / ${data.totalMax}</strong>
      ${linhas ? `<span class="redacao-ai-score-meta">~${linhas} linha${linhas === 1 ? "" : "s"} de texto</span>` : ""}
    </div>
    ${data.comentarioGeral ? `<p class="redacao-ai-geral">${escapeHTML(data.comentarioGeral)}</p>` : ""}
    <div class="redacao-ai-criterios">${competenciasHtml}</div>
    <div class="redacao-ai-lists">
      ${listBlock("Pontos fortes", data.pontosFortes, "up")}
      ${listBlock("O que melhorar", data.pontosFracos, "down")}
    </div>
  `;
};

const corrigir = async () => {
  if (!dom.redacaoTexto) {
    return;
  }

  const texto = dom.redacaoTexto.value.trim();
  const linhas = estimarLinhas(texto.length);
  if (texto.length < MIN_CHARS) {
    setStatus(
      `Sua redação tem ~${linhas} linha${linhas === 1 ? "" : "s"}. No ENEM, 7 linhas ou menos zeram — escreva ao menos 8 linhas (${MIN_CHARS} caracteres) para corrigir.`,
      "error"
    );
    return;
  }

  // Aviso suave (não bloqueia): texto curto demais para uma redação competitiva.
  const aviso =
    linhas < IDEAL_LINES
      ? `Sua redação tem ~${linhas} linhas. O ENEM avalia a partir de 8 linhas, mas o ideal é usar 25–30 das 30 linhas — textos curtos costumam limitar a C3 (projeto de texto).`
      : "";

  const { prova } = getRedacaoState();
  // Usa o primeiro tema da prova selecionada como contexto (o aluno costuma
  // escrever a partir do banco de temas mostrado ao lado).
  const tema = getRedacaoTemas(prova)[0]?.titulo ?? "";

  if (dom.redacaoCorrigir) {
    dom.redacaoCorrigir.disabled = true;
  }
  if (dom.redacaoAiResult) {
    dom.redacaoAiResult.hidden = true;
  }
  setStatus("Corrigindo sua redação com a IA… isso leva alguns segundos.", "info");

  try {
    const response = await fetch("/api/corrigir-redacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, prova, tema }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || "Não foi possível corrigir agora. Tente novamente.", "error");
      return;
    }

    setStatus("");
    renderResult(data, aviso);
  } catch {
    setStatus("Falha de conexão ao corrigir. Verifique a internet e tente de novo.", "error");
  } finally {
    if (dom.redacaoCorrigir) {
      dom.redacaoCorrigir.disabled = false;
    }
  }
};

export const bindRedacaoAI = () => {
  if (!dom.redacaoCorrigir || !dom.redacaoTexto) {
    return;
  }
  dom.redacaoTexto.addEventListener("input", updateCount);
  dom.redacaoCorrigir.addEventListener("click", corrigir);
  updateCount();
};
