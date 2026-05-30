// Conteúdo da área de Redação. Temas autorais no estilo das bancas (sem copiar
// propostas oficiais) e a grade de autocorreção por competência.

// As 5 competências da redação do ENEM (escala oficial: 0 a 200 cada, total 1000).
export const REDACAO_COMPETENCIAS_ENEM = [
  {
    id: "c1",
    titulo: "C1 · Norma culta",
    descricao: "Domínio da escrita formal: ortografia, concordância, regência, pontuação e acentuação.",
  },
  {
    id: "c2",
    titulo: "C2 · Compreensão do tema",
    descricao: "Atender à proposta dissertativo-argumentativa sem fugir do tema e usar repertório legitimado.",
  },
  {
    id: "c3",
    titulo: "C3 · Projeto de texto",
    descricao: "Selecionar, relacionar e organizar argumentos em defesa de um ponto de vista (autoria).",
  },
  {
    id: "c4",
    titulo: "C4 · Coesão",
    descricao: "Articular as partes do texto com conectivos e referências bem empregados.",
  },
  {
    id: "c5",
    titulo: "C5 · Proposta de intervenção",
    descricao: "Propor solução com agente, ação, meio/modo, finalidade e detalhamento — respeitando os direitos humanos.",
  },
];

// Critérios da redação da UERJ (Exame Discursivo). Escala simplificada 0–5 por
// critério para autoavaliação; a banca usa faixas próprias por ciclo.
export const REDACAO_CRITERIOS_UERJ = [
  {
    id: "u1",
    titulo: "Diálogo com a obra",
    descricao: "Mobiliza a obra indicada pelo edital sem resumi-la, usando-a para sustentar a tese.",
  },
  {
    id: "u2",
    titulo: "Tese e argumentação",
    descricao: "Dissertativo-argumentativo de 20–30 linhas, com tese clara e argumentos consistentes.",
  },
  {
    id: "u3",
    titulo: "Coesão e progressão",
    descricao: "Encadeamento lógico das ideias, sem repetição nem salto de raciocínio.",
  },
  {
    id: "u4",
    titulo: "Norma culta",
    descricao: "Gramática, vocabulário preciso e adequação ao registro formal.",
  },
];

// Banco de temas. `prova`: "enem" (proposta de intervenção) ou "uerj" (amarrado à obra).
export const REDACAO_TEMAS = [
  {
    id: "tema-enem-saude-mental",
    prova: "enem",
    eixo: "Saúde",
    titulo: "Os desafios do cuidado com a saúde mental dos jovens no Brasil",
    comando:
      "A partir da leitura do tema, redija um texto dissertativo-argumentativo defendendo um ponto de vista e propondo uma intervenção que respeite os direitos humanos.",
    repertorios: [
      "Constituição de 1988 — saúde como direito de todos e dever do Estado (art. 196).",
      "Dados de organismos de saúde sobre ansiedade e depressão entre adolescentes.",
      "Conceito de 'sociedade do cansaço' (Byung-Chul Han) aplicado à pressão por desempenho.",
    ],
  },
  {
    id: "tema-enem-desinformacao",
    prova: "enem",
    eixo: "Tecnologia e cidadania",
    titulo: "Caminhos para combater a desinformação na era das redes sociais",
    comando:
      "Defenda um ponto de vista sobre o enfrentamento da desinformação e proponha uma intervenção detalhada (agente, ação, meio, finalidade e detalhamento).",
    repertorios: [
      "Conceito de 'bolha de filtros' e de câmaras de eco no consumo de informação.",
      "Papel da educação midiática como política pública na escola.",
      "Comparação com a imprensa tradicional e a checagem de fatos.",
    ],
  },
  {
    id: "tema-enem-mobilidade",
    prova: "enem",
    eixo: "Cidades",
    titulo: "Mobilidade urbana e o direito à cidade no Brasil contemporâneo",
    comando:
      "Construa uma argumentação consistente sobre os entraves à mobilidade urbana e apresente uma proposta de intervenção viável.",
    repertorios: [
      "Estatuto da Cidade (Lei 10.257/2001) e função social do espaço urbano.",
      "Conceito de 'direito à cidade' (Henri Lefebvre).",
      "Relação entre transporte público de qualidade e redução de desigualdade.",
    ],
  },
  {
    id: "tema-enem-trabalho",
    prova: "enem",
    eixo: "Trabalho",
    titulo: "A precarização do trabalho por aplicativos no Brasil",
    comando:
      "Posicione-se criticamente sobre a uberização do trabalho e proponha uma intervenção que considere direitos e dignidade do trabalhador.",
    repertorios: [
      "Conceito de trabalho como base da dignidade (valor social do trabalho na Constituição).",
      "Debate sobre vínculo empregatício x autonomia nas plataformas digitais.",
      "Comparação histórica com conquistas trabalhistas do século XX.",
    ],
  },
  {
    id: "tema-uerj-obra-leitura",
    prova: "uerj",
    eixo: "Exame Discursivo · obra do edital",
    titulo: "A partir da obra literária do edital, discuta um de seus temas centrais",
    comando:
      "Redija um texto dissertativo-argumentativo de 20 a 30 linhas que dialogue com a obra indicada no edital vigente, SEM resumi-la e SEM proposta de intervenção. Use a obra para sustentar sua tese.",
    repertorios: [
      "Leia a obra do edital vigente em vestibular.uerj.br — a lista muda a cada ciclo.",
      "Foque em um conflito/tema da obra e relacione-o a uma reflexão mais ampla.",
      "Cite passagens de forma analítica (o que significam), nunca como mero resumo.",
    ],
  },
  {
    id: "tema-uerj-rio",
    prova: "uerj",
    eixo: "Exame Discursivo · recorte regional",
    titulo: "Treine a estrutura: tese + argumentação em 20–30 linhas",
    comando:
      "Escolha um tema social com recorte do Rio de Janeiro e escreva no formato UERJ: tese clara, dois argumentos e fechamento — sem proposta de intervenção.",
    repertorios: [
      "A banca da UERJ valoriza concisão: cada linha precisa trabalhar pela tese.",
      "Recortes recorrentes: meio ambiente fluminense, desigualdade urbana, cultura carioca.",
      "Releia cortando repetições — 20 a 30 linhas exigem economia de palavras.",
    ],
  },
];
