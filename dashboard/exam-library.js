const EXAM_DOWNLOAD_ROUTE = "/api/exam-download";
const PUBLISHED_DOWNLOAD_ORIGIN = "https://aprova-mais.pages.dev";

const getRuntimeLocation = () => (typeof window !== "undefined" ? window.location : null);

const isLocalPreviewRuntime = () => {
  const runtimeLocation = getRuntimeLocation();

  if (!runtimeLocation) {
    return false;
  }

  return (
    runtimeLocation.protocol === "file:" ||
    runtimeLocation.hostname === "localhost" ||
    runtimeLocation.hostname === "127.0.0.1"
  );
};

const toProjectRelativePath = (path) => `.${path}`;
const toPublishedDownloadUrl = (path) => new URL(path, `${PUBLISHED_DOWNLOAD_ORIGIN}/`).toString();

const createDownload = (label, sourceUrl, fileName, options = {}) => ({
  label,
  sourceUrl,
  fileName,
  delivery: options.delivery || "route",
});

const createDownloadGroup = (label, downloads, description = "") => ({
  kind: "group",
  label,
  description,
  downloads,
});

const createExamYear = (year, summary, downloads) => ({
  year,
  summary,
  downloads,
});

const extractSourceFileName = (sourceUrl) => {
  try {
    return new URL(sourceUrl).pathname.split("/").pop() || "download.pdf";
  } catch {
    return sourceUrl.split("/").pop() || "download.pdf";
  }
};

const createAutoDownload = (label, sourceUrl) =>
  createDownload(label, sourceUrl, extractSourceFileName(sourceUrl));

const createBrowserDownload = (label, sourceUrl, fileName) =>
  createDownload(label, sourceUrl, fileName, { delivery: "browser-fetch" });

const formatEnemColor = (rawColor) => {
  const colorMap = {
    amarelo: "Amarelo",
    azul: "Azul",
    branco: "Branco",
    cinza: "Cinza",
    rosa: "Rosa",
  };

  return colorMap[String(rawColor || "").toLowerCase()] || rawColor;
};

const buildEnemGabaritoLabel = (sourceUrl) => {
  const fileName = extractSourceFileName(sourceUrl);

  let match = fileName.match(/GB_impresso_D([12])_CD([1-8])\.pdf$/i);
  if (match) {
    return `Gabarito D${match[1]} - Caderno ${match[2]}`;
  }

  match = fileName.match(/gabarito_(\d)_dia_caderno_\d+_([a-z]+)_aplicacao_regular\.pdf$/i);
  if (match) {
    return `Gabarito D${match[1]} - ${formatEnemColor(match[2])}`;
  }

  match = fileName.match(/GAB_ENEM_2018_DIA_(\d)_([A-Z]+)\.pdf$/i);
  if (match) {
    return `Gabarito D${match[1]} - ${formatEnemColor(match[2])}`;
  }

  match = fileName.match(/cad_(\d+)_gabarito_([a-z]+)_/i);
  if (match) {
    const caderno = Number.parseInt(match[1], 10);
    const day = caderno >= 5 ? 2 : 1;

    return `Gabarito D${day} - ${formatEnemColor(match[2])}`;
  }

  match = fileName.match(/GAB_ENEM_2016_DIA_(\d)_(?:\d+)_([A-Z]+)\.pdf$/i);
  if (match) {
    return `Gabarito D${match[1]} - ${formatEnemColor(match[2])}`;
  }

  return "Gabarito oficial";
};

const buildEnemProofLabel = (day, caderno) => `Prova D${day} - Caderno ${caderno}`;

const toLocalEnemGabaritoPath = (sourceUrl) => `/downloads/enem/${extractSourceFileName(sourceUrl)}`;

const buildStandardEnemProofUrl = (year, day, caderno) =>
  year >= 2020
    ? `https://download.inep.gov.br/enem/provas_e_gabaritos/${year}_PV_impresso_D${day}_CD${caderno}.pdf`
    : `https://download.inep.gov.br/educacao_basica/enem/provas/${year}/${year}_PV_impresso_D${day}_CD${caderno}.pdf`;

const ENEM_PROOF_URL_OVERRIDES = {
  "2017-D1-CD2": "https://download.inep.gov.br/educacao_basica/enem/provas/2017/cad_2_prova_amarelo_5112017.pdf",
  "2018-D2-CD5": "https://download.inep.gov.br/educacao_basica/enem/provas/2018/2DIA_05_AMARELO_BAIXA.pdf",
};

