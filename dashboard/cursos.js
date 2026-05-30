// Cursos oferecidos pelas universidades públicas e privadas do Rio de Janeiro
// (UERJ, UFRJ, UFF, UNIRIO, UFRRJ, CEFET-RJ, PUC-Rio, FGV, entre outras) com as
// matérias de MAIOR PESO na seleção de cada curso.
//
// Importante: o peso exato muda por universidade e por edital. Aqui marcamos as
// matérias que historicamente mais decidem a vaga em cada curso — um norte de
// estudo, não a tabela oficial de pesos.

// Rótulos das grandes áreas (usados para agrupar o seletor).
export const AREA_LABELS = {
  saude: "Saúde",
  exatas: "Exatas e Engenharias",
  bio_terra: "Biológicas e da Terra",
  sociais: "Humanas e Sociais Aplicadas",
  linguagens: "Linguagens, Comunicação e Artes",
  agrarias: "Ciências Agrárias",
};

// Ordem em que as áreas aparecem no seletor.
export const AREA_ORDER = ["saude", "exatas", "bio_terra", "sociais", "linguagens", "agrarias"];

export const CURSOS_RJ = [
  // ---- Saúde ----
  { id: "medicina", nome: "Medicina", area: "saude", pesos: ["biologia", "quimica", "fisica", "redacao"] },
  { id: "medicina-veterinaria", nome: "Medicina Veterinária", area: "saude", pesos: ["biologia", "quimica", "portugues", "redacao"] },
  { id: "enfermagem", nome: "Enfermagem", area: "saude", pesos: ["biologia", "quimica", "portugues", "redacao"] },
  { id: "odontologia", nome: "Odontologia", area: "saude", pesos: ["biologia", "quimica", "fisica", "redacao"] },
  { id: "farmacia", nome: "Farmácia", area: "saude", pesos: ["quimica", "biologia", "matematica", "redacao"] },
  { id: "biomedicina", nome: "Biomedicina", area: "saude", pesos: ["biologia", "quimica", "portugues", "redacao"] },
  { id: "fisioterapia", nome: "Fisioterapia", area: "saude", pesos: ["biologia", "fisica", "portugues", "redacao"] },
  { id: "nutricao", nome: "Nutrição", area: "saude", pesos: ["biologia", "quimica", "portugues", "redacao"] },
  { id: "psicologia", nome: "Psicologia", area: "saude", pesos: ["biologia", "portugues", "sociologia", "redacao"] },
  { id: "educacao-fisica", nome: "Educação Física", area: "saude", pesos: ["biologia", "portugues", "redacao"] },
  { id: "fonoaudiologia", nome: "Fonoaudiologia", area: "saude", pesos: ["biologia", "portugues", "redacao"] },
  { id: "terapia-ocupacional", nome: "Terapia Ocupacional", area: "saude", pesos: ["biologia", "portugues", "redacao"] },

  // ---- Exatas e Engenharias ----
  { id: "engenharia-civil", nome: "Engenharia Civil", area: "exatas", pesos: ["matematica", "fisica", "quimica", "redacao"] },
  { id: "engenharia-mecanica", nome: "Engenharia Mecânica", area: "exatas", pesos: ["matematica", "fisica", "quimica", "redacao"] },
  { id: "engenharia-eletrica", nome: "Engenharia Elétrica", area: "exatas", pesos: ["matematica", "fisica", "quimica", "redacao"] },
  { id: "engenharia-producao", nome: "Engenharia de Produção", area: "exatas", pesos: ["matematica", "fisica", "portugues", "redacao"] },
  { id: "engenharia-quimica", nome: "Engenharia Química", area: "exatas", pesos: ["quimica", "matematica", "fisica", "redacao"] },
  { id: "engenharia-computacao", nome: "Engenharia de Computação", area: "exatas", pesos: ["matematica", "fisica", "portugues", "redacao"] },
  { id: "engenharia-petroleo", nome: "Engenharia de Petróleo", area: "exatas", pesos: ["matematica", "fisica", "quimica", "redacao"] },
  { id: "engenharia-ambiental", nome: "Engenharia Ambiental", area: "exatas", pesos: ["quimica", "biologia", "matematica", "redacao"] },
  { id: "ciencia-computacao", nome: "Ciência da Computação", area: "exatas", pesos: ["matematica", "fisica", "portugues", "redacao"] },
  { id: "sistemas-informacao", nome: "Sistemas de Informação", area: "exatas", pesos: ["matematica", "portugues", "ingles", "redacao"] },
  { id: "matematica-curso", nome: "Matemática", area: "exatas", pesos: ["matematica", "fisica", "portugues", "redacao"] },
  { id: "fisica-curso", nome: "Física", area: "exatas", pesos: ["fisica", "matematica", "portugues", "redacao"] },
  { id: "quimica-curso", nome: "Química", area: "exatas", pesos: ["quimica", "matematica", "biologia", "redacao"] },
  { id: "estatistica", nome: "Estatística", area: "exatas", pesos: ["matematica", "portugues", "geografia", "redacao"] },
  { id: "arquitetura-urbanismo", nome: "Arquitetura e Urbanismo", area: "exatas", pesos: ["matematica", "historia", "fisica", "redacao"] },

  // ---- Biológicas e da Terra ----
  { id: "ciencias-biologicas", nome: "Ciências Biológicas", area: "bio_terra", pesos: ["biologia", "quimica", "portugues", "redacao"] },
  { id: "biotecnologia", nome: "Biotecnologia", area: "bio_terra", pesos: ["biologia", "quimica", "matematica", "redacao"] },
  { id: "geologia", nome: "Geologia", area: "bio_terra", pesos: ["geografia", "quimica", "fisica", "redacao"] },
  { id: "oceanografia", nome: "Oceanografia", area: "bio_terra", pesos: ["biologia", "geografia", "fisica", "redacao"] },
  { id: "geografia-curso", nome: "Geografia", area: "bio_terra", pesos: ["geografia", "historia", "portugues", "redacao"] },

  // ---- Humanas e Sociais Aplicadas ----
  { id: "direito", nome: "Direito", area: "sociais", pesos: ["portugues", "redacao", "historia", "filosofia"] },
  { id: "administracao", nome: "Administração", area: "sociais", pesos: ["matematica", "portugues", "geografia", "redacao"] },
  { id: "economia", nome: "Ciências Econômicas", area: "sociais", pesos: ["matematica", "portugues", "historia", "redacao"] },
  { id: "ciencias-contabeis", nome: "Ciências Contábeis", area: "sociais", pesos: ["matematica", "portugues", "redacao"] },
  { id: "relacoes-internacionais", nome: "Relações Internacionais", area: "sociais", pesos: ["historia", "geografia", "ingles", "redacao"] },
  { id: "ciencias-sociais", nome: "Ciências Sociais", area: "sociais", pesos: ["sociologia", "historia", "portugues", "redacao"] },
  { id: "historia-curso", nome: "História", area: "sociais", pesos: ["historia", "geografia", "portugues", "redacao"] },
  { id: "filosofia-curso", nome: "Filosofia", area: "sociais", pesos: ["filosofia", "portugues", "historia", "redacao"] },
  { id: "servico-social", nome: "Serviço Social", area: "sociais", pesos: ["sociologia", "portugues", "historia", "redacao"] },
  { id: "pedagogia", nome: "Pedagogia", area: "sociais", pesos: ["portugues", "historia", "redacao"] },
  { id: "turismo", nome: "Turismo", area: "sociais", pesos: ["geografia", "historia", "ingles", "redacao"] },

  // ---- Linguagens, Comunicação e Artes ----
  { id: "jornalismo", nome: "Jornalismo", area: "linguagens", pesos: ["portugues", "redacao", "historia", "sociologia"] },
  { id: "publicidade", nome: "Publicidade e Propaganda", area: "linguagens", pesos: ["portugues", "redacao", "sociologia", "ingles"] },
  { id: "comunicacao-social", nome: "Comunicação Social", area: "linguagens", pesos: ["portugues", "redacao", "historia", "sociologia"] },
  { id: "letras", nome: "Letras", area: "linguagens", pesos: ["portugues", "literatura", "ingles", "redacao"] },
  { id: "letras-espanhol", nome: "Letras (Espanhol)", area: "linguagens", pesos: ["portugues", "literatura", "espanhol", "redacao"] },
  { id: "design", nome: "Design", area: "linguagens", pesos: ["portugues", "historia", "matematica", "redacao"] },
  { id: "cinema", nome: "Cinema e Audiovisual", area: "linguagens", pesos: ["portugues", "historia", "redacao", "sociologia"] },
  { id: "artes-visuais", nome: "Artes Visuais", area: "linguagens", pesos: ["historia", "portugues", "redacao"] },
  { id: "musica", nome: "Música", area: "linguagens", pesos: ["portugues", "historia", "redacao"] },
  { id: "teatro", nome: "Teatro", area: "linguagens", pesos: ["portugues", "literatura", "redacao"] },
  { id: "danca", nome: "Dança", area: "linguagens", pesos: ["biologia", "portugues", "redacao"] },
  { id: "moda", nome: "Moda", area: "linguagens", pesos: ["historia", "portugues", "redacao"] },

  // ---- Ciências Agrárias ----
  { id: "agronomia", nome: "Agronomia", area: "agrarias", pesos: ["biologia", "quimica", "matematica", "redacao"] },
  { id: "zootecnia", nome: "Zootecnia", area: "agrarias", pesos: ["biologia", "quimica", "portugues", "redacao"] },
  { id: "engenharia-florestal", nome: "Engenharia Florestal", area: "agrarias", pesos: ["biologia", "quimica", "matematica", "redacao"] },

  // ---- Cursos adicionais ofertados pela UERJ (vários campi) ----
  { id: "engenharia-materiais", nome: "Engenharia de Materiais", area: "exatas", pesos: ["matematica", "fisica", "quimica", "redacao"] },
  { id: "engenharia-metalurgica", nome: "Engenharia Metalúrgica", area: "exatas", pesos: ["matematica", "fisica", "quimica", "redacao"] },
  { id: "tecnologo-ads", nome: "Análise e Desenvolvimento de Sistemas (Tecnólogo)", area: "exatas", pesos: ["matematica", "portugues", "ingles", "redacao"] },
  { id: "tecnologo-construcao-naval", nome: "Construção Naval (Tecnólogo)", area: "exatas", pesos: ["matematica", "fisica", "portugues", "redacao"] },
  { id: "ciencias-ambientais", nome: "Ciências Ambientais", area: "bio_terra", pesos: ["biologia", "geografia", "quimica", "redacao"] },
  { id: "arqueologia", nome: "Arqueologia", area: "sociais", pesos: ["historia", "geografia", "portugues", "redacao"] },
  { id: "ciencias-atuariais", nome: "Ciências Atuariais", area: "sociais", pesos: ["matematica", "portugues", "geografia", "redacao"] },
  { id: "relacoes-publicas", nome: "Relações Públicas", area: "linguagens", pesos: ["portugues", "redacao", "sociologia", "ingles"] },
  { id: "historia-da-arte", nome: "História da Arte", area: "linguagens", pesos: ["historia", "portugues", "literatura", "redacao"] },
  { id: "desenho-industrial", nome: "Desenho Industrial (ESDI)", area: "linguagens", pesos: ["matematica", "historia", "portugues", "redacao"] },
];

