# Checklist Tecnico Prioritario

## Feito nesta rodada
- `SEO base da landing`:
  - `meta description`
  - `robots`
  - `canonical`
  - `Open Graph`
  - `Twitter Cards`
  - `JSON-LD` com `Organization`, `SoftwareApplication` e `FAQPage`
- `SEO base do dashboard`:
  - `meta description`
  - `robots noindex`
  - `canonical`
- `Ativos publicos`:
  - `favicon.svg`
  - `og-image.svg`
  - `site.webmanifest`
  - `robots.txt`
  - `sitemap.xml`
- `Performance estrutural`:
  - separacao real dos CSS por pagina
  - landing nao baixa mais `styles/dashboard.css`
  - dashboard nao baixa mais `styles/landing.css`
  - ticker do pomodoro deixa de rodar em loop permanente quando nao ha sessao ativa

## Alta prioridade
1. Definir o dominio final de producao.
   - Atualizar `sitemap.xml` com URL absoluta real.
   - Confirmar se `robots.txt` deve expor o sitemap com o dominio final.
   - Se houver dominio definitivo, considerar trocar `canonical` relativo por absoluto.
2. Rodar auditoria real em navegador.
   - Lighthouse mobile e desktop.
   - PageSpeed Insights.
   - Axe ou Lighthouse Accessibility.
3. Produzir `og-image` em PNG.
   - O SVG atual funciona como base tecnica.
   - Para WhatsApp, X, LinkedIn e Facebook, PNG 1200x630 tende a ser mais confiavel.
4. Revisar indexacao.
   - Manter `dashboard.html` como `noindex` se for demo.
   - Se virar pagina comercial publica, criar SEO proprio para ele.
5. Fechar camada legal e de confianca.
   - contato
   - politica de privacidade
   - termos de uso
   - informacoes institucionais

## Media prioridade
1. Reduzir custo de JavaScript do dashboard.
   - separar `trilhas`, `simulado` e `analytics` em carregamento sob demanda
   - evitar rerender completo para interacoes pequenas
2. Refinar mobile do planner.
   - trocar scroller horizontal por agenda vertical ou visao do dia
3. Melhorar acessibilidade dos formularios.
   - `aria-invalid`
   - mensagens inline de erro
   - associacao explicita entre erro e campo
4. Consolidar arquitetura de componentes.
   - reduzir `innerHTML` em seções grandes
   - aproximar o dashboard de componentes isolados

## Baixa prioridade
1. Revisar efeitos visuais repetidos.
   - menos cards com o mesmo tratamento
   - menos dependencia de gradiente e glow para parecer premium
2. Expandir schema se o site crescer.
   - `WebSite`
   - `BreadcrumbList`
   - paginas de conteudo por materia/trilha

## Riscos ainda abertos
- `sitemap.xml` ainda depende do dominio final para ficar pronto para producao.
- O projeto nao foi validado com metricas reais de Core Web Vitals nesta rodada.
- O `og-image.svg` e tecnico; o ideal comercial e usar uma versao PNG exportada.