const buildEnemProofUrl = (year, day, caderno) =>
  ENEM_PROOF_URL_OVERRIDES[`${year}-D${day}-CD${caderno}`] || buildStandardEnemProofUrl(year, day, caderno);

const createEnemProofDownloads = (year) =>
  [
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
    [2, 7],
    [2, 8],
  ].map(([day, caderno]) =>
    createBrowserDownload(
      buildEnemProofLabel(day, caderno),
      buildEnemProofUrl(year, day, caderno),
      `enem-${year}-prova-d${day}-caderno-${caderno}.pdf`
    )
  );

const ENEM_GABARITO_URLS = {
  2025: [
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D1_CD1.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D1_CD2.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D1_CD3.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D1_CD4.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D2_CD5.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D2_CD6.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D2_CD7.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D2_CD8.pdf",
  ],
  2024: [
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D1_CD1.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D1_CD2.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D1_CD3.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D1_CD4.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D2_CD5.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D2_CD6.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D2_CD7.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D2_CD8.pdf",
  ],
  2023: [
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D1_CD1.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D1_CD2.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D1_CD3.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D1_CD4.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D2_CD5.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D2_CD6.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D2_CD7.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D2_CD8.pdf",
  ],
  2022: [
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D1_CD1.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D1_CD2.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D1_CD3.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D1_CD4.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D2_CD5.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D2_CD6.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D2_CD7.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D2_CD8.pdf",
  ],
  2021: [
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D1_CD1.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D1_CD2.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D1_CD3.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D1_CD4.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D2_CD5.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D2_CD6.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D2_CD7.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D2_CD8.pdf",
  ],
  2020: [
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D1_CD1.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D1_CD2.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D1_CD3.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D1_CD4.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D2_CD5.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D2_CD6.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D2_CD7.pdf",
    "https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D2_CD8.pdf",
  ],
  2019: [
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_1_dia_caderno_1_azul_aplicacao_regular.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_1_dia_caderno_2_amarelo_aplicacao_regular.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_1_dia_caderno_3_branco_aplicacao_regular.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_1_dia_caderno_4_rosa_aplicacao_regular.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_2_dia_caderno_5_amarelo_aplicacao_regular.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_2_dia_caderno_6_cinza_aplicacao_regular.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_2_dia_caderno_7_azul_aplicacao_regular.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_2_dia_caderno_8_rosa_aplicacao_regular.pdf",
  ],
  2018: [
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2018/GAB_ENEM_2018_DIA_1_AZUL.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2018/GAB_ENEM_2018_DIA_1_AMARELO.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2018/GAB_ENEM_2018_DIA_1_BRANCO.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2018/GAB_ENEM_2018_DIA_1_ROSA.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2018/GAB_ENEM_2018_DIA_2_AMARELO.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2018/GAB_ENEM_2018_DIA_2_AZUL.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2018/GAB_ENEM_2018_DIA_2_ROSA.pdf",
  ],
  2017: [
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_1_gabarito_azul_5112017.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_2_gabarito_amarelo_5112017.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_3_gabarito_branco_5112017.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_4_gabarito_rosa_5112017.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_5_gabarito_amarelo_12112017.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_6_gabarito_cinza_12112017.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_7_gabarito_azul_12112017.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_8_gabarito_rosa_12112017.pdf",
  ],
  2016: [
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_1_01_AZUL.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_1_02_AMARELO.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_1_03_BRANCO.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_1_04_ROSA.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_2_05_AMARELO.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_2_06_CINZA.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_2_07_AZUL.pdf",
    "https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_2_08_ROSA.pdf",
  ],
};

const createEnemGabaritoDownloads = (year) =>
  (ENEM_GABARITO_URLS[year] || []).map((sourceUrl) =>
    createAutoDownload(buildEnemGabaritoLabel(sourceUrl), toLocalEnemGabaritoPath(sourceUrl))
  );

const createEnemYear = (year, summary, downloads) => {
  const provasPorCaderno = createEnemProofDownloads(year);
  const gabaritos = createEnemGabaritoDownloads(year);

  return createExamYear(
    year,
    summary,
    [
      ...downloads,
      ...(provasPorCaderno.length
        ? [createDownloadGroup("Cadernos oficiais", provasPorCaderno, "8 versoes do INEP")]
        : []),
      ...(gabaritos.length ? [createDownloadGroup("Gabaritos", gabaritos, "8 versoes oficiais")] : []),
    ]
  );
};

