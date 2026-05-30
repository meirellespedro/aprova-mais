const ALLOWED_HOSTS = new Set([
  "arquivos.qconcursos.com",
  "download.inep.gov.br",
  "matematicacp2.com.br",
  "sistema.vestibular.uerj.br",
  "www.revista.vestibular.uerj.br",
  "www.vestibular.uerj.br",
]);

const sanitizeFilename = (value) =>
  String(value || "prova.pdf")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "prova.pdf";

const buildError = (message, status) =>
  new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });

const buildUpstreamError = (upstreamResponse) => {
  const status = upstreamResponse.status;

  if (status === 404) {
    return buildError("O PDF remoto retornou 404. O arquivo nao existe mais na origem.", 502);
  }

  if (status === 403) {
    return buildError("A origem bloqueou o acesso publico ao PDF (403).", 502);
  }

  return buildError(`A origem respondeu com erro ${status}.`, 502);
};

const isAllowedSource = (upstreamUrl) => {
  if (upstreamUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(upstreamUrl.hostname)) {
    return false;
  }

  const pathname = upstreamUrl.pathname.toLowerCase();

  return pathname.endsWith(".pdf");
};

const handleDownloadRequest = async (context, includeBody) => {
  const requestUrl = new URL(context.request.url);
  const source = requestUrl.searchParams.get("source");
  const filename = sanitizeFilename(requestUrl.searchParams.get("filename"));

  if (!source) {
    return buildError("Arquivo nao informado.", 400);
  }

  let upstreamUrl;

  try {
    upstreamUrl = new URL(source);
  } catch {
    return buildError("URL invalida.", 400);
  }

  if (!isAllowedSource(upstreamUrl)) {
    return buildError("Origem nao permitida.", 403);
  }

  let upstreamResponse;

  try {
    upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        Accept: "application/pdf",
      },
      cf: {
        cacheTtl: 60 * 60 * 24,
        cacheEverything: true,
      },
    });
  } catch {
    return buildError("Nao foi possivel buscar o arquivo remoto.", 502);
  }

  if (!upstreamResponse.ok) {
    return buildUpstreamError(upstreamResponse);
  }

  if (includeBody && !upstreamResponse.body) {
    return buildError("A origem respondeu sem enviar o arquivo PDF.", 502);
  }

  const upstreamContentType = (upstreamResponse.headers.get("content-type") || "").toLowerCase();
  if (!upstreamContentType.includes("application/pdf")) {
    return buildError(
      `A origem respondeu com '${upstreamContentType || "tipo-desconhecido"}', e nao com um PDF publico.`,
      502
    );
  }

  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Content-Type", upstreamContentType || "application/pdf");

  const contentLength = upstreamResponse.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(includeBody ? upstreamResponse.body : null, {
    status: 200,
    headers,
  });
};

export async function onRequestGet(context) {
  return handleDownloadRequest(context, true);
}

export async function onRequestHead(context) {
  return handleDownloadRequest(context, false);
}
