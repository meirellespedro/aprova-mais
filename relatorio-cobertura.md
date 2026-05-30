# Relatório de Cobertura — Banco de Questões

**Data:** 2026-05-29
**Banco:** `PRACTICE_BANK` em [dashboard/content.js](dashboard/content.js)
**Total de itens:** **251** (199 objetivas + 52 discursivas) · 236 autorais + 15 reais de provas oficiais

---

## 1. Resumo

| Dimensão | Distribuição |
|---|---|
| **Tipo** | Objetivas **199** · Discursivas (UERJ ED) **52** |
| **Origem** | Autorais **236** · Reais (com `source`) **15** |
| **Por prova** | ENEM **145** · UERJ **106** |
| **Por nível** | Fácil **53** · Médio **100** · Difícil **55** |
| **Matérias** | 13 (todas as de SUBJECTS, exceto a trilha de estratégia) |
| **Matriz tripla (matéria × conteúdo × nível)** | 52 × 3 = **156 combinações · 0 vazias** |

> ✅ **Matriz tripla FECHADA:** toda combinação **matéria × conteúdo × nível** retorna pelo menos uma questão. Nenhum filtro — isolado ou combinado — fica vazio.

---

## 2. Cobertura por matéria

| Matéria | Qtd | Conteúdos (todos com Fácil + Médio + Difícil) |
|---|---|---|
| Matemática | 22 | Matemática básica · Funções · Geometria · Estatística |
| Química | 18 | Atomística · Estequiometria · Soluções · Organica |
| Biologia | 18 | Citologia · Genética · Ecologia · Fisiologia |
| Física | 17 | Cinemática · Dinamica · Ondas · Eletricidade |
| Literatura | 16 | Romantismo · Realismo · Modernismo · Leitura de obra |
| História | 15 | Brasil · Contemporanea · Movimentos sociais · Industrialização |
| Geografia | 15 | Cartografia · População · Geopolítica · Meio ambiente |
| Redação | 15 | Tese · Desenvolvimento · Competência 5 · Reescrita |
| Inglês | 15 | Leitura · Cognatos · Conectores · Inferência |
| Espanhol | 15 | Leitura · Heterossemanticos · Conectores · Interpretação |
| Português | 14 | Interpretação · Gêneros · Sintaxe · Semantica |
| Filosofia | 14 | Classicos · Iluminismo · Ética · Filosofia contemporanea |
| Sociologia | 14 | Cultura · Cidadania · Desigualdade · Movimentos sociais |

Cada uma das **52 células (matéria × conteúdo)** possui ≥1 questão de **cada** nível (Fácil, Médio e Difícil).

---

## 3. Discursivas da UERJ (Exame Discursivo)

**52 questões dissertativas — 4 por matéria**, em todas as 13 disciplinas, cobrindo os 4 conteúdos de cada uma. Cada item tem **verbo de comando**, **padrão de resposta esperada** e **distribuição de pontos por etapa** (total 5 pts).

| Disciplina | Discursivas | Conteúdos cobertos |
|---|---|---|
| Matemática | 4 | Matemática básica, Funções, Geometria, Estatística |
| Física | 4 | Cinemática, Dinamica, Ondas, Eletricidade |
| Química | 4 | Atomística, Estequiometria, Soluções, Organica |
| Biologia | 4 | Citologia, Genética, Ecologia, Fisiologia |
| História | 4 | Brasil, Contemporanea, Movimentos sociais, Industrialização |
| Geografia | 4 | Cartografia, População, Geopolítica, Meio ambiente |
| Português | 4 | Interpretação, Gêneros, Sintaxe, Semantica |
| Literatura | 4 | Romantismo, Realismo, Modernismo, Leitura de obra |
| Redação | 4 | Tese, Desenvolvimento, Competência 5, Reescrita |
| Filosofia | 4 | Classicos, Iluminismo, Ética, Filosofia contemporanea |
| Sociologia | 4 | Cultura, Cidadania, Desigualdade, Movimentos sociais |
| Inglês | 4 | Leitura, Cognatos, Conectores, Inferência |
| Espanhol | 4 | Leitura, Heterossemanticos, Conectores, Interpretação |

> As discursivas aparecem no banco com etiqueta **"Discursiva"** e botão **"Ver padrão de resposta"**, que revela a resposta esperada e a rubrica de pontuação. Todas as 52 têm rubrica conferida (soma = 5 pts).

---

## 4. Conferência de qualidade

- **Gabarito (objetivas):** todas resolvidas; `correctIndex` válido em 199/199; 0 alternativas duplicadas.
- **Formato de banca:** ENEM com 5 alternativas, UERJ com 4 — 0 violações.
- **Discursivas:** 52/52 com `respostaEsperada` e `rubrica` (pontuação por etapa, soma = 5 pts); todas marcadas como UERJ.
- **IDs:** 251 únicos.
- **Originalidade:** as 236 autorais são de autoria própria; textos-base, quando há, são originais ou referem-se a autores em domínio público (Machado de Assis, José de Alencar, Mário de Andrade), sem transcrição de material protegido.
- **Validação automática (node):** sintaxe OK; integridade OK; matriz tripla com **0 combinações vazias**.

---

## 5. Observações
- O filtro de prova oferece apenas **ENEM** e **UERJ** (não há itens "Híbrido", evitando filtro vazio).
- Patamar atual por célula: o **mínimo** (≥1 por nível) está garantido. Para o nível **"Padrão"** do prompt (12–18 por célula), os próximos lotes devem aprofundar cada conteúdo; o esqueleto de cobertura, porém, já está completo e sem buracos.