const ENEM_LIBRARY = [
  createEnemYear(2025, "1o e 2o dia no mesmo PDF", [
    createDownload(
      "Prova completa",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/141553/inep-2025-enem-exame-nacional-do-ensino-medio-prova.pdf",
      "enem-2025-prova-completa.pdf"
    ),
  ]),
  createEnemYear(2024, "1o e 2o dia no mesmo PDF", [
    createDownload(
      "Prova completa",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/126089/inep-2024-enem-exame-nacional-do-ensino-medio-primeiro-e-segundo-dia-prova.pdf",
      "enem-2024-prova-completa.pdf"
    ),
  ]),
  createEnemYear(2023, "1o e 2o dia no mesmo PDF", [
    createDownload(
      "Prova completa",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/101194/inep-2023-enem-exame-nacional-do-ensino-medio-primeiro-e-segundo-dia-edital-2023-prova.pdf",
      "enem-2023-prova-completa.pdf"
    ),
  ]),
  createEnemYear(2022, "1o dia e 2o dia em PDFs separados", [
    createDownload(
      "1o dia",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/89587/inep-2022-enem-exame-nacional-do-ensino-medio-primeiro-dia-edital-2022-prova.pdf",
      "enem-2022-primeiro-dia.pdf"
    ),
    createDownload(
      "2o dia",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/89648/inep-2022-enem-exame-nacional-do-ensino-medio-segundo-dia-edital-2022-prova.pdf",
      "enem-2022-segundo-dia.pdf"
    ),
  ]),
  createEnemYear(2021, "1o e 2o dia no mesmo PDF", [
    createDownload(
      "Prova completa",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/85792/inep-2021-enem-exame-nacional-do-ensino-medio-primeiro-e-segundo-dia-edital-2021-prova.pdf",
      "enem-2021-prova-completa.pdf"
    ),
  ]),
  createEnemYear(2020, "1o e 2o dia no mesmo PDF", [
    createDownload(
      "Prova completa",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/78987/inep-2020-enem-exame-nacional-do-ensino-medio-primeiro-dia-e-segundo-dia-edital-2020-prova.pdf",
      "enem-2020-prova-completa.pdf"
    ),
  ]),
  createEnemYear(2019, "1o e 2o dia no mesmo PDF", [
    createDownload(
      "Prova completa",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/65730/inep-2019-enem-exame-nacional-do-ensino-medio-primeiro-dia-e-segundo-dia-prova.pdf",
      "enem-2019-prova-completa.pdf"
    ),
  ]),
  createEnemYear(2018, "1o e 2o dia no mesmo PDF", [
    createDownload(
      "Prova completa",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/59432/inep-2018-enem-exame-nacional-do-ensino-medio-primeiro-e-segundo-dia-prova.pdf",
      "enem-2018-prova-completa.pdf"
    ),
  ]),
  createEnemYear(2017, "1o e 2o dia no mesmo PDF", [
    createDownload(
      "Prova completa",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/56023/inep-2017-enem-exame-nacional-do-ensino-medio-primeiro-e-segundo-dia-prova.pdf",
      "enem-2017-prova-completa.pdf"
    ),
  ]),
  createEnemYear(2016, "1o e 2o dia no mesmo PDF", [
    createDownload(
      "Prova completa",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/51172/inep-2016-enem-exame-nacional-do-ensino-medio-primeiro-e-segundo-dia-prova.pdf",
      "enem-2016-prova-completa.pdf"
    ),
  ]),
];

const createLocalUerjDownload = (label, fileName) =>
  createAutoDownload(label, `/downloads/uerj/${fileName}`);

const createUerjSubjectGroup = (label, proofFileName, patternFileName) =>
  createDownloadGroup(
    label,
    [
      createLocalUerjDownload("Prova", proofFileName),
      createLocalUerjDownload("Padrao", patternFileName),
    ],
    "prova + padrao"
  );

const createUerjLanguageGroup = (proofFileName, patternFileNames, label = "Lingua estrangeira") =>
  createDownloadGroup(
    label,
    [
      createLocalUerjDownload("Prova", proofFileName),
      createDownloadGroup(
        "Padroes por idioma",
        Object.entries(patternFileNames).map(([languageLabel, fileName]) =>
          createLocalUerjDownload(languageLabel, fileName)
        ),
        `${Object.keys(patternFileNames).length} idiomas`
      ),
    ],
    "1 prova + 3 padroes"
  );

const createUerjDiscursiveGroup = (downloads, description = "todas as materias da fase discursiva") =>
  createDownloadGroup("Discursivas por materia", downloads, description);

