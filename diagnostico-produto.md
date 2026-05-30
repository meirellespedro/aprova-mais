# Diagnóstico de Produto — Aprova+ · "Conquistar o coração dos vestibulandos"

**Data:** 2026-05-29
**Lente:** Head de Produto + UX EdTech (ENEM/UERJ). Foco em jornada emocional e *jobs to be done*.
**Base:** ancorado no código real (site estático HTML/CSS/JS vanilla + `localStorage`; sem backend/autenticação). Telas reais: [index.html](index.html) (landing) e [dashboard.html](dashboard.html) (app).

> **Convenção de evidência:** cada afirmação está marcada como **[CÓDIGO]** (observada em arquivo/linha) ou **[HIPÓTESE]** (precisa de validação com usuário/analytics). "Amar" não se lê só no código — o §7 lista o que validar.

---

## 1. Sumário executivo

A Aprova+ é um **MVP sólido de organização de rotina** (planner, Pomodoro, trilhas em vídeo, banco de 251 questões, biblioteca de provas oficiais). O alicerce técnico é limpo e os estados vazios são bem tratados. Mas, hoje, ela ajuda o aluno a **organizar** o estudo — não a **sentir que está evoluindo e que vai conseguir**. É uma ferramenta que se *usa*; ainda não é uma que se *ama*.

### As 5 maiores dores

