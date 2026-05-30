// Sincroniza os arquivos de origem para deploy-static/ (o artefato de hospedagem).
// Uso: npm run build
//
// Espelha HTML/CSS/JS/manifest/SEO + a função de download. NÃO toca em conteúdo
// que só existe no deploy (downloads/, docs/preview*), então é seguro rodar sempre.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "deploy-static");

// Arquivos avulsos (caminho relativo à raiz) espelhados no deploy.
const FILES = [
  "index.html",
  "dashboard.html",
  "script.js",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
  "og-image.svg",
  "functions/api/exam-download.js",
  "functions/api/corrigir-redacao.js",
];

// Pastas espelhadas por completo (apenas os arquivos diretos de cada uma).
const DIRS = ["styles", "dashboard", "img"];

const copyFile = async (rel) => {
  const to = path.join(dest, rel);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(path.join(root, rel), to);
  return rel;
};

const copyDir = async (rel) => {
  const entries = await fs.readdir(path.join(root, rel), { withFileTypes: true });
  const copied = [];
  for (const entry of entries) {
    if (entry.isFile()) {
      copied.push(await copyFile(path.join(rel, entry.name)));
    }
  }
  return copied;
};

const copied = [];
for (const file of FILES) {
  copied.push(await copyFile(file));
}
for (const dir of DIRS) {
  copied.push(...(await copyDir(dir)));
}

console.log(`✓ ${copied.length} arquivos sincronizados para deploy-static/`);
for (const rel of copied) {
  console.log(`  · ${rel.replace(/\\/g, "/")}`);
}