const createUerjYear = (year, summary, downloads) => createExamYear(year, summary, downloads);

const UERJ_LIBRARY = [
  createUerjYear(2025, "1o EQ, 2o EQ e 9 discursivas com padroes", [
    createDownload(
      "1o EQ",
      "https://matematicacp2.com.br/wp-content/uploads/2026/02/2025_1eq_prova.pdf",
      "uerj-2025-1-eq.pdf"
    ),
    createDownload(
      "Gabarito 1o EQ",
      "https://matematicacp2.com.br/wp-content/uploads/2026/02/2025_1eq_gabarito.pdf",
      "uerj-2025-1-eq-gabarito.pdf"
    ),
    createDownload(
      "2o EQ",
      "https://matematicacp2.com.br/wp-content/uploads/2026/02/2025_2eq_prova.pdf",
      "uerj-2025-2-eq.pdf"
    ),
    createDownload(
      "Gabarito 2o EQ",
      "https://matematicacp2.com.br/wp-content/uploads/2026/02/2025_2eq_gabarito.pdf",
      "uerj-2025-2-eq-gabarito.pdf"
    ),
    createUerjDiscursiveGroup(
      [
        createUerjSubjectGroup("Biologia", "uerj-2025-discursiva-biologia.pdf", "uerj-2025-discursiva-biologia-padrao.pdf"),
        createUerjSubjectGroup("Fisica", "uerj-2025-discursiva-fisica.pdf", "uerj-2025-discursiva-fisica-padrao.pdf"),
        createUerjSubjectGroup(
          "Geografia",
          "uerj-2025-discursiva-geografia.pdf",
          "uerj-2025-discursiva-geografia-padrao.pdf"
        ),
        createUerjSubjectGroup("Historia", "uerj-2025-discursiva-historia.pdf", "uerj-2025-discursiva-historia-padrao.pdf"),
        createUerjLanguageGroup("uerj-2025-discursiva-lingua-estrangeira.pdf", {
          Espanhol: "uerj-2025-discursiva-lingua-estrangeira-espanhol-padrao.pdf",
          Frances: "uerj-2025-discursiva-lingua-estrangeira-frances-padrao.pdf",
          Ingles: "uerj-2025-discursiva-lingua-estrangeira-ingles-padrao.pdf",
        }),
        createUerjSubjectGroup(
          "Lingua Portuguesa e Literatura",
          "uerj-2025-discursiva-lingua-portuguesa-literatura.pdf",
          "uerj-2025-discursiva-lingua-portuguesa-literatura-padrao.pdf"
        ),
        createUerjSubjectGroup(
          "Matematica",
          "uerj-2025-discursiva-matematica.pdf",
          "uerj-2025-discursiva-matematica-padrao.pdf"
        ),
        createUerjSubjectGroup("Quimica", "uerj-2025-discursiva-quimica.pdf", "uerj-2025-discursiva-quimica-padrao.pdf"),
        createUerjSubjectGroup("Redacao", "uerj-2025-discursiva-redacao.pdf", "uerj-2025-discursiva-redacao-padrao.pdf"),
      ],
      "9 materias com prova e padroes"
    ),
  ]),
  createUerjYear(2024, "1o EQ, 2o EQ e 9 discursivas com padroes", [
    createDownload(
      "1o EQ",
      "https://matematicacp2.com.br/wp-content/uploads/2026/02/2024_1eq_prova.pdf",
      "uerj-2024-1-eq.pdf"
    ),
    createDownload(
      "Gabarito 1o EQ",
      "https://matematicacp2.com.br/wp-content/uploads/2026/02/2024_1eq_gabarito.pdf",
      "uerj-2024-1-eq-gabarito.pdf"
    ),
    createDownload(
      "2o EQ",
      "https://matematicacp2.com.br/wp-content/uploads/2026/02/2024_2eq_prova.pdf",
      "uerj-2024-2-eq.pdf"
    ),
    createDownload(
      "Gabarito 2o EQ",
      "https://matematicacp2.com.br/wp-content/uploads/2026/02/2024_2eq_gabarito.pdf",
      "uerj-2024-2-eq-gabarito.pdf"
    ),
    createUerjDiscursiveGroup(
      [
        createUerjSubjectGroup("Biologia", "uerj-2024-discursiva-biologia.pdf", "uerj-2024-discursiva-biologia-padrao.pdf"),
        createUerjSubjectGroup("Fisica", "uerj-2024-discursiva-fisica.pdf", "uerj-2024-discursiva-fisica-padrao.pdf"),
        createUerjSubjectGroup(
          "Geografia",
          "uerj-2024-discursiva-geografia.pdf",
          "uerj-2024-discursiva-geografia-padrao.pdf"
        ),
        createUerjSubjectGroup("Historia", "uerj-2024-discursiva-historia.pdf", "uerj-2024-discursiva-historia-padrao.pdf"),
        createUerjLanguageGroup("uerj-2024-discursiva-lingua-estrangeira.pdf", {
          Espanhol: "uerj-2024-discursiva-lingua-estrangeira-espanhol-padrao.pdf",
          Frances: "uerj-2024-discursiva-lingua-estrangeira-frances-padrao.pdf",
          Ingles: "uerj-2024-discursiva-lingua-estrangeira-ingles-padrao.pdf",
        }),
        createUerjSubjectGroup(
          "Lingua Portuguesa e Literatura",
          "uerj-2024-discursiva-lingua-portuguesa-literatura.pdf",
          "uerj-2024-discursiva-lingua-portuguesa-literatura-padrao.pdf"
        ),
        createUerjSubjectGroup(
          "Matematica",
          "uerj-2024-discursiva-matematica.pdf",
          "uerj-2024-discursiva-matematica-padrao.pdf"
        ),
        createUerjSubjectGroup("Quimica", "uerj-2024-discursiva-quimica.pdf", "uerj-2024-discursiva-quimica-padrao.pdf"),
        createUerjSubjectGroup("Redacao", "uerj-2024-discursiva-redacao.pdf", "uerj-2024-discursiva-redacao-padrao.pdf"),
      ],
      "9 materias com prova e padroes"
    ),
  ]),
  createUerjYear(2023, "1o EQ e gabarito oficial", [
    createDownload(
      "1o EQ",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/94757/uerj-2023-uerj-vestibular-estadual-2024-1-exame-de-qualificacao-prova.pdf",
      "uerj-2023-1-eq.pdf"
    ),
    createDownload(
      "Gabarito 1o EQ",
      "https://arquivos.qconcursos.com/prova/arquivo_gabarito/94757/uerj-2023-uerj-vestibular-estadual-2024-1-exame-de-qualificacao-gabarito.pdf",
      "uerj-2023-1-eq-gabarito.pdf"
    ),
  ]),
  createUerjYear(2022, "Exame Unico e gabarito oficial", [
    createDownload(
      "Exame Unico",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/89873/uerj-2022-uerj-vestibular-exame-unico-prova.pdf",
      "uerj-2022-exame-unico.pdf"
    ),
    createDownload(
      "Gabarito Exame Unico",
      "https://arquivos.qconcursos.com/prova/arquivo_gabarito/89873/uerj-2022-uerj-vestibular-exame-unico-gabarito.pdf",
      "uerj-2022-exame-unico-gabarito.pdf"
    ),
  ]),
  createUerjYear(2021, "Exame Unico e gabarito oficial", [
    createDownload(
      "Exame Unico",
      "https://arquivos.qconcursos.com/prova/arquivo_prova/82532/uerj-2021-uerj-vestibular-exame-unico-prova.pdf",
      "uerj-2021-exame-unico.pdf"
    ),
    createDownload(
      "Gabarito Exame Unico",
      "https://arquivos.qconcursos.com/prova/arquivo_gabarito/82532/uerj-2021-uerj-vestibular-exame-unico-gabarito.pdf",
      "uerj-2021-exame-unico-gabarito.pdf"
    ),
  ]),
  createUerjYear(2020, "1o EQ, 2o EQ e 9 discursivas com padroes", [
    createLocalUerjDownload("1o EQ", "uerj-2020-1-eq.pdf"),
    createLocalUerjDownload("Gabarito 1o EQ", "uerj-2020-1-eq-gabarito.pdf"),
    createLocalUerjDownload("2o EQ", "uerj-2020-2-eq.pdf"),
    createLocalUerjDownload("Gabarito 2o EQ", "uerj-2020-2-eq-gabarito.pdf"),
    createUerjDiscursiveGroup(
      [
        createUerjSubjectGroup("Biologia", "uerj-2020-discursiva-biologia.pdf", "uerj-2020-discursiva-biologia-padrao.pdf"),
        createUerjSubjectGroup("Fisica", "uerj-2020-discursiva-fisica.pdf", "uerj-2020-discursiva-fisica-padrao.pdf"),
        createUerjSubjectGroup(
          "Geografia",
          "uerj-2020-discursiva-geografia.pdf",
          "uerj-2020-discursiva-geografia-padrao.pdf"
        ),
        createUerjSubjectGroup("Historia", "uerj-2020-discursiva-historia.pdf", "uerj-2020-discursiva-historia-padrao.pdf"),
        createUerjLanguageGroup("uerj-2020-discursiva-lingua-estrangeira.pdf", {
          Espanhol: "uerj-2020-discursiva-lingua-estrangeira-espanhol-padrao.pdf",
          Frances: "uerj-2020-discursiva-lingua-estrangeira-frances-padrao.pdf",
          Ingles: "uerj-2020-discursiva-lingua-estrangeira-ingles-padrao.pdf",
        }),
        createUerjSubjectGroup(
          "Lingua Portuguesa e Literaturas",
          "uerj-2020-discursiva-lingua-portuguesa-literaturas.pdf",
          "uerj-2020-discursiva-lingua-portuguesa-literaturas-padrao.pdf"
        ),
        createUerjSubjectGroup(
          "Matematica",
          "uerj-2020-discursiva-matematica.pdf",
          "uerj-2020-discursiva-matematica-padrao.pdf"
        ),
        createUerjSubjectGroup("Quimica", "uerj-2020-discursiva-quimica.pdf", "uerj-2020-discursiva-quimica-padrao.pdf"),
        createUerjSubjectGroup("Redacao", "uerj-2020-discursiva-redacao.pdf", "uerj-2020-discursiva-redacao-padrao.pdf"),
      ],
      "9 materias com prova e padroes"
    ),
  ]),
  createUerjYear(2019, "1o EQ, 2o EQ e 9 discursivas com padroes", [
    createLocalUerjDownload("1o EQ", "uerj-2019-1-eq.pdf"),
    createLocalUerjDownload("Gabarito 1o EQ", "uerj-2019-1-eq-gabarito.pdf"),
    createLocalUerjDownload("2o EQ", "uerj-2019-2-eq.pdf"),
    createLocalUerjDownload("Gabarito 2o EQ", "uerj-2019-2-eq-gabarito.pdf"),
    createUerjDiscursiveGroup(
      [
        createUerjSubjectGroup("Biologia", "uerj-2019-discursiva-biologia.pdf", "uerj-2019-discursiva-biologia-padrao.pdf"),
        createUerjSubjectGroup("Fisica", "uerj-2019-discursiva-fisica.pdf", "uerj-2019-discursiva-fisica-padrao.pdf"),
        createUerjSubjectGroup(
          "Geografia",
          "uerj-2019-discursiva-geografia.pdf",
          "uerj-2019-discursiva-geografia-padrao.pdf"
        ),
        createUerjSubjectGroup("Historia", "uerj-2019-discursiva-historia.pdf", "uerj-2019-discursiva-historia-padrao.pdf"),
        createUerjLanguageGroup("uerj-2019-discursiva-lingua-estrangeira.pdf", {
          Espanhol: "uerj-2019-discursiva-lingua-estrangeira-espanhol-padrao.pdf",
          Frances: "uerj-2019-discursiva-lingua-estrangeira-frances-padrao.pdf",
          Ingles: "uerj-2019-discursiva-lingua-estrangeira-ingles-padrao.pdf",
        }),
        createUerjSubjectGroup(
          "Lingua Portuguesa e Literaturas",
          "uerj-2019-discursiva-lingua-portuguesa-literaturas.pdf",
          "uerj-2019-discursiva-lingua-portuguesa-literaturas-padrao.pdf"
        ),
        createUerjSubjectGroup(
          "Matematica",
          "uerj-2019-discursiva-matematica.pdf",
          "uerj-2019-discursiva-matematica-padrao.pdf"
        ),
        createUerjSubjectGroup("Quimica", "uerj-2019-discursiva-quimica.pdf", "uerj-2019-discursiva-quimica-padrao.pdf"),
        createUerjSubjectGroup("Redacao", "uerj-2019-discursiva-redacao.pdf", "uerj-2019-discursiva-redacao-padrao.pdf"),
      ],
      "9 materias com prova e padroes"
    ),
  ]),
  createUerjYear(2018, "1o EQ, 2o EQ e 9 discursivas com padroes", [
    createLocalUerjDownload("1o EQ", "uerj-2018-1-eq.pdf"),
    createLocalUerjDownload("Gabarito 1o EQ", "uerj-2018-1-eq-gabarito.pdf"),
    createLocalUerjDownload("2o EQ", "uerj-2018-2-eq.pdf"),
    createLocalUerjDownload("Gabarito 2o EQ", "uerj-2018-2-eq-gabarito.pdf"),
    createUerjDiscursiveGroup(
      [
        createUerjSubjectGroup("Biologia", "uerj-2018-discursiva-biologia.pdf", "uerj-2018-discursiva-biologia-padrao.pdf"),
        createUerjSubjectGroup("Fisica", "uerj-2018-discursiva-fisica.pdf", "uerj-2018-discursiva-fisica-padrao.pdf"),
        createUerjSubjectGroup(
          "Geografia",
          "uerj-2018-discursiva-geografia.pdf",
          "uerj-2018-discursiva-geografia-padrao.pdf"
        ),
        createUerjSubjectGroup("Historia", "uerj-2018-discursiva-historia.pdf", "uerj-2018-discursiva-historia-padrao.pdf"),
        createUerjLanguageGroup("uerj-2018-discursiva-lingua-estrangeira.pdf", {
          Espanhol: "uerj-2018-discursiva-lingua-estrangeira-espanhol-padrao.pdf",
          Frances: "uerj-2018-discursiva-lingua-estrangeira-frances-padrao.pdf",
          Ingles: "uerj-2018-discursiva-lingua-estrangeira-ingles-padrao.pdf",
        }),
        createUerjSubjectGroup(
          "Lingua Portuguesa e Literaturas",
          "uerj-2018-discursiva-lingua-portuguesa-literaturas.pdf",
          "uerj-2018-discursiva-lingua-portuguesa-literaturas-padrao.pdf"
        ),
        createUerjSubjectGroup(
          "Matematica",
          "uerj-2018-discursiva-matematica.pdf",
          "uerj-2018-discursiva-matematica-padrao.pdf"
        ),
        createUerjSubjectGroup("Quimica", "uerj-2018-discursiva-quimica.pdf", "uerj-2018-discursiva-quimica-padrao.pdf"),
        createUerjSubjectGroup("Redacao", "uerj-2018-discursiva-redacao.pdf", "uerj-2018-discursiva-redacao-padrao.pdf"),
      ],
      "9 materias com prova e padroes"
    ),
  ]),
  createUerjYear(2017, "1o EQ, 2o EQ e 9 discursivas com padroes", [
    createLocalUerjDownload("1o EQ", "uerj-2017-1-eq.pdf"),
    createLocalUerjDownload("Gabarito 1o EQ", "uerj-2017-1-eq-gabarito.pdf"),
    createLocalUerjDownload("2o EQ", "uerj-2017-2-eq.pdf"),
    createLocalUerjDownload("Gabarito 2o EQ", "uerj-2017-2-eq-gabarito.pdf"),
    createUerjDiscursiveGroup(
      [
        createUerjSubjectGroup("Biologia", "uerj-2017-discursiva-biologia.pdf", "uerj-2017-discursiva-biologia-padrao.pdf"),
        createUerjSubjectGroup("Fisica", "uerj-2017-discursiva-fisica.pdf", "uerj-2017-discursiva-fisica-padrao.pdf"),
        createUerjSubjectGroup(
          "Geografia",
          "uerj-2017-discursiva-geografia.pdf",
          "uerj-2017-discursiva-geografia-padrao.pdf"
        ),
        createUerjSubjectGroup("Historia", "uerj-2017-discursiva-historia.pdf", "uerj-2017-discursiva-historia-padrao.pdf"),
        createUerjLanguageGroup("uerj-2017-discursiva-lingua-estrangeira.pdf", {
          Espanhol: "uerj-2017-discursiva-lingua-estrangeira-espanhol-padrao.pdf",
          Frances: "uerj-2017-discursiva-lingua-estrangeira-frances-padrao.pdf",
          Ingles: "uerj-2017-discursiva-lingua-estrangeira-ingles-padrao.pdf",
        }),
        createUerjSubjectGroup(
          "Lingua Portuguesa Instrumental com Redacao",
          "uerj-2017-discursiva-lingua-portuguesa-instrumental-redacao.pdf",
          "uerj-2017-discursiva-lingua-portuguesa-instrumental-redacao-padrao.pdf"
        ),
        createUerjSubjectGroup(
          "Lingua Portuguesa / Literatura Brasileira",
          "uerj-2017-discursiva-lingua-portuguesa-literatura-brasileira.pdf",
          "uerj-2017-discursiva-lingua-portuguesa-literatura-brasileira-padrao.pdf"
        ),
        createUerjSubjectGroup(
          "Matematica",
          "uerj-2017-discursiva-matematica.pdf",
          "uerj-2017-discursiva-matematica-padrao.pdf"
        ),
        createUerjSubjectGroup("Quimica", "uerj-2017-discursiva-quimica.pdf", "uerj-2017-discursiva-quimica-padrao.pdf"),
      ],
      "9 materias com prova e padroes"
    ),
  ]),
  createUerjYear(2016, "1o EQ, 2o EQ e 9 discursivas com padroes", [
    createLocalUerjDownload("1o EQ", "uerj-2016-1-eq.pdf"),
    createLocalUerjDownload("Gabarito 1o EQ", "uerj-2016-1-eq-gabarito.pdf"),
    createLocalUerjDownload("2o EQ", "uerj-2016-2-eq.pdf"),
    createLocalUerjDownload("Gabarito 2o EQ", "uerj-2016-2-eq-gabarito.pdf"),
    createUerjDiscursiveGroup(
      [
        createUerjSubjectGroup("Biologia", "uerj-2016-discursiva-biologia.pdf", "uerj-2016-discursiva-biologia-padrao.pdf"),
        createUerjSubjectGroup("Fisica", "uerj-2016-discursiva-fisica.pdf", "uerj-2016-discursiva-fisica-padrao.pdf"),
        createUerjSubjectGroup(
          "Geografia",
          "uerj-2016-discursiva-geografia.pdf",
          "uerj-2016-discursiva-geografia-padrao.pdf"
        ),
        createUerjSubjectGroup("Historia", "uerj-2016-discursiva-historia.pdf", "uerj-2016-discursiva-historia-padrao.pdf"),
        createUerjLanguageGroup("uerj-2016-discursiva-lingua-estrangeira.pdf", {
          Espanhol: "uerj-2016-discursiva-lingua-estrangeira-espanhol-padrao.pdf",
          Frances: "uerj-2016-discursiva-lingua-estrangeira-frances-padrao.pdf",
          Ingles: "uerj-2016-discursiva-lingua-estrangeira-ingles-padrao.pdf",
        }),
        createUerjSubjectGroup(
          "Lingua Portuguesa Instrumental com Redacao",
          "uerj-2016-discursiva-lingua-portuguesa-instrumental-redacao.pdf",
          "uerj-2016-discursiva-lingua-portuguesa-instrumental-redacao-padrao.pdf"
        ),
        createUerjSubjectGroup(
          "Lingua Portuguesa / Literatura Brasileira",
          "uerj-2016-discursiva-lingua-portuguesa-literatura-brasileira.pdf",
          "uerj-2016-discursiva-lingua-portuguesa-literatura-brasileira-padrao.pdf"
        ),
        createUerjSubjectGroup(
          "Matematica",
          "uerj-2016-discursiva-matematica.pdf",
          "uerj-2016-discursiva-matematica-padrao.pdf"
        ),
        createUerjSubjectGroup("Quimica", "uerj-2016-discursiva-quimica.pdf", "uerj-2016-discursiva-quimica-padrao.pdf"),
      ],
      "9 materias com prova e padroes"
    ),
  ]),
];