| # | Dor | Job não resolvido | Evidência |
|---|-----|-------------------|-----------|
| **D1** | **Sem onboarding e sem escolha de prova.** O aluno cai direto num painel; a trilha (ENEM/UERJ/híbrido) é *inferida* por um algoritmo de score, nunca perguntada. | *"Me diga por onde começar"* | [CÓDIGO] [main.js:38-41](dashboard/main.js#L38-L41), [store.js:457-487](dashboard/store.js#L457-L487) |
| **D2** | **O painel abre cheio de dados falsos** (4 tarefas, 6 sessões, 28 dias de estudo, 2 simulados, streak e meta já ~50%). O aluno não distingue o que é dele do que é *seed*. | *"Me mostre que estou evoluindo"* (vitória oca) | [CÓDIGO] [store.js:43-148](dashboard/store.js#L43-L148) |
| **D3** | **Nada analisa o desempenho.** Respostas de prática e simulado são salvas, mas nenhuma rotina vira diagnóstico, "ponto fraco" ou "o que treinar". Não há caderno de erros automático nem revisão espaçada. | *"Treine meus pontos fracos sem eu adivinhar"* | [CÓDIGO] `state.practice.answers` [store.js:382-396](dashboard/store.js#L382-L396); "caderno de erros" só como texto narrativo [constants.js:8](dashboard/constants.js#L8) |
| **D4** | **Redação não tem correção, banco de temas nem grade de competências.** Só vídeos + 1 questão discursiva de amostra. A dor mais cara do vestibulando fica sem ferramenta. | *"Me ajude com a redação"* | [CÓDIGO] vídeos [video-library.js:183-192](dashboard/video-library.js#L183-L192); amostra [content.js:3183](dashboard/content.js#L3183); nenhuma correção/tema/repertório |
| **D5** | **Plataforma 100% solitária.** Sem comunidade, fórum, monitoria ou tutor de IA. Nenhum canal para a dúvida do momento. | *"Não estou sozinho" / "leve minha dúvida"* | [CÓDIGO] ausência total (nenhuma menção a fórum/chat/tutor no codebase) |

### O "gap de amor" central

> **A plataforma mede *tempo de cadeira*, não *aprendizado*.** Streak, meta semanal, "ritmo" e o *coverage score* derivam todos de `studyLog` — **minutos autodeclarados** ([store.js:43-53](dashboard/store.js#L43-L53), [276-284](dashboard/store.js#L276-L284)). O aluno pode "estudar 15h" e não saber se aprendeu nada. O que conquista o coração — **a sensação concreta de "eu sei isto hoje e ontem não sabia"** — não é entregue por nenhuma tela. O dado que destravaria isso (respostas certas/erradas) **já é coletado**, mas é jogado fora sem análise. Fechar essa distância entre *"registrei tempo"* e *"provei que evoluí"* é a maior alavanca de amor disponível.

---

## 2. Mapa da jornada (reconstruída do código)

| Etapa | O que o código entrega | Fricção / desencanto | Evidência |
|-------|------------------------|----------------------|-----------|
| **0. Landing** | Promessa: "estude com método, não com ansiedade"; "sem cadastro"; "100% no navegador". 4 CTAs → todos `dashboard.html`. | Promessa de organização, não de **resultado/aprovação**. "Offline/100% navegador" **conflita** com downloads que dependem de servidor (ver D8). | [CÓDIGO] [index.html:95-102](index.html#L95-L102), [108-109](index.html#L108-L109), [213-214](index.html#L213-L214) |
| **1. Entrada** | Clica "Começar agora" → cai direto no dashboard. Sem login. | **Sem boas-vindas, sem pergunta, sem "qual sua prova?".** Momento de maior intenção é desperdiçado. | [CÓDIGO] [index.html:102](index.html#L102), [main.js:38-41](dashboard/main.js#L38-L41) |
| **2. Primeiro olhar** | Painel já populado: prioridades, marcos, trilhas, planner com 6 sessões, 2 simulados no histórico. | **Dado falso vendido como progresso.** Parece "já estudado". Sem "isto é um exemplo — limpe para começar". | [CÓDIGO] [store.js:55-148](dashboard/store.js#L55-L148) |
| **3. Definir prova** | Não existe escolha. O sistema *infere* a trilha por minutos+tarefas. | O aluno **nunca diz** se é ENEM ou UERJ. A topbar afirma "Plano híbrido" para todos. Personalização que ele não pediu nem entende. | [CÓDIGO] [store.js:457-487](dashboard/store.js#L457-L487), [dashboard.html:65](dashboard.html#L65) |
| **4. Estudar (teoria)** | Trilhas de vídeo por matéria; matemática básica embutida; seção UERJ Discursiva. | Muitas aulas marcadas **"Em breve"** (placeholder). Tags **`[confirmar edital]`** visíveis ao aluno corroem confiança. | [CÓDIGO] [video-library.js:1-2](dashboard/video-library.js#L1-L2), [dashboard.html:324](dashboard.html#L324), [332](dashboard.html#L332), [362](dashboard.html#L362), [370](dashboard.html#L370) |
| **5. Praticar** | Banco de 251 questões com filtros (matéria/conteúdo/prova/nível/tipo) — robusto e sem becos vazios. | Treino **sem memória de desempenho**: responde, vê gabarito, e nada é registrado como "acertei/errei isto". Sem "refazer só os que errei". | [CÓDIGO] banco [content.js:454+](dashboard/content.js#L454); resposta não vira diagnóstico |
| **6. Simulado** | Mock com histórico de tentativas e feedback por faixa de acerto. | **Só 6 questões** no `QUESTION_BANK`; **sem cronômetro, sem TRI, sem nota prevista, sem nota de corte.** Não simula a prova nem a pressão. | [CÓDIGO] [content.js:358-447](dashboard/content.js#L358-L447), [renderers.js:893-961](dashboard/renderers.js#L893-L961) |
| **7. Ver resultado** | Score bruto `X/6` + frase motivacional por faixa. | Diz "revise os erros" mas **não mostra quais** nem leva a eles. Conselho sem caminho. | [CÓDIGO] [renderers.js:942-961](dashboard/renderers.js#L942-L961) |
| **8. Voltar** | Streak e meta semanal recompensam constância. | Recompensa **tempo**, não domínio. Sem lembrete/notificação para puxar de volta. Sem pertencimento que crie hábito. | [CÓDIGO] [store.js:406-423](dashboard/store.js#L406-L423); toasts apenas in-app [interactions.js:48-74](dashboard/interactions.js#L48-L74) |

**Momentos de valor perdidos:** (a) a entrada (maior intenção, zero acolhimento); (b) o fim do simulado (maior abertura para aprender, nenhum caminho para o erro); (c) o retorno diário (puxado por tempo, não por "sua próxima vitória te espera").

---

## 3. Registro de dores

> Severidade: 🔴 crítica (bloqueia amor/retenção) · 🟠 alta · 🟡 média.

### 🔴 D1 — Sem onboarding nem escolha de prova
- **Descrição:** o app não pergunta quem é o aluno, qual prova, curso pretendido, tempo até a prova ou nível. A trilha é inferida por algoritmo.
- **Evidência [CÓDIGO]:** [main.js:38-41](dashboard/main.js#L38-L41) (nenhum wizard); `getActiveTrackId()` [store.js:457-487](dashboard/store.js#L457-L487); `primeInterface()` só popula selects [interactions.js](dashboard/interactions.js).
- **Job afetado:** "Me diga por onde começar e o que estudar hoje."
- **Impacto em amor/retenção:** **altíssimo.** Sem direção no minuto 1, a sobrecarga (a dor nº 1 do vestibulando) é confirmada, não aliviada. Mata o D7.

### 🔴 D2 — Dados falsos como progresso
- **Descrição:** estado inicial pré-populado; streak e meta já parciais; histórico de simulado fake.
- **Evidência [CÓDIGO]:** [store.js:43-148](dashboard/store.js#L43-L148). Sem detecção de primeira visita e sem "resetar para começar do zero".
- **Job afetado:** "Me mostre que estou evoluindo" (vira ilusão).
- **Impacto:** **alto.** A primeira impressão é de dado que não é dele; quando percebe, a confiança cai. Progresso oco não fideliza.

### 🔴 D3 — Desempenho coletado mas nunca analisado
- **Descrição:** respostas de prática/simulado são salvas, mas nada vira "ponto fraco", "caderno de erros" ou "treine isto". Sem revisão espaçada. Sem recomendação adaptativa.
- **Evidência [CÓDIGO]:** `state.practice.answers` [store.js:382-396](dashboard/store.js#L382-L396); `REVIEW_PATTERN` é só regex de texto de tarefa [constants.js:8](dashboard/constants.js#L8); nenhum cálculo de acerto por tópico.
- **Job afetado:** "Treine meus pontos fracos sem eu adivinhar" + "me mostre que evoluo".
- **Impacto:** **altíssimo.** É o coração do *delight* possível com o menor esforço — o dado já existe.

### 🔴 D4 — Redação sem ferramenta de prática
- **Descrição:** só vídeos e 1 questão de amostra. Sem correção (humana/IA), banco de temas, repertório estruturado, grade de competências (ENEM) ou padrão de resposta aberto (UERJ).
- **Evidência [CÓDIGO]:** [video-library.js:183-192](dashboard/video-library.js#L183-L192), [238](dashboard/video-library.js#L238); amostra [content.js:3183](dashboard/content.js#L3183).
- **Job afetado:** "Me ajude com a redação."
- **Impacto:** **alto.** É a dor mais cara e a que mais gera dependência/boca a boca quando bem resolvida.

### 🟠 D5 — Sem comunidade, tutor ou canal de dúvida
- **Descrição:** experiência 100% solitária. Sem fórum/chat/monitoria/tutor de IA. "Dicas" são estáticas.
- **Evidência [CÓDIGO]:** ausência total no codebase; seção Dicas [dashboard.html:335-371](dashboard.html#L335-L371).
- **Job afetado:** "Não estou sozinho" + "leve minha dúvida agora".
- **Impacto:** **alto** no longo prazo (pertencimento é o que mais gera retenção e indicação em EdTech) — **[HIPÓTESE]** quanto, precisa de pesquisa.

### 🟠 D6 — Simulado não simula
- **Descrição:** 6 questões, sem tempo, sem TRI, sem nota prevista/corte.
- **Evidência [CÓDIGO]:** [content.js:358-447](dashboard/content.js#L358-L447); cronômetro só no Pomodoro [store.js:60-67](dashboard/store.js#L60-L67).
- **Job afetado:** "Me mostre que vou conseguir" (a nota prevista é o termômetro de esperança).
- **Impacto:** **alto.** "Minha nota daria pra passar?" é a pergunta emocional central — hoje sem resposta.

### 🟠 D7 — Placeholders e edital não confirmado visíveis ao aluno
- **Descrição:** tags `[confirmar edital]`, `[ciclo 2027]`, `[verificar edital vigente]` renderizadas na UI; `CURRENT_CICLO="2027"` hard-coded; aulas "Em breve".
- **Evidência [CÓDIGO]:** [dashboard.html:324](dashboard.html#L324), [332](dashboard.html#L332), [362](dashboard.html#L362), [370](dashboard.html#L370); [store.js:608-609](dashboard/store.js#L608-L609); [video-library.js:1-2](dashboard/video-library.js#L1-L2).
- **Job afetado:** "Não me faça perder tempo" / confiança.
- **Impacto:** **médio**, mas corrói credibilidade — e credibilidade é pré-requisito do amor.

### 🟡 D8 — Promessa "offline" × downloads dependentes de servidor
- **Descrição:** a landing promete "100% no navegador". Mas o download de provas roteia por uma função serverless da Cloudflare; fora desse runtime (abrir o HTML local, outro host), os downloads quebram.
- **Evidência [CÓDIGO]:** [functions/api/exam-download.js:1-40](functions/api/exam-download.js#L1-L40); promessa [index.html:213-214](index.html#L213-L214).
- **Job afetado:** "Não me faça perder tempo" / confiança.
- **Impacto:** **[HIPÓTESE]** depende de onde está publicado — validar em produção.

### 🟡 D9 — Progresso ancorado em tempo autodeclarado
- **Descrição:** streak, meta, ritmo e *coverage* derivam de minutos inseridos à mão. Gamificável e frágil; não prova aprendizado.
- **Evidência [CÓDIGO]:** [store.js:43-53](dashboard/store.js#L43-L53), [796-822](dashboard/store.js#L796-L822).
- **Job afetado:** "Me mostre que estou evoluindo."
- **Impacto:** **médio-alto.** Sobrepõe-se a D3 — a cura é a mesma (medir domínio, não só tempo).

---

## 4. Análise de lacunas

### Table stakes (sem isto, não compete em 2026)
- **Onboarding com escolha de prova + objetivo** (D1).
- **Diagnóstico/desempenho por tópico** a partir das respostas já coletadas (D3).
- **Simulado realista**: cronometrado, banco maior, e ao menos **nota estimada** por prova (D6) — TRI completo é *delight*, nota estimada é table stake.
- **Caderno de erros automático** ("refazer os que errei") (D3).
- **Credibilidade**: remover tags de placeholder da UI do aluno e confirmar o edital vigente (D7).

### Delight (o que faz amar)
- **"Seu plano de hoje"**: um card diário que diz *exatamente* o que estudar, alimentado por pontos fracos reais.
- **Mapa de pontos fracos** visual ("você domina X, precisa de Y") com evolução no tempo.
- **Redação com feedback** (rubrica guiada por competência; correção por IA como fast-follow) + **banco de temas** ENEM e obras UERJ do ciclo (D4).
- **Nota prevista vs. nota de corte do curso pretendido** — termômetro de esperança (D6).
- **Revisão espaçada** dos erros (transforma esforço em memória).
- **Micro-celebrações com propósito** ("3 questões de Ecologia dominadas") — vitória de aprendizado, não de minutos.

### Nice-to-have
- Comunidade/fórum/monitoria, tutor de IA, ranking anônimo, lembretes push/WhatsApp, modo offline real (PWA), gamificação por pontos/medalhas. *(Alto valor de longo prazo — D5 — mas não antes de fechar o loop de aprendizado.)*

---

## 5. Roadmap priorizado (impacto × esforço)

| Iniciativa | Job | Impacto (amor/retenção) | Esforço | Quadrante |
|------------|-----|--------------------------|---------|-----------|
| **Onboarding de 2 min** (prova + curso/objetivo + tempo até a prova) que substitui a inferência e zera o seed | D1, D2 | 🔥 Altíssimo | Baixo-médio | **Fazer já** |
| **Tracker de acerto/erro por tópico** a partir do que já é salvo + tela "pontos fracos" | D3, D9 | 🔥 Altíssimo | Médio (dado já existe) | **Fazer já** |
| **"Refazer os que errei"** (caderno de erros automático) | D3 | Alto | Baixo (deriva do tracker) | **Fazer já** |
| Remover tags `[confirmar…]` da UI + confirmar edital vigente | D7 | Médio (confiança) | **Baixíssimo** | **Fazer já** |
| **Card "Estudar hoje"** alimentado por pontos fracos + revisões vencendo | D1, D3 | 🔥 Altíssimo | Médio | Grande aposta |
| **Simulado cronometrado + nota estimada** (e banco maior reaproveitando o PRACTICE_BANK) | D6 | Alto | Médio-alto | Grande aposta |
| **Redação: banco de temas + rubrica guiada por competência** (correção IA depois) | D4 | Alto | Alto | Grande aposta |
| Revisão espaçada dos erros | D3 | Alto | Médio | Planejar |
| Comunidade / tutor de IA / lembretes push / PWA offline | D5, D8 | Alto (longo prazo) | Alto | Planejar |

### "O que destrava amor primeiro" (sequência sugerida 0–90 dias)
1. **Onboarding + zerar seed** → o app passa a ser *dele* e com direção. *(também resolve D2)*
2. **Tracker de erros + tela de pontos fracos + "refazer os que errei"** → reaproveita dado já coletado; primeira prova real de evolução.
3. **Card "Estudar hoje"** → fecha o loop diário: abrir o app = saber o próximo passo.
4. **Limpeza de credibilidade** (tags/edital) em paralelo — custo quase zero, ganho de confiança imediato.

---

## 6. North Star / "a única coisa" (próximos 30 dias)

> **Transformar a abertura do app num "Seu plano de hoje" com direção real** — começando por um **onboarding de 2 minutos** (qual prova, qual curso/objetivo, quanto tempo até a prova) que **zera o seed** e gera um primeiro card "comece por aqui". Em seguida, ligar o **tracker de erros** (dado já coletado) para que esse card evolua de "começo genérico" para "treine seus pontos fracos".

**Por que esta:** ataca de uma vez o job nº 1 (*"por onde começo"*), elimina a ilusão do dado falso (D2) e cria a espinha para o *delight* de evolução (D3) — tudo sobre infraestrutura que já existe.

**Como medir:**
- **Ativação:** % que completa o onboarding e conclui **1 sessão de prática** no D0.
- **Retenção D7/D30** (proxy local: dias ativos no `studyLog` pós-onboarding vs. coorte sem onboarding).
- **Profundidade de aprendizado:** nº de questões respondidas e **% de erros "refeitos e acertados"** (prova de evolução, não de tempo).
- **Sinal de amor:** **NPS / "recomendaria a um amigo?"** e taxa de retorno espontâneo no 2º dia.

---

## 7. Plano de validação (o que o código não revela)

| Hipótese a validar | Como | Sinal de confirmação |
|--------------------|------|----------------------|
| O aluno se sente perdido ao cair no painel populado | 5–8 **testes de usabilidade moderados** (mobile) com vestibulandos reais; observar os 3 primeiros minutos | Hesitação, "isso é meu?", não sabe o próximo passo |
| Dado falso prejudica a confiança | Entrevistas + teste A/B (seed vs. painel vazio com onboarding) | Maior ativação/confiança na versão sem seed |
| Falta de comunidade limita retenção/indicação (D5) | Entrevistas sobre onde tiram dúvida hoje + survey de pertencimento | Citam grupos de WhatsApp/Discord como muleta atual |
| "Nota prevista" é o gatilho de esperança (D6) | Entrevistas: "o que te faz sentir que vai passar?" | Nota/proximidade do corte aparece espontaneamente |
| Redação é a dor nº 1 não atendida (D4) | Survey de priorização de dores + disposição a pagar | Redação no topo de dor e de willingness-to-pay |
| Downloads quebram fora da Cloudflare (D8) | **Teste em produção** no host real (e abrindo o HTML local) | Download falha/redireciona |
| Mobile real é fluido em janelas curtas | Teste em 3G simulado + aparelhos modestos; medir tempo até "primeira ação útil" | Lentidão, cliques demais, scroll perdido |
| Streak/meta motivam ou geram culpa | Entrevista sobre como se sentem ao "quebrar" o streak | Toxicidade/abandono após falha → ajustar tom |

**Instrumentação mínima a adicionar (sem backend pesado):** eventos anônimos de funil (onboarding iniciado/concluído, 1ª prática, simulado concluído, redação enviada) + um micro-survey de NPS in-app. Sem isso, todo o roadmap roda no escuro.

---

## 8. Honestidade sobre os limites deste diagnóstico
- "Amar" não se conclui lendo código: o §3 separa **[CÓDIGO]** de **[HIPÓTESE]**, e o §7 existe para fechar essa lacuna com usuários reais.
- **Não há analytics no produto** — não dá para afirmar retenção, abandono ou pontos de fuga reais; tudo de comportamento é hipótese até instrumentar.
- O foco aqui é **emoção e jobs**, não auditoria técnica do banco (essa vive em [auditoria-banco-questoes.md](auditoria-banco-questoes.md) e [relatorio-cobertura.md](relatorio-cobertura.md)); a qualidade/gabarito confiável das questões **sustenta** a credibilidade do §3 (D7), mas não foi reauditada neste documento.
