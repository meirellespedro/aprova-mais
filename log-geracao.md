# Log de Geração — Banco de Questões

**Data:** 2026-05-29
**Banco:** `PRACTICE_BANK` em [dashboard/content.js](dashboard/content.js)
**Método:** questões autorais escritas no estilo das bancas, cada objetiva resolvida e revisada antes de gravar; discursivas com padrão de resposta e pontuação por etapa. Itens apenas **adicionados** (as 15 questões reais preexistentes foram preservadas).

---

## 1. Lotes gerados

| Lote | Conteúdo | Qtd |
|---|---|---|
| 1 — Exatas | Matemática, Física, Química | 36 |
| 2 — Natureza/Humanas | Biologia, História, Geografia, Filosofia, Sociologia | 40 |
| 3 — Linguagens | Português, Literatura, Redação, Inglês, Espanhol | 40 |
| 4 — Difíceis complementares | 1 Difícil por matéria que faltava | 7 |
| 5 — Fáceis complementares | Fácil para Literatura e Filosofia | 2 |
| 6 — Fechamento da matriz tripla | níveis faltantes em cada célula (matéria × conteúdo × nível) | 59 |
| 7 — Discursivas UERJ (ED) | 4 por disciplina (uma por conteúdo), com resposta esperada + rubrica | 52 |
| **Total autoral** | | **236** |

**Itens reais preexistentes (mantidos):** 15 (ENEM 2022, UERJ 2019/2020).
**Total no banco:** **251** (199 objetivas + 52 discursivas).

## 2. Totais por dimensão (estado final)

- **Por prova:** ENEM 145 · UERJ 106
- **Discursivas:** 52, sendo **4 por matéria** nas 13 disciplinas (uma para cada conteúdo); todas com rubrica somando 5 pts.
- **Por nível:** Fácil 53 · Médio 100 · Difícil 55
- **Matriz tripla (matéria × conteúdo × nível):** 156 combinações, **0 vazias**.
- **Por matéria:** Matemática 22 · Química 18 · Biologia 18 · Física 17 · Literatura 16 · História 15 · Geografia 15 · Redação 15 · Inglês 15 · Espanhol 15 · Português 14 · Filosofia 14 · Sociologia 14

## 3. Integridade

- **IDs:** 208 únicos. 0 duplicados.
- **Objetivas (199):** `correctIndex` válido em todas; 0 alternativas duplicadas; contagem de alternativas correta por prova (ENEM=5, UERJ=4).
- **Discursivas (9):** todas com `respostaEsperada` e `rubrica` (pontuação por etapa, total 5 pts), marcadas como UERJ.
- **Validação automática (node):** sintaxe OK; integridade OK; matriz tripla fechada (0 combinações vazias).

## 4. Mudanças de interface relacionadas

- Schema estendido com suporte a **questões discursivas** (`tipo`, `respostaEsperada`, `rubrica`).
- Card de discursiva: etiqueta **"Discursiva"** + botão **"Ver padrão de resposta"** (revela resposta esperada e distribuição de pontos).
- Filtro de **Nível** (Fácil/Médio/Difícil) ativo; filtro de prova com ENEM e UERJ.

## 5. Próximos lotes (para o nível "Padrão" do prompt)

1. Aprofundar cada célula de ~3 para 12–18 itens (o esqueleto de cobertura já está completo, sem buracos).
2. Ampliar o conjunto de discursivas (mais de uma por disciplina) e incluir a redação da UERJ atrelada à obra do edital vigente (conferir a lista no edital — não assumir de memória).

> Recomendação: rodar o prompt de **auditoria** sobre os novos lotes como segunda checagem independente.