export const EXAM_LIBRARY_META = {
  rangeLabel: "2016-2025",
  enemSourceLabel: "PDFs diretos com gabaritos oficiais empacotados no proprio site",
  uerjSourceLabel: "PDFs locais organizados por fase, materia e padrao correspondente",
  downloadRoute: EXAM_DOWNLOAD_ROUTE,
  uerjStageNote:
    "Os anos 2016-2020 e 2024-2025 agora incluem todas as materias da fase discursiva com seus padroes de resposta, em grupos por disciplina para manter a navegacao limpa. Os anos 2021-2023 seguem o formato de prova unica ou qualificacao disponivel no vestibular daquele periodo.",
};

export const buildExamDownloadUrl = (download) => {
  if (download.delivery === "browser-fetch") {
    return download.sourceUrl;
  }

  if (download.sourceUrl.startsWith("/")) {
    return isLocalPreviewRuntime() ? toProjectRelativePath(download.sourceUrl) : download.sourceUrl;
  }

  const params = new URLSearchParams({
    source: download.sourceUrl,
    filename: download.fileName,
  });

  const downloadUrl = `${EXAM_DOWNLOAD_ROUTE}?${params.toString()}`;

  return isLocalPreviewRuntime() ? toPublishedDownloadUrl(downloadUrl) : downloadUrl;
};

export const EXAM_LIBRARY = {
  enem: ENEM_LIBRARY,
  uerj: UERJ_LIBRARY,
};
