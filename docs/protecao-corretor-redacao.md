# Proteção do corretor de redação (`/api/corrigir-redacao`)

O endpoint chama o Gemini com a sua chave. Sem proteção, qualquer pessoa pode
disparar requisições e consumir a cota. Agora há duas camadas, aplicadas antes
de ler o corpo da requisição:

1. **Origin** — só aceita chamadas do próprio site. Para liberar outro domínio
   (ex.: domínio próprio), defina a variável `ALLOWED_ORIGINS` no Cloudflare,
   separando por vírgula: `https://aprova.seudominio.com.br`.
2. **Limite por IP (opcional)** — usa o binding de Rate Limiting do Cloudflare com o nome
   `REDACAO_RATE_LIMITER`. É fail-open: sem o binding, vale a camada 3.
3. **Limite persistente em KV (obrigatório)** — por IP e teto global diário, com
   validação do corpo e cache de resultado. Sem o binding `RATE_LIMIT_KV` o endpoint
   responde 503 (fail-closed). Detalhes e configuração em
   [`seguranca-redacao-ia.md`](seguranca-redacao-ia.md).

## Ativar o limite por IP

A documentação do Cloudflare descreve o binding para Workers; ela não confirma
suporte em Pages Functions. Teste num deploy de preview antes de produção.

Configuração no `wrangler.toml` (exige Wrangler 4.36+; `period` só aceita 10 ou 60):

```toml
[[ratelimits]]
name = "REDACAO_RATE_LIMITER"
namespace_id = "1001"   # inteiro único na sua conta

  [ratelimits.simple]
  limit = 5             # correções por IP
  period = 60           # por minuto
```

Atenção: se o projeto Pages passar a ter `wrangler.toml`, ele vira a fonte das
configurações do projeto (inclua `pages_build_output_dir`). Confira as variáveis
existentes antes de publicar.

## Como verificar

- `npm test` — `tests/corrigir-redacao.test.js` cobre origem bloqueada, origem
  extra, 429 do limitador, limitador ausente e limitador com falha.
- Em produção: `curl -X POST https://<site>/api/corrigir-redacao` sem `Origin`
  deve responder **403** sem consumir cota.

Referência: <https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/>
