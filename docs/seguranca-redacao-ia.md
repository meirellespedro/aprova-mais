# Proteção do endpoint de correção por IA

`POST /api/corrigir-redacao` chama o Gemini com a chave do projeto. Antes desta
mudança, qualquer pessoa podia chamar o endpoint direto (curl, script) e consumir
a cota ou o crédito sem limite. Agora o Gemini só é chamado depois de cinco camadas.

| Ordem | Camada | Bloqueia com |
|---|---|---|
| 1 | `Content-Type: application/json`, corpo ≤ 16 KB (medido em bytes reais), JSON objeto | 415 / 413 / 400 |
| 2 | `Sec-Fetch-Site: cross-site` ou `Origin` fora da lista | 403 |
| 3 | Campos: `prova` ∈ {enem, uerj}, `texto` string 500–6000 (sem caracteres de controle), `tema` string | 400 |
| 4 | Turnstile (só se `TURNSTILE_SECRET_KEY` existir) | 403 |
| 5 | Rate limit persistente em Workers KV | 429 + `Retry-After` |

A camada 2 **não** é a defesa principal: `Origin` é trivial de forjar fora do
navegador. Ela só barra outros sites embutindo a chamada. A defesa real é a camada 5.

## Rate limit

Janela fixa em KV (`functions/_shared/redacao-guard.js`):

| Limite | Padrão | Variável |
|---|---|---|
| Por IP, 10 min | 5 | `RATE_LIMIT_IP_SHORT` |
| Por IP, 24 h | 20 | `RATE_LIMIT_IP_DAILY` |
| Global, 24 h | 400 | `RATE_LIMIT_GLOBAL_DAILY` |

- O teto **global** limita o custo mesmo se o atacante trocar de IP.
- O IP é guardado só como hash SHA-256 com sal (`RATE_LIMIT_SALT`), nunca em claro.
- KV é eventualmente consistente: rajadas simultâneas podem passar 1–2 pedidos além
  do limite. O teto global continua valendo.
- Redação idêntica (mesma prova, tema e texto) volta do cache por 24 h com
  `"cache": true`, sem chamar o Gemini e sem consumir cota.

**Sem o binding `RATE_LIMIT_KV` o endpoint responde 503 (falha fechado).**

## Configuração antes do merge

1. Cloudflare → Workers & Pages → KV → criar namespace (ex.: `aprova-rate-limit`).
2. Projeto Pages → Settings → Bindings → KV namespace: nome **`RATE_LIMIT_KV`**,
   em Production e Preview.
3. Opcional: definir `RATE_LIMIT_SALT` (secret) e `ALLOWED_ORIGINS` se houver domínio próprio.
4. Opcional, recomendado se houver abuso: criar um widget Turnstile, colocar o
   script e o `<div class="cf-turnstile" data-sitekey="...">` no `dashboard.html`
   e definir `TURNSTILE_SECRET_KEY`. O front já envia o token se o widget existir.

Desenvolvimento local: `RATE_LIMIT_ALLOW_MEMORY=1` no `.dev.vars` (memória, não persistente).

## Testes

`tests/corrigir-redacao.test.js` (24 casos) cobre validação, falha fechada, limites
por IP e global, expiração de janela, IP não gravado em claro, cache, Turnstile e o
comportamento anterior (normalização de notas, 429 do Gemini, 503 sem chave).
O Gemini e o Turnstile são simulados com `fetch` mockado.