// Cursos oferecidos pela UERJ, com os CAMPI de cada um (todos os campi).
// Fonte: Anexo I — Distribuição dos Cursos de Graduação por Campi (pr4.uerj.br).
// Quando o aluno escolhe SOMENTE UERJ, a lista é filtrada para estes cursos.
// >>> Conferir no edital/portal da UERJ a cada ciclo; o catálogo muda com o tempo.
export const UERJ_CURSOS = {
  // --- Saúde ---
  medicina: ["Rio · Zona Oeste", "Rio · FCM (Vila Isabel)"],
  enfermagem: ["Rio · FCM (Vila Isabel)"],
  odontologia: ["Rio · FCM (Vila Isabel)"],
  farmacia: ["Rio · Maracanã"],
  nutricao: ["Rio · Maracanã"],
  psicologia: ["Rio · Maracanã"],
  "educacao-fisica": ["Rio · Maracanã"],
  // --- Exatas e Engenharias ---
  "engenharia-civil": ["Rio · Maracanã"],
  "engenharia-eletrica": ["Rio · Maracanã"],
  "engenharia-mecanica": ["Resende", "Nova Friburgo"],
  "engenharia-producao": ["Resende", "Rio · Zona Oeste"],
  "engenharia-quimica": ["Resende", "Nova Friburgo"],
  "engenharia-ambiental": ["Rio · Maracanã"],
  "engenharia-computacao": ["Nova Friburgo"],
  "engenharia-materiais": ["Rio · Zona Oeste"],
  "engenharia-metalurgica": ["Rio · Zona Oeste"],
  "ciencia-computacao": ["Rio · Zona Oeste", "Cabo Frio"],
  "tecnologo-ads": ["Rio · Zona Oeste"],
  "tecnologo-construcao-naval": ["Rio · Zona Oeste"],
  "matematica-curso": ["Rio · Maracanã", "São Gonçalo", "Duque de Caxias"],
  "fisica-curso": ["Rio · Maracanã"],
  "quimica-curso": ["Rio · Maracanã"],
  estatistica: ["Rio · Maracanã"],
  "ciencias-atuariais": ["Rio · Maracanã"],
  // --- Biológicas e da Terra ---
  "ciencias-biologicas": ["Rio · Maracanã", "Rio · Zona Oeste", "São Gonçalo"],
  "ciencias-ambientais": ["Rio · Maracanã"],
  geologia: ["Rio · Maracanã"],
  oceanografia: ["Rio · Maracanã"],
  "geografia-curso": ["Rio · Maracanã", "São Gonçalo", "Duque de Caxias", "Cabo Frio"],
  // --- Humanas e Sociais Aplicadas ---
  direito: ["Rio · Maracanã"],
  administracao: ["Rio · Maracanã"],
  economia: ["Rio · Maracanã"],
  "ciencias-contabeis": ["Rio · Maracanã"],
  "ciencias-sociais": ["Rio · Maracanã"],
  "historia-curso": ["Rio · Maracanã", "São Gonçalo", "Duque de Caxias"],
  "filosofia-curso": ["Rio · Maracanã"],
  "servico-social": ["Rio · Maracanã"],
  pedagogia: ["Rio · Maracanã", "São Gonçalo", "Duque de Caxias"],
  turismo: ["Rio · Maracanã"],
  "relacoes-internacionais": ["Rio · Maracanã"],
  arqueologia: ["Rio · Maracanã"],
  // --- Linguagens, Comunicação e Artes ---
  jornalismo: ["Rio · Maracanã", "Cabo Frio"],
  publicidade: ["Rio · Maracanã"],
  "relacoes-publicas": ["Rio · Maracanã"],
  "comunicacao-social": ["Rio · Maracanã"],
  letras: ["Rio · Maracanã", "São Gonçalo"],
  "letras-espanhol": ["Rio · Maracanã"],
  design: ["Rio · ESDI (Centro)"],
  "desenho-industrial": ["Rio · ESDI (Centro)"],
  "artes-visuais": ["Rio · Maracanã"],
  "historia-da-arte": ["Rio · Maracanã"],
  // --- Arquitetura (Petrópolis) ---
  "arquitetura-urbanismo": ["Petrópolis"],
};

