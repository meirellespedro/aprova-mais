# Auditoria do Banco de Questões — Plataforma Aprova+

**Data da auditoria:** 2026-05-29
**Data da correção aplicada:** 2026-05-29
**Auditor:** Especialista de banco de questões (ENEM / UERJ)
**Escopo:** `QUESTION_BANK` em [dashboard/content.js:358](dashboard/content.js#L358) — banco interativo do "treino/simulado" do dashboard.

> **Status deste documento:** as correções recomendadas foram **aplicadas** ao banco (ver §7). As seções 2 e 3 registram o diagnóstico original e, em cada item, o que foi corrigido.

> ⚠️ Observação de escopo: a pasta `downloads/` e o arquivo [dashboard/exam-library.js](dashboard/exam-library.js) **não** são um banco de questões — são uma **biblioteca de links/PDFs** de provas e gabaritos oficiais (INEP e UERJ). Não foram auditados como itens. O único banco de itens *respondíveis* é o `QUESTION_BANK`, com **6 questões**. O arquivo [deploy-static/dashboard/content.js](deploy-static/dashboard/content.js) é **cópia idêntica** — todas as correções foram replicadas nas duas cópias.

---

## 1. Sumário executivo

| Métrica | Antes da correção | Depois da correção |
|---|---|---|
| Total de itens | 6 | 6 |
| ✅ Aprovadas | 3 (2 com ressalva) | **6** |
| ⚠️ Revisar | 3 (q2, q4, q5) | **0** |
| ❌ Rejeitar | 0 | 0 |
| Gabaritos incorretos | 0 | 0 |
| Itens UERJ com nº de alternativas errado | 2/2 | **0/2** |
| Itens sem texto-base/contexto | 4/6 | **0/6** das meta-questões; q1/q3/q6 com situação-problema |
| Meta-questões (sobre o exame) | 3 (q2, q4, q5) | **0** |

**Veredito pós-correção:** o banco está **consistente** — nenhum gabarito errado, nenhum `correctIndex` fora de índice, nenhuma opção duplicada, itens UERJ com 4 alternativas (A–D) e ENEM com 5 (A–E), todas as meta-questões convertidas em itens autênticos com texto-base. Validação programática confirmou os 6 itens (ver §8). Permanecem como **recomendações de produto** (não erros): enriquecer o schema com metadados e ampliar a cobertura.

---

## 2. Itens auditados — diagnóstico e correção aplicada

### q1 — Matemática · ENEM · `correctIndex: 2` → "25%" ✅ Corrigida
- **Resolução:** 225 − 180 = 45; 45 / 180 = **25%**. Gabarito sempre esteve correto.
- **Problema original (Menor):** enunciado citava "gráfico" (inexistente) e "aproximado" (resultado é exato).
- **Correção:** reescrito como situação real (conta de luz abril→maio), sem menção a gráfico nem a "aproximado". Alternativas e gabarito mantidos.

### q2 — Redação · ENEM · `correctIndex: 3` → "O detalhamento da proposta" ✅ Corrigida
- **Problema original (Maior):** meta-questão sobre a prova, sem texto-base; não era item no formato ENEM.
- **Correção:** convertida em **item autêntico** — apresenta um trecho de conclusão (com agente, ação, meio e finalidade) e pede o elemento **ausente** da proposta de intervenção (Competência 5). Resposta: **detalhamento** (índice 3). Distratores agora diagnósticos (cada um nomeia um elemento que *está* presente, exigindo análise).

### q3 — Biologia · ENEM · `correctIndex: 1` → "Redução do oxigênio dissolvido pela decomposição da matéria orgânica" ✅ Corrigida
- **Problema original (Menor):** tensão entre "efeito inicial" e o desequilíbrio de O₂ (posterior); acentuação ausente.
- **Correção:** reformulado para perguntar a consequência **após a proliferação de algas** para a fauna — tornando a depleção de O₂ por decomposição a resposta inequívoca. Acentuação corrigida em todas as alternativas.

### q4 — Português · UERJ · `correctIndex: 1` → "Reforçar o contraste entre a aprovação e a fiscalização" ✅ Corrigida
- **Problema original (Maior):** item UERJ com 5 alternativas (EQ usa 4); sem texto-base; leve ambiguidade.
- **Correção:** **reduzido para 4 alternativas (A–D)**; ancorado em um **período de apoio** com o conector «contudo»; a pergunta agora trata do efeito de sentido daquele conector específico, sem ambiguidade.

### q5 — História · UERJ · `correctIndex: 1` → "As relações entre Estado, capital e transformações sociais em cada contexto" ✅ Corrigida
- **Problema original (Maior):** UERJ com 5 alternativas; meta-questão; distratores de descarte trivial.
- **Correção:** **reduzido para 4 alternativas (A–D)**; contextualizado (comparação industrialização inglesa séc. XVIII × brasileira séc. XX); distratores reescritos como **lentes analíticas reducionistas concorrentes** (determinismo técnico, militar, geográfico) — diagnósticos, não caricaturas.

### q6 — Química · Híbrido · `correctIndex: 1` → "Mais ácida" ✅ Corrigida
- **Resolução:** ↑[H⁺] ⇒ ↓pH ⇒ **mais ácida**. Gabarito sempre correto.
- **Problema original (Menor):** recall puro, sem contexto; acentuação.
- **Correção:** adicionada situação-problema (medição de pH de uma amostra de água); acentuação corrigida ("básica", "ácida").

---

## 3. Padrões sistêmicos

| # | Padrão | Itens | Status |
|---|---|---|---|
| P1 | Itens UERJ com 5 alternativas (banca usa 4 no EQ) | q4, q5 | ✅ Resolvido (4 alternativas) |
| P2 | Ausência de texto-base/contextualização | q2, q4, q5, q6 | ✅ Resolvido (contexto/texto-base em todos) |
| P3 | Meta-questões sobre o exame | q2, q4, q5 | ✅ Resolvido (convertidas em itens aplicados) |
| P4 | Distratores não diagnósticos | q5, q2 | ✅ Resolvido (distratores reescritos) |
| P5 | Schema sem `ano`/`dificuldade`/`habilidade`/`fonte` | 6/6 | ⏳ Pendente — recomendação de produto (ver §4) |
| P6 | Acentuação ausente | q3, q4, q5 | ✅ Resolvido |
| P7 | Banco duplicado em `deploy-static/` | toda a base | ⏳ Pendente — correção replicada manualmente; automatizar o build |
| P8 | Cobertura rasa (6 itens, 1 por área) | toda a base | ⏳ Pendente — criação de conteúdo |

---

## 4. Recomendações remanescentes (não são erros — decisões de produto)

1. **(P5) Enriquecer o schema do item** com `year`, `difficulty`, `skill` (habilidade/competência da matriz ENEM ou tema UERJ) e `source`. *Não foi aplicado* porque as questões são sintéticas — preencher `year`/`source` seria inventar dados. Recomenda-se decidir o modelo de metadados antes de ingerir itens reais de provas.
2. **(P8) Ampliar e estratificar o banco** por exame × área × dificuldade — 6 itens não sustentam um simulado representativo.
3. **(P7) Eliminar a duplicação** `dashboard/` vs `deploy-static/` via build/copy automatizado, evitando divergência futura de gabaritos.

---

## 5. Distinção regra × recomendação
- **Regra dura de banca (aplicada):** UERJ EQ = 4 alternativas; ENEM = 5 e item ancorado em situação-problema; redação ENEM é dissertativo-argumentativa com proposta de intervenção (não múltipla escolha).
- **Boa prática (parcialmente pendente):** metadados de item (P5) e estratificação de cobertura (P8).

## 6. Incertezas sinalizadas
- **q3:** a literatura distingue floração inicial (↑O₂ diurno) de hipóxia posterior. A nova redação evita a fusão ao perguntar explicitamente a consequência *após a proliferação*, mas vale revisão por especialista de Biologia.
- **Obras literárias da UERJ / matriz vigente do ENEM:** o banco não tem itens de literatura nem tags de habilidade; nada foi validado por memória. Itens futuros de literatura UERJ exigem conferência da obra no edital vigente.

---

## 7. Correções aplicadas (registro)
- Arquivos alterados: [dashboard/content.js](dashboard/content.js#L358) e [deploy-static/dashboard/content.js](deploy-static/dashboard/content.js#L358) — `QUESTION_BANK` reescrito (q1–q6).
- Itens q4 e q5 reduzidos de 5 para 4 alternativas; `correctIndex` recalculado onde necessário (q2: 2 → 3).
- Acentuação corrigida; meta-questões convertidas em itens com texto-base; distratores reescritos.

## 8. Validação pós-correção
- `node --check` em `content.js`: **sintaxe válida**.
- `diff` entre as duas cópias: **idênticas**.
- Verificação programática do banco: 6/6 itens com `correctIndex` válido, **sem opções duplicadas**; UERJ com 4 alternativas, ENEM/híbrido com 5.

| id | track | nº opções | alternativa correta |
|---|---|---|---|
| q1 | enem | 5 | 25% |
| q2 | enem | 5 | O detalhamento da proposta |
| q3 | enem | 5 | Redução do oxigênio dissolvido pela decomposição da matéria orgânica |
| q4 | uerj | 4 | Reforçar o contraste entre a aprovação e a fiscalização |
| q5 | uerj | 4 | As relações entre Estado, capital e transformações sociais em cada contexto |
| q6 | hibrido | 5 | Mais ácida |

---

*Entregável complementar: [questoes-sinalizadas.csv](questoes-sinalizadas.csv) — situação de cada item antes/depois da correção.*
