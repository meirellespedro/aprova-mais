// Captura um screenshot 1600x1000 do dashboard (aba Resumo) já com estado semeado,
// para regerar docs/preview.jpg e docs/preview.webp com a paleta atual.
// Sem dependências: servidor estático + Chrome/Edge headless via CDP (WebSocket nativo do Node).
import http from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = 8753;
const DBG = 9777;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

// ---- 1) servidor estático ----
const server = http.createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel === "/") rel = "/index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      res.writeHead(404); res.end("404"); return;
    }
    const buf = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(buf);
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
});
await new Promise((r) => server.listen(PORT, r));
console.log(`[shot] servindo ${ROOT} em http://localhost:${PORT}`);

// ---- 2) acha o navegador ----
const candidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];
const browser = candidates.find((p) => existsSync(p));
if (!browser) { console.error("nenhum Chrome/Edge encontrado"); process.exit(1); }
console.log(`[shot] navegador: ${browser}`);

const userDir = await mkdtemp(path.join(os.tmpdir(), "shot-"));
const proc = spawn(browser, [
  "--headless=new",
  `--remote-debugging-port=${DBG}`,
  `--user-data-dir=${userDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--hide-scrollbars",
  "--force-color-profile=srgb",
  "--disable-gpu",
  "about:blank",
], { stdio: "ignore" });

// ---- 3) CDP helpers ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url) {
  const r = await fetch(url);
  return r.json();
}

// espera o endpoint de debug subir e pega o websocket de uma página
let pageWs = null;
for (let i = 0; i < 60; i++) {
  try {
    const list = await getJSON(`http://localhost:${DBG}/json`);
    const page = list.find((t) => t.type === "page");
    if (page?.webSocketDebuggerUrl) { pageWs = page.webSocketDebuggerUrl; break; }
  } catch {}
  await sleep(250);
}
if (!pageWs) { console.error("CDP não respondeu"); process.exit(1); }
console.log("[shot] conectado ao CDP");

const ws = new WebSocket(pageWs);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let msgId = 0;
const pending = new Map();
const events = [];
const waiters = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  } else if (m.method) {
    events.push(m);
    for (const w of waiters.slice()) if (w.method === m.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(m); }
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => { const id = ++msgId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const waitEvent = (method, timeout = 8000) =>
  new Promise((resolve, reject) => {
    const hit = events.find((e) => e.method === method);
    if (hit) return resolve(hit);
    const w = { method, resolve };
    waiters.push(w);
    setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); resolve(null); } }, timeout);
  });

// ---- 4) navega, semeia estado, recarrega, captura ----
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });

const url = `http://localhost:${PORT}/dashboard.html`;
await send("Page.navigate", { url });
await waitEvent("Page.loadEventFired");
await sleep(300);

// semeia perfil (curso Medicina, trilha híbrida) para popular o painel
const seed = {
  profile: { onboarded: true, track: "hibrido", course: "medicina", examDate: "", createdAt: new Date(0).toISOString() },
};
await send("Runtime.evaluate", {
  expression: `(() => {
    const KEY = "aprova-plus-dashboard-v4";
    const cur = JSON.parse(localStorage.getItem(KEY) || "{}");
    const next = Object.assign({}, cur, ${JSON.stringify(seed)});
    next.profile = Object.assign({}, cur.profile, ${JSON.stringify(seed.profile)});
    localStorage.setItem(KEY, JSON.stringify(next));
    return "seeded";
  })()`,
});

await send("Page.reload", {});
await waitEvent("Page.loadEventFired");
await sleep(900);

// congela animações/reveals para captura limpa
await send("Runtime.evaluate", {
  expression: `(() => {
    const s = document.createElement("style");
    s.textContent = "*{animation:none!important;transition:none!important} [data-reveal]{opacity:1!important;transform:none!important}";
    document.head.appendChild(s);
    window.scrollTo(0,0);
    return "frozen";
  })()`,
});
await sleep(250);

async function capture(format, quality, outfile) {
  const { data } = await send("Page.captureScreenshot", { format, quality, fromSurface: true, captureBeyondViewport: false });
  await writeFile(path.join(ROOT, outfile), Buffer.from(data, "base64"));
  console.log(`[shot] gravado ${outfile} (${format})`);
}
await capture("jpeg", 82, "docs/preview.jpg");
await capture("webp", 82, "docs/preview.webp");

// ---- 5) limpeza ----
ws.close();
try { proc.kill(); } catch {}
server.close();
await rm(userDir, { recursive: true, force: true }).catch(() => {});
console.log("[shot] concluído");
process.exit(0);