export const cursoOfertadoNaUerj = (cursoId) => Object.prototype.hasOwnProperty.call(UERJ_CURSOS, cursoId);

export const getUerjCampi = (cursoId) => UERJ_CURSOS[cursoId] ?? [];

// ===== Calendário das provas (a PLATAFORMA informa — o aluno não digita) =====
// Datas-base do ciclo atual. Como cada edital confirma o calendário no ano,
// marcamos `previsto: true` e mostramos o aviso para conferir no site oficial.
// >>> Atualizar aqui quando os editais saírem. [VERIFICAR EDITAL OFICIAL]
export const CALENDARIO_PROVAS = {
  enem: {
    nome: "ENEM",
    fonte: "gov.br/inep",
    fonteUrl: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem",
    dias: [
      { label: "1º dia", data: "2026-11-08", detalhe: "Linguagens, Ciências Humanas e Redação", previsto: true },
      { label: "2º dia", data: "2026-11-15", detalhe: "Matemática e Ciências da Natureza", previsto: true },
    ],
  },
  uerj: {
    nome: "UERJ",
    fonte: "vestibular.uerj.br",
    fonteUrl: "https://www.vestibular.uerj.br",
    dias: [
      { label: "Exame de Qualificação", data: "2026-09-13", detalhe: "1ª fase — prova objetiva", previsto: true },
      { label: "Exame Discursivo", data: "2026-11-29", detalhe: "2ª fase — questões discursivas + redação", previsto: true },
    ],
  },
};
