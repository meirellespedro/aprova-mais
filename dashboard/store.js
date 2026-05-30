import {
  STORAGE_KEY,
  MAX_ACTIVITY_ITEMS,
  FULL_DAY_LABELS,
  REVIEW_PATTERN,
} from "./constants.js";
import { TRACKS, SUBJECTS, PRACTICE_BANK, MILESTONE_BLUEPRINTS, STUDY_PATHS, PREMIUM_SUBJECT_TRAILS } from "./content.js";
import { REDACAO_TEMAS, REDACAO_COMPETENCIAS_ENEM, REDACAO_CRITERIOS_UERJ } from "./redacao.js";
import { CURSOS_RJ, CALENDARIO_PROVAS, AREA_LABELS, AREA_ORDER, cursoOfertadoNaUerj, getUerjCampi } from "./cursos.js";
import { TRAIL_VIDEO_LIBRARY } from "./video-library.js";
import {
  uid,
  toDateKey,
  getDateFromOffset,
  timeToMinutes,
  formatMinutes,
  formatShortDate,
  formatMonthDay,
  getDurationMinutes,
  getPlannerDayIndex,
} from "./utils.js";

export const getSubjectMeta = (subjectId) => SUBJECTS.find((subject) => subject.id === subjectId) ?? SUBJECTS[0];

export const getTrackMeta = (trackId) => TRACKS.find((track) => track.id === trackId) ?? TRACKS[0];

export const normalizeTrackId = (value) => (TRACKS.some((track) => track.id === value) ? value : "hibrido");

const inferTrackFromText = (value) => {
  const normalized = String(value ?? "").toLowerCase();

  if (normalized.includes("uerj") || normalized.includes("qualificacao") || normalized.includes("discurs")) {
    return "uerj";
  }

  if (normalized.includes("enem") || normalized.includes("tri")) {
    return "enem";
  }

  return "hibrido";
};

const isReviewTask = (task) => REVIEW_PATTERN.test(task.title);

const createInitialState = () => {
  const now = new Date();

  return {
    // Perfil definido no onboarding. Enquanto onboarded=false, o app abre o
    // assistente de 2 minutos em vez de um painel cheio de dados falsos.
    profile: {
      onboarded: false,
      track: "auto", // "auto" = inferido; "enem"/"uerj"/"hibrido" = escolhido pelo aluno
      course: "",
      examDate: "", // ISO (YYYY-MM-DD) da próxima prova-alvo
      createdAt: now.toISOString(),
    },
    weeklyGoalMinutes: 600,
    pomodoro: {
      durationSeconds: 1500,
      remainingSeconds: 1500,
      isRunning: false,
      endAt: null,
      completedSessions: 0,
      totalFocusMinutes: 0,
    },
    // Estado inicial LIMPO (sem seed). O aluno começa do zero e o que aparece é dele.
    tasks: [],
    sessions: [],
    mock: {
      currentQuestionIndex: 0,
      answers: {},
      submitted: false,
      startedAt: null, // timestamp do início do treino cronometrado
      config: { size: 10 }, // tamanho escolhido para o próximo simulado
      questionIds: [], // questões sorteadas do PRACTICE_BANK (vazio = sem simulado ativo)
      attempts: [],
    },
    practice: {
      subject: "all",
      topic: "all",
      track: "all",
      level: "all",
      tipo: "all",
      onlyErrors: false, // "Refazer os que errei"
      onlyReviews: false, // "Revisões de hoje" (revisão espaçada)
      query: "",
      // answers[questionId] = índice escolhido (>= 0) ou -1 quando só revelou o gabarito.
      answers: {},
    },
    activity: [],
    // Área de redação: prova-foco da autocorreção e notas que o aluno se deu.
    redacao: {
      prova: "enem",
      scores: {}, // { c1: 0..200, ..., u1: 0..5, ... }
    },
    studyTrails: {
      subject: "all",
      level: "all",
      prova: "all",
      query: "",
      activeLessonId: TRAIL_VIDEO_LIBRARY[0]?.id ?? "",
      completedLessonIds: [],
    },
    studyLog: {},
    // Revisão espaçada: reviews[questionId] = { due: "YYYY-MM-DD", stage: 0..n }
    reviews: {},
    // Evolução do acerto: performanceLog[dateKey] = { accuracy, answered } (acumulado)
    performanceLog: {},
  };
};

const normalizeTask = (task) => ({
  ...task,
  track: normalizeTrackId(task.track ?? inferTrackFromText(task.title)),
});

const normalizeSession = (session) => ({
  ...session,
  track: normalizeTrackId(session.track ?? inferTrackFromText(session.title)),
});

const normalizeAttempt = (attempt) => ({
  ...attempt,
  label: attempt.label ?? "Treino misto",
});

const normalizeStudyTrails = (studyTrails, defaults) => {
  const completedLessonIds = Array.isArray(studyTrails?.completedLessonIds)
    ? studyTrails.completedLessonIds.filter((lessonId) => TRAIL_VIDEO_LIBRARY.some((lesson) => lesson.id === lessonId))
    : defaults.studyTrails.completedLessonIds;
  const activeLessonId = TRAIL_VIDEO_LIBRARY.some((lesson) => lesson.id === studyTrails?.activeLessonId)
    ? studyTrails.activeLessonId
    : defaults.studyTrails.activeLessonId;

  return {
    ...defaults.studyTrails,
    ...studyTrails,
    activeLessonId,
    completedLessonIds,
  };
};

const normalizePractice = (practice, defaults) => {
  const base = defaults.practice;
  const validSubject = SUBJECTS.some((subject) => subject.id === practice?.subject) ? practice.subject : base.subject;
  const validTrack = ["all", ...TRACKS.map((track) => track.id)].includes(practice?.track) ? practice.track : base.track;
  const validLevel = ["all", "Fácil", "Médio", "Difícil"].includes(practice?.level) ? practice.level : base.level;
  const validTipo = ["all", "objetiva", "discursiva"].includes(practice?.tipo) ? practice.tipo : base.tipo;
  const topicsForSubject = PRACTICE_BANK.filter((question) => question.subject === validSubject).map((question) => question.topic);
  const validTopic = practice?.topic && topicsForSubject.includes(practice.topic) ? practice.topic : base.topic;
  const answers = {};
  if (practice?.answers && typeof practice.answers === "object") {
    for (const [id, index] of Object.entries(practice.answers)) {
      if (PRACTICE_BANK.some((question) => question.id === id) && Number.isInteger(index)) {
        answers[id] = index;
      }
    }
  }

  return {
    ...base,
    ...practice,
    subject: validSubject,
    topic: validTopic,
    track: validTrack,
    level: validLevel,
    tipo: validTipo,
    onlyErrors: typeof practice?.onlyErrors === "boolean" ? practice.onlyErrors : base.onlyErrors,
    onlyReviews: typeof practice?.onlyReviews === "boolean" ? practice.onlyReviews : base.onlyReviews,
    query: typeof practice?.query === "string" ? practice.query : base.query,
    answers,
  };
};

const VALID_PROFILE_TRACKS = ["auto", ...TRACKS.map((track) => track.id)];

const normalizeProfile = (profile, defaults) => {
  const base = defaults.profile;
  return {
    ...base,
    ...profile,
    onboarded: profile?.onboarded === true,
    track: VALID_PROFILE_TRACKS.includes(profile?.track) ? profile.track : base.track,
    course: typeof profile?.course === "string" ? profile.course : base.course,
    examDate: typeof profile?.examDate === "string" ? profile.examDate : base.examDate,
  };
};

const loadState = () => {
  const defaults = createInitialState();

  try {
    const rawState = localStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      return defaults;
    }

    const parsedState = JSON.parse(rawState);

    return {
      ...defaults,
      ...parsedState,
      profile: normalizeProfile(parsedState.profile, defaults),
      pomodoro: { ...defaults.pomodoro, ...parsedState.pomodoro },
      mock: {
        ...defaults.mock,
        ...parsedState.mock,
        config: { ...defaults.mock.config, ...parsedState.mock?.config },
        questionIds: Array.isArray(parsedState.mock?.questionIds)
          ? parsedState.mock.questionIds.filter((id) => typeof id === "string")
          : defaults.mock.questionIds,
        attempts: Array.isArray(parsedState.mock?.attempts)
          ? parsedState.mock.attempts.map(normalizeAttempt)
          : defaults.mock.attempts,
      },
      tasks: Array.isArray(parsedState.tasks) ? parsedState.tasks.map(normalizeTask) : defaults.tasks,
      sessions: Array.isArray(parsedState.sessions) ? parsedState.sessions.map(normalizeSession) : defaults.sessions,
      activity: Array.isArray(parsedState.activity) ? parsedState.activity : defaults.activity,
      studyTrails: normalizeStudyTrails(parsedState.studyTrails, defaults),
      practice: normalizePractice(parsedState.practice, defaults),
      redacao: {
        ...defaults.redacao,
        ...parsedState.redacao,
        prova: parsedState.redacao?.prova === "uerj" ? "uerj" : "enem",
        scores: parsedState.redacao?.scores && typeof parsedState.redacao.scores === "object" ? parsedState.redacao.scores : {},
      },
      studyLog:
        parsedState.studyLog && typeof parsedState.studyLog === "object"
          ? { ...defaults.studyLog, ...parsedState.studyLog }
          : defaults.studyLog,
      reviews:
        parsedState.reviews && typeof parsedState.reviews === "object" && !Array.isArray(parsedState.reviews)
          ? parsedState.reviews
          : defaults.reviews,
      performanceLog:
        parsedState.performanceLog && typeof parsedState.performanceLog === "object" && !Array.isArray(parsedState.performanceLog)
          ? parsedState.performanceLog
          : defaults.performanceLog,
    };
  } catch (error) {
    console.error("Não foi possível carregar o estado salvo do dashboard.", error);
    return defaults;
  }
};

export const state = loadState();

export const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const registerActivity = (message) => {
  state.activity.unshift({
    id: uid("activity"),
    message,
    timestamp: new Date().toISOString(),
  });

  state.activity = state.activity.slice(0, MAX_ACTIVITY_ITEMS);
};

export const adjustStudyMinutes = (dateKey, deltaMinutes) => {
  state.studyLog[dateKey] = Math.max(0, (state.studyLog[dateKey] ?? 0) + deltaMinutes);
};

export const registerStudyMinutes = (minutes, message, date = new Date()) => {
  adjustStudyMinutes(toDateKey(date), minutes);

  if (message) {
    registerActivity(message);
  }
};

export const getRecentStudyMinutes = (days) => {
  let totalMinutes = 0;

  for (let offset = 0; offset < days; offset += 1) {
    totalMinutes += state.studyLog[toDateKey(getDateFromOffset(-offset))] ?? 0;
  }

  return totalMinutes;
};

export const getPlannedMinutes = () =>
  state.sessions.reduce((total, session) => total + getDurationMinutes(session.start, session.end), 0);

export const getCompletedTasks = () => state.tasks.filter((task) => task.completed).length;

export const getOpenTasks = () => state.tasks.filter((task) => !task.completed);

export const getMockAccuracy = () => {
  if (!state.mock.attempts.length) {
    return 0;
  }

  const totalCorrect = state.mock.attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const totalQuestions = state.mock.attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  return totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
};

export const getLatestMockAttempt = () => state.mock.attempts[0] ?? null;

// Segundos decorridos no simulado em andamento (0 se ainda não começou).
export const getMockElapsedSeconds = () => {
  if (!state.mock.startedAt) {
    return 0;
  }
  return Math.max(0, Math.floor((Date.now() - state.mock.startedAt) / 1000));
};

export const startMockTimerIfNeeded = () => {
  if (!state.mock.startedAt && !state.mock.submitted) {
    state.mock.startedAt = Date.now();
    return true;
  }
  return false;
};

// ===== Simulado a partir do banco real (PRACTICE_BANK) =====
export const MOCK_SIZES = [10, 20, 30];

const shuffleInPlace = (array) => {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Questões objetivas disponíveis para a prova ativa (discursivas não entram no simulado).
const getMockPool = () => {
  const trackId = getActiveTrackId();
  return PRACTICE_BANK.filter((question) => {
    if (question.tipo === "discursiva") {
      return false;
    }
    if (trackId === "enem") return question.track === "enem";
    if (trackId === "uerj") return question.track === "uerj";
    return true; // híbrido/auto: todas
  });
};

export const getMockPoolSize = () => getMockPool().length;

export const isMockActive = () => state.mock.questionIds.length > 0;

export const getMockQuestions = () => {
  const byId = new Map(PRACTICE_BANK.map((question) => [question.id, question]));
  return state.mock.questionIds.map((id) => byId.get(id)).filter(Boolean);
};

export const setMockSize = (size) => {
  const valid = MOCK_SIZES.includes(Number(size)) ? Number(size) : MOCK_SIZES[0];
  state.mock.config.size = valid;
};

// Sorteia um novo simulado do tamanho pedido (limitado ao que existe no banco).
export const startMock = (size = state.mock.config.size) => {
  const pool = shuffleInPlace([...getMockPool()]);
  const requested = MOCK_SIZES.includes(Number(size)) ? Number(size) : MOCK_SIZES[0];
  const n = Math.min(requested, pool.length);

  state.mock.config.size = requested;
  state.mock.questionIds = pool.slice(0, n).map((question) => question.id);
  state.mock.answers = {};
  state.mock.currentQuestionIndex = 0;
  state.mock.submitted = false;
  state.mock.startedAt = Date.now(); // cronômetro arranca ao iniciar
  return n;
};

// Encerra o simulado e volta para a tela de escolha.
export const clearMock = () => {
  state.mock.questionIds = [];
  state.mock.answers = {};
  state.mock.currentQuestionIndex = 0;
  state.mock.submitted = false;
  state.mock.startedAt = null;
};

// Questões erradas (para a revisão ao final).
export const getMockReview = () =>
  getMockQuestions()
    .map((question) => {
      const picked = state.mock.answers[question.id];
      return { question, picked, correct: picked === question.correctIndex };
    })
    .filter((item) => typeof item.picked === "number" && !item.correct);

// ===== Banco de questões (practice) =====
export const getPracticeFilters = () => state.practice;

// Conteúdos (topics) disponíveis para a matéria selecionada, na ordem de coreTopics.
export const getPracticeTopics = (subjectId) => {
  if (!subjectId || subjectId === "all") {
    return [];
  }

  const presentTopics = new Set(
    PRACTICE_BANK.filter((question) => question.subject === subjectId).map((question) => question.topic)
  );
  const orderedTopics = getSubjectMeta(subjectId).coreTopics?.filter((topic) => presentTopics.has(topic)) ?? [];
  const extras = [...presentTopics].filter((topic) => !orderedTopics.includes(topic));

  return [...orderedTopics, ...extras];
};

// Uma questão objetiva foi "errada" quando o aluno escolheu uma alternativa
// (índice >= 0) diferente do gabarito. Revelar sem responder (-1) não conta como erro.
export const isWrongAnswer = (question) => {
  if (question.tipo === "discursiva") {
    return false;
  }
  const chosen = state.practice.answers[question.id];
  return Number.isInteger(chosen) && chosen >= 0 && chosen !== question.correctIndex;
};

export const getFilteredPracticeQuestions = () => {
  const { subject, topic, track, level, tipo, onlyErrors, onlyReviews, query } = state.practice;
  const normalizedQuery = query.trim().toLowerCase();

  return PRACTICE_BANK.filter((question) => {
    if (onlyErrors && !isWrongAnswer(question)) {
      return false;
    }

    if (onlyReviews && !isReviewDue(question.id)) {
      return false;
    }

    if (subject !== "all" && question.subject !== subject) {
      return false;
    }

    if (topic !== "all" && question.topic !== topic) {
      return false;
    }

    if (track !== "all" && question.track !== track) {
      return false;
    }

    if (level !== "all" && question.difficulty !== level) {
      return false;
    }

    if (tipo !== "all") {
      const isDiscursiva = question.tipo === "discursiva";
      if (tipo === "discursiva" ? !isDiscursiva : isDiscursiva) {
        return false;
      }
    }

    if (normalizedQuery) {
      const haystack = `${question.prompt} ${question.topic} ${getSubjectMeta(question.subject).label}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
};

export const getPracticeSubjectsInBank = () =>
  SUBJECTS.filter((subject) => PRACTICE_BANK.some((question) => question.subject === subject.id));

export const setPracticeSubject = (subjectId) => {
  const validSubject = subjectId === "all" || SUBJECTS.some((subject) => subject.id === subjectId) ? subjectId : "all";
  state.practice.subject = validSubject;
  // Ao trocar a matéria, o conteúdo volta para "todos" (os tópicos dependem da matéria).
  state.practice.topic = "all";
};

export const setPracticeTopic = (topic) => {
  const available = getPracticeTopics(state.practice.subject);
  state.practice.topic = topic === "all" || available.includes(topic) ? topic : "all";
};

export const setPracticeTrack = (track) => {
  state.practice.track = ["all", ...TRACKS.map((item) => item.id)].includes(track) ? track : "all";
};

export const setPracticeLevel = (level) => {
  state.practice.level = ["all", "Fácil", "Médio", "Difícil"].includes(level) ? level : "all";
};

export const setPracticeTipo = (tipo) => {
  state.practice.tipo = ["all", "objetiva", "discursiva"].includes(tipo) ? tipo : "all";
};

export const setPracticeOnlyErrors = (onlyErrors) => {
  state.practice.onlyErrors = Boolean(onlyErrors);
};

export const setPracticeOnlyReviews = (onlyReviews) => {
  state.practice.onlyReviews = Boolean(onlyReviews);
};

export const setPracticeQuery = (query) => {
  state.practice.query = String(query ?? "");
};

export const setPracticeAnswer = (questionId, optionIndex) => {
  state.practice.answers = { ...state.practice.answers, [questionId]: optionIndex };
  // Atualiza a revisão espaçada e registra um ponto na linha de evolução.
  updateReviewForAnswer(questionId, optionIndex);
  recordPerformanceSnapshot();
};

// Revela o gabarito sem registrar uma escolha (botão "Ver resposta").
export const revealPracticeAnswer = (questionId) => {
  if (!(questionId in state.practice.answers)) {
    setPracticeAnswer(questionId, -1);
  }
};

export const getPracticeAnswer = (questionId) =>
  questionId in state.practice.answers ? state.practice.answers[questionId] : null;

export const isPracticeRevealed = (questionId) => questionId in state.practice.answers;

export const resetPracticeFilters = () => {
  state.practice.subject = "all";
  state.practice.topic = "all";
  state.practice.track = "all";
  state.practice.level = "all";
  state.practice.tipo = "all";
  state.practice.onlyErrors = false;
  state.practice.onlyReviews = false;
  state.practice.query = "";
};

// ===== Revisão espaçada (SRS leve) =====
const REVIEW_INTERVALS = [1, 3, 7, 16]; // dias até a próxima revisão por estágio
const PRACTICE_BY_ID = new Map(PRACTICE_BANK.map((question) => [question.id, question]));

const todayKey = () => toDateKey(new Date());
const addDaysKey = (days) => toDateKey(getDateFromOffset(days));

export const isReviewDue = (questionId) => {
  const review = state.reviews[questionId];
  return Boolean(review) && review.due <= todayKey();
};

// Chamado a cada resposta: erro agenda revisão; acerto avança/gradua a questão.
const updateReviewForAnswer = (questionId, optionIndex) => {
  const question = PRACTICE_BY_ID.get(questionId);
  if (!question || question.tipo === "discursiva" || !Number.isInteger(optionIndex) || optionIndex < 0) {
    return; // só objetivas efetivamente respondidas
  }

  const isCorrect = optionIndex === question.correctIndex;
  const current = state.reviews[questionId];
  const reviews = { ...state.reviews };

  if (!isCorrect) {
    // Errou: (re)agenda do estágio 0 para amanhã.
    reviews[questionId] = { stage: 0, due: addDaysKey(REVIEW_INTERVALS[0]) };
  } else if (current) {
    // Acertou uma questão que estava em revisão: avança o intervalo.
    const nextStage = current.stage + 1;
    if (nextStage >= REVIEW_INTERVALS.length) {
      delete reviews[questionId]; // dominada — sai da fila de revisão
    } else {
      reviews[questionId] = { stage: nextStage, due: addDaysKey(REVIEW_INTERVALS[nextStage]) };
    }
  }

  state.reviews = reviews;
};

// Questões com revisão vencida (due <= hoje) que ainda existem no banco.
export const getDueReviewQuestions = () =>
  Object.keys(state.reviews)
    .filter((id) => isReviewDue(id) && PRACTICE_BY_ID.has(id))
    .map((id) => PRACTICE_BY_ID.get(id));

export const getDueReviewCount = () => getDueReviewQuestions().length;

// ===== Evolução do acerto (linha do tempo) =====
export const recordPerformanceSnapshot = () => {
  const performance = getPracticePerformance();
  if (performance.answered > 0) {
    state.performanceLog = {
      ...state.performanceLog,
      [todayKey()]: { accuracy: performance.accuracy, answered: performance.answered },
    };
  }
};

export const getPerformanceTimeline = (maxDays = 12) =>
  Object.entries(state.performanceLog)
    .map(([dateKey, value]) => ({ dateKey, accuracy: Number(value.accuracy) || 0, answered: Number(value.answered) || 0 }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .slice(-maxDays);

// ===== Motor de desempenho (pontos fracos) =====
// Lê o que JÁ é salvo em state.practice.answers e transforma em diagnóstico:
// acerto/erro por matéria e por conteúdo. Considera apenas questões objetivas
// efetivamente respondidas (índice >= 0); discursivas e "só revelei" (-1) ficam de fora.
export const getPracticePerformance = () => {
  const bySubject = new Map();
  const byTopic = new Map();
  let answered = 0;
  let correct = 0;
  const wrongIds = [];

  for (const question of PRACTICE_BANK) {
    if (question.tipo === "discursiva") {
      continue;
    }

    const chosen = state.practice.answers[question.id];
    if (!Number.isInteger(chosen) || chosen < 0) {
      continue;
    }

    const isCorrect = chosen === question.correctIndex;
    answered += 1;
    if (isCorrect) {
      correct += 1;
    } else {
      wrongIds.push(question.id);
    }

    const subjectEntry = bySubject.get(question.subject) ?? { subject: question.subject, answered: 0, correct: 0 };
    subjectEntry.answered += 1;
    subjectEntry.correct += Number(isCorrect);
    bySubject.set(question.subject, subjectEntry);

    const topicKey = `${question.subject}::${question.topic}`;
    const topicEntry = byTopic.get(topicKey) ?? { subject: question.subject, topic: question.topic, answered: 0, correct: 0 };
    topicEntry.answered += 1;
    topicEntry.correct += Number(isCorrect);
    byTopic.set(topicKey, topicEntry);
  }

  const withAccuracy = (entry) => ({
    ...entry,
    accuracy: entry.answered ? Math.round((entry.correct / entry.answered) * 100) : 0,
  });

  const subjects = [...bySubject.values()]
    .map((entry) => ({ ...withAccuracy(entry), label: getSubjectMeta(entry.subject).label }))
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered);

  const topics = [...byTopic.values()].map(withAccuracy);

  // Pontos fracos = conteúdos com ao menos 2 questões respondidas e acerto < 70%.
  const weakTopics = topics
    .filter((entry) => entry.answered >= 2 && entry.accuracy < 70)
    .map((entry) => ({ ...entry, label: getSubjectMeta(entry.subject).label }))
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered);

  return {
    answered,
    correct,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    wrongCount: wrongIds.length,
    wrongIds,
    subjects,
    topics,
    weakTopics,
  };
};

// "Estudar hoje": a próxima ação concreta, baseada no perfil + desempenho real.
// Os pesos do curso entram aqui: pontos fracos nas matérias que mais contam
// para o curso escolhido têm prioridade.
export const getStudyTodaySuggestion = () => {
  const performance = getPracticePerformance();
  const trackId = getActiveTrackId();
  const trackMeta = getTrackMeta(trackId);
  const curso = getCursoMeta();
  const pesos = getCursoPesoSubjects();
  const pesoIds = new Set(pesos.map((subject) => subject.id));

  // Revisão espaçada tem prioridade: o que venceu hoje precisa voltar agora.
  const dueReviews = getDueReviewCount();
  if (dueReviews > 0) {
    return {
      kind: "reviews",
      eyebrow: "Revisão espaçada",
      title: `${dueReviews} revis${dueReviews === 1 ? "ão" : "ões"} para hoje`,
      copy: "A memória fixa quando você revê no tempo certo. Refaça agora as questões que voltaram para revisão.",
      ctaLabel: "Fazer revisões de hoje",
      target: "#banco",
    };
  }

  if (performance.wrongCount >= 3) {
    return {
      kind: "errors",
      eyebrow: "Recupere o que escapou",
      title: `Refaça ${performance.wrongCount} quest${performance.wrongCount === 1 ? "ão" : "ões"} que você errou`,
      copy: "Transformar erro em acerto é o estudo que mais rende. Comece pelo que já apareceu como dúvida.",
      ctaLabel: "Refazer meus erros",
      target: "#banco",
    };
  }

  if (performance.weakTopics.length) {
    // Prioriza pontos fracos nas matérias de maior peso do curso.
    const ordered = [...performance.weakTopics].sort((a, b) => {
      const pa = pesoIds.has(a.subject) ? 0 : 1;
      const pb = pesoIds.has(b.subject) ? 0 : 1;
      return pa - pb || a.accuracy - b.accuracy || b.answered - a.answered;
    });
    const weakest = ordered[0];
    const isPeso = pesoIds.has(weakest.subject);

    return {
      kind: "weak-topic",
      eyebrow: isPeso ? "Ponto fraco no que mais conta" : "Seu ponto fraco agora",
      title: `Treine ${weakest.topic} (${weakest.label})`,
      copy: isPeso && curso
        ? `É uma matéria de maior peso para ${curso.nome} e você está com ${weakest.accuracy}% de acerto. Reforçar aqui rende dobrado.`
        : `Você está com ${weakest.accuracy}% de acerto nesse conteúdo. Algumas questões dirigidas já mudam esse número.`,
      ctaLabel: "Treinar esse conteúdo",
      target: "#banco",
      subject: weakest.subject,
      topic: weakest.topic,
    };
  }

  if (performance.answered < 5) {
    // Com curso definido, começa pela matéria de maior peso.
    if (curso && pesos.length) {
      const first = pesos[0];
      return {
        kind: "start",
        eyebrow: "Comece pelo que mais conta",
        title: `Comece por ${first.label}`,
        copy: `${first.label} é uma das matérias de maior peso para ${curso.nome}. Faça uma rodada e o Aprova+ começa a mapear seus pontos fracos.`,
        ctaLabel: `Treinar ${first.label}`,
        target: "#banco",
        subject: first.id,
      };
    }

    return {
      kind: "start",
      eyebrow: "Comece por aqui",
      title: "Responda suas primeiras questões",
      copy: `Faça uma rodada curta no banco para o Aprova+ mapear seus pontos fortes e fracos no foco ${trackMeta.shortLabel}.`,
      ctaLabel: "Abrir banco de questões",
      target: "#banco",
    };
  }

  return {
    kind: "steady",
    eyebrow: "Ritmo bom",
    title: `${performance.accuracy}% de acerto no seu treino`,
    copy: "Sem pontos fracos abertos no momento. Suba a dificuldade ou faça um simulado cronometrado para manter a pressão.",
    ctaLabel: "Fazer um simulado",
    target: "#simulado",
  };
};

// ===== Redação =====
export const getRedacaoState = () => state.redacao;

export const getRedacaoTemas = (prova = state.redacao.prova) =>
  REDACAO_TEMAS.filter((tema) => tema.prova === prova);

export const getRedacaoCriteria = (prova = state.redacao.prova) =>
  prova === "uerj" ? REDACAO_CRITERIOS_UERJ : REDACAO_COMPETENCIAS_ENEM;

// Escala máxima por critério e total da prova selecionada.
export const getRedacaoScale = (prova = state.redacao.prova) =>
  prova === "uerj"
    ? { step: 1, max: 5, total: REDACAO_CRITERIOS_UERJ.length * 5, unidade: "pts" }
    : { step: 40, max: 200, total: REDACAO_COMPETENCIAS_ENEM.length * 200, unidade: "pts" };

export const getRedacaoTotal = (prova = state.redacao.prova) => {
  const criteria = getRedacaoCriteria(prova);
  return criteria.reduce((sum, item) => sum + (Number(state.redacao.scores[item.id]) || 0), 0);
};

export const setRedacaoProva = (prova) => {
  state.redacao.prova = prova === "uerj" ? "uerj" : "enem";
};

export const setRedacaoScore = (criterioId, value) => {
  const numeric = Number(value);
  state.redacao.scores = {
    ...state.redacao.scores,
    [criterioId]: Number.isFinite(numeric) ? numeric : 0,
  };
};

// ===== Perfil / onboarding =====
export const getProfile = () => state.profile;

export const isOnboarded = () => state.profile?.onboarded === true;

export const completeOnboarding = ({ track, course, weeklyGoalMinutes }) => {
  state.profile.onboarded = true;
  state.profile.track = VALID_PROFILE_TRACKS.includes(track) ? track : "auto";
  // course agora é o id de um curso do RJ (ou "" se o aluno não escolheu).
  state.profile.course = CURSOS_RJ.some((curso) => curso.id === course) ? course : "";

  if (Number.isFinite(weeklyGoalMinutes) && weeklyGoalMinutes > 0) {
    state.weeklyGoalMinutes = Math.round(weeklyGoalMinutes);
  }
};

// ===== Cursos do RJ e pesos por matéria =====
export const getCursoMeta = (courseId = state.profile?.course) =>
  CURSOS_RJ.find((curso) => curso.id === courseId) ?? null;

// Cursos agrupados por área, na ordem de AREA_ORDER (para o seletor com optgroups).
// Quando `track === "uerj"`, mostra apenas os cursos oferecidos pela UERJ.
export const getCursosByArea = (track) => {
  const base = track === "uerj" ? CURSOS_RJ.filter((curso) => cursoOfertadoNaUerj(curso.id)) : CURSOS_RJ;

  return AREA_ORDER.map((area) => ({
    area,
    label: AREA_LABELS[area] ?? area,
    cursos: base.filter((curso) => curso.area === area).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
  })).filter((grupo) => grupo.cursos.length);
};

// Campi da UERJ que oferecem o curso (vazio se não for curso da UERJ).
export const getCursoCampi = (courseId = state.profile?.course) => getUerjCampi(courseId);

// Matérias de maior peso do curso, já com label/accent vindos de SUBJECTS.
export const getCursoPesoSubjects = (courseId = state.profile?.course) => {
  const curso = getCursoMeta(courseId);
  if (!curso) {
    return [];
  }
  return curso.pesos.map((subjectId) => getSubjectMeta(subjectId)).filter(Boolean);
};

// ===== Calendário das provas (a plataforma informa a data) =====
const daysUntilISO = (iso) => {
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

// Todas as datas relevantes para a trilha (hibrido/auto = ENEM + UERJ), ordenadas.
export const getExamSchedule = (track = getActiveTrackId()) => {
  const keys = track === "enem" ? ["enem"] : track === "uerj" ? ["uerj"] : ["enem", "uerj"];
  const dias = [];

  keys.forEach((key) => {
    const prova = CALENDARIO_PROVAS[key];
    if (!prova) {
      return;
    }
    prova.dias.forEach((dia) => {
      dias.push({
        prova: key,
        provaNome: prova.nome,
        fonte: prova.fonte,
        fonteUrl: prova.fonteUrl,
        label: dia.label,
        data: dia.data,
        detalhe: dia.detalhe,
        previsto: Boolean(dia.previsto),
        daysUntil: daysUntilISO(dia.data),
      });
    });
  });

  return dias.sort((a, b) => a.data.localeCompare(b.data));
};

// Próxima prova ainda por vir (ou null se todas já passaram).
export const getNextExam = (track = getActiveTrackId()) => {
  const schedule = getExamSchedule(track);
  return schedule.find((dia) => typeof dia.daysUntil === "number" && dia.daysUntil >= 0) ?? null;
};

// Mantido por compatibilidade: dias até a próxima prova (ou null).
export const getDaysUntilExam = () => getNextExam()?.daysUntil ?? null;

// "Recomeçar do zero": limpa tudo e devolve o aluno ao onboarding.
export const resetAllProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
  const fresh = createInitialState();
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
};

// Substitui o estado em memória pelo que está salvo (após import).
const replaceLiveState = (nextState) => {
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, nextState);
};

// ===== Backup: exportar / importar progresso =====
export const exportProgress = () =>
  JSON.stringify({ app: "aprova-plus", version: STORAGE_KEY, exportedAt: new Date().toISOString(), state }, null, 2);

// Aceita tanto o formato com envelope ({app, state}) quanto o estado puro.
export const importProgress = (jsonString) => {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Arquivo de progresso inválido.");
  }
  const incoming = parsed.state && typeof parsed.state === "object" ? parsed.state : parsed;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    throw new Error("Arquivo de progresso inválido.");
  }

  // Grava e recarrega pelo loadState, que normaliza/valida tudo.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
  replaceLiveState(loadState());
};

export const getStudyStreak = () => {
  let streak = 0;

  for (let offset = 0; offset < 28; offset += 1) {
    const key = toDateKey(getDateFromOffset(-offset));

    if ((state.studyLog[key] ?? 0) <= 0) {
      break;
    }

    streak += 1;
  }

  return streak;
};

export const getWeeklyGoalProgress = () =>
  state.weeklyGoalMinutes ? Math.round((getRecentStudyMinutes(7) / state.weeklyGoalMinutes) * 100) : 0;

export const getTrackStats = () =>
  TRACKS.map((track) => {
    const tasks = state.tasks.filter((task) => normalizeTrackId(task.track) === track.id);
    const sessions = state.sessions.filter((session) => normalizeTrackId(session.track) === track.id);
    const minutes = sessions.reduce((total, session) => total + getDurationMinutes(session.start, session.end), 0);

    return {
      ...track,
      tasks,
      sessions,
      minutes,
      taskCount: tasks.length,
      openTasks: tasks.filter((task) => !task.completed).length,
      completedTasks: tasks.filter((task) => task.completed).length,
    };
  });

export const getActiveTrackId = () => {
  // Se o aluno escolheu a prova no onboarding, essa escolha manda — nada de inferir.
  if (state.profile?.track && state.profile.track !== "auto") {
    return state.profile.track;
  }

  const [hybrid, enem, uerj] = getTrackStats();
  const hybridScore = hybrid.minutes + hybrid.taskCount * 25;
  const enemScore = enem.minutes + enem.taskCount * 25;
  const uerjScore = uerj.minutes + uerj.taskCount * 25;

  if (enemScore === 0 && uerjScore === 0) {
    return "hibrido";
  }

  if (enemScore > 0 && enemScore >= Math.max(uerjScore * 1.4, hybridScore * 1.08)) {
    return "enem";
  }

  if (uerjScore > 0 && uerjScore >= Math.max(enemScore * 1.4, hybridScore * 1.08)) {
    return "uerj";
  }

  if (enemScore > 0 && uerjScore > 0) {
    return "hibrido";
  }

  if (hybridScore > 0) {
    return "hibrido";
  }

  if (enemScore > 0) {
    return "enem";
  }

  if (uerjScore > 0) {
    return "uerj";
  }

  return "hibrido";
};

export const getCurrentTrackMeta = () => getTrackMeta(getActiveTrackId());

export const getSubjectDistribution = () => {
  const minutesBySubject = new Map();

  state.sessions.forEach((session) => {
    minutesBySubject.set(session.subject, (minutesBySubject.get(session.subject) ?? 0) + getDurationMinutes(session.start, session.end));
  });

  if ([...minutesBySubject.values()].every((minutes) => minutes === 0)) {
    state.tasks.forEach((task) => {
      minutesBySubject.set(task.subject, (minutesBySubject.get(task.subject) ?? 0) + task.estimate);
    });
  }

  const maxMinutes = Math.max(...minutesBySubject.values(), 1);

  return SUBJECTS.map((subject) => {
    const minutes = minutesBySubject.get(subject.id) ?? 0;
    return {
      ...subject,
      minutes,
      percentage: minutes ? Math.round((minutes / maxMinutes) * 100) : 0,
    };
  }).filter((subject) => subject.minutes > 0);
};

const getFocusedTasks = (subjectIds, trackIds) =>
  state.tasks.filter((task) => subjectIds.includes(task.subject) && trackIds.includes(normalizeTrackId(task.track)));

const getFocusedSessions = (subjectIds, trackIds) =>
  state.sessions.filter((session) => subjectIds.includes(session.subject) && trackIds.includes(normalizeTrackId(session.track)));

const getSessionMinutes = (sessions) =>
  sessions.reduce((total, session) => total + getDurationMinutes(session.start, session.end), 0);

export const getStudyPathCards = () =>
  STUDY_PATHS.map((path) => {
    const tasks = getFocusedTasks(path.subjects, path.trackIds);
    const sessions = getFocusedSessions(path.subjects, path.trackIds);
    const completedTasks = tasks.filter((task) => task.completed).length;
    const coveredSubjects = new Set([...tasks, ...sessions].map((item) => item.subject)).size;
    const sessionMinutes = getSessionMinutes(sessions);
    const executionScore = tasks.length ? completedTasks / tasks.length : 0;
    const planningScore = Math.min(sessions.length / path.expectedSessions, 1);
    const breadthScore = Math.min(coveredSubjects / path.expectedSubjects, 1);
    const progress = Math.round(executionScore * 45 + planningScore * 35 + breadthScore * 20);
    const rhythmLabel =
      progress >= 75 ? "Ritmo premium" : progress >= 45 ? "Trilha em consolidação" : "Base ainda abrindo";
    const taskSummary = tasks.length
      ? `${completedTasks}/${tasks.length} tarefa${tasks.length === 1 ? "" : "s"} concluída${completedTasks === 1 ? "" : "s"}`
      : "sem tarefa fechada ainda";
    const focusCopy =
      tasks.length || sessions.length
        ? `${sessions.length} sessão${sessions.length === 1 ? "" : "es"} e ${taskSummary} neste eixo.`
        : "Ainda sem blocos conectados a essa rota de estudo.";
    const nextAction =
      sessions.length === 0
        ? `Planeje o primeiro bloco da ${path.label.toLowerCase()}.`
        : completedTasks === 0
          ? path.nextFocus
          : progress < 60
            ? `Aprofunde ${path.milestones[1].toLowerCase()} antes de ampliar a carga.`
            : `Suba a exigência com ${path.milestones[2].toLowerCase()}.`;

    return {
      ...path,
      progress,
      completedTasks,
      coveredSubjects,
      sessionCount: sessions.length,
      sessionMinutes,
      rhythmLabel,
      focusCopy,
      nextAction,
      leadSubjects: path.subjects.slice(0, 4).map((subjectId) => getSubjectMeta(subjectId)),
    };
  });

export const getPremiumTrailCards = () =>
  PREMIUM_SUBJECT_TRAILS.map((trail) => {
    const tasks = state.tasks.filter((task) => task.subject === trail.subjectId);
    const sessions = state.sessions.filter((session) => session.subject === trail.subjectId);
    const completedTasks = tasks.filter((task) => task.completed).length;
    const sessionMinutes = getSessionMinutes(sessions);
    const executionScore = tasks.length ? completedTasks / tasks.length : 0;
    const planningScore = Math.min(sessions.length / trail.modules.length, 1);
    const focusScore = Math.min(sessionMinutes / trail.expectedMinutes, 1);
    const progress = Math.round(executionScore * 40 + planningScore * 35 + focusScore * 25);
    const nextModuleIndex = progress >= 75 ? 3 : progress >= 50 ? 2 : progress >= 25 ? 1 : 0;
    const nextModule = trail.modules[Math.min(nextModuleIndex, trail.modules.length - 1)];
    const taskSummary = tasks.length
      ? `${completedTasks}/${tasks.length} tarefa${tasks.length === 1 ? "" : "s"} concluída${completedTasks === 1 ? "" : "s"}`
      : "sem tarefa fechada ainda";
    const statusCopy =
      tasks.length || sessions.length
        ? `${taskSummary} e ${formatMinutes(sessionMinutes)} planejados.`
        : "A trilha ainda não foi ligada ao planner ou a fila de execução.";

    return {
      ...trail,
      subject: getSubjectMeta(trail.subjectId),
      progress,
      completedTasks,
      sessionCount: sessions.length,
      sessionMinutes,
      nextModule,
      statusCopy,
    };
  });

export const getCurriculumCatalog = () => SUBJECTS;

export const getCurriculumSnapshot = () => ({
  totalSubjects: SUBJECTS.length,
  premiumCount: PREMIUM_SUBJECT_TRAILS.length,
  mappedForSelection: SUBJECTS.filter((subject) => Boolean(subject.id)).length,
});

export const getTrailLessons = () => TRAIL_VIDEO_LIBRARY;

// Aba "Matemática básica": os tópicos fundamentais (módulo base de matemática),
// que sustentam ENEM e UERJ, já com videoaula.
export const getBasicMathLessons = () =>
  TRAIL_VIDEO_LIBRARY.filter(
    (lesson) => lesson.subjectId === "matematica" && lesson.module === "Matemática básica"
  );

// Ciclo de edital vigente (define quais obras literárias da UERJ aparecem em destaque).
// Trocar aqui quando o edital do próximo ano sair. [VERIFICAR EDITAL OFICIAL]
export const CURRENT_CICLO = "2027";

// Área "UERJ Discursiva" (2ª fase): método/estratégia, obras do ciclo e redação UERJ.
export const getMetodoUerjLessons = () =>
  TRAIL_VIDEO_LIBRARY.filter((lesson) => lesson.subjectId === "metodo-uerj");

export const getUerjObras = () =>
  TRAIL_VIDEO_LIBRARY.filter(
    (lesson) => lesson.module === "Obras Literárias UERJ" && lesson.cicloEdital === CURRENT_CICLO
  );

export const getRedacaoUerjLesson = () =>
  TRAIL_VIDEO_LIBRARY.find((lesson) => lesson.id === "redacao-redacao-uerj");

export const getTrailSubjects = () => SUBJECTS;

export const getTrailFilterState = () => state.studyTrails;

// Compara nível/foco ignorando acento e caixa: os <option> do HTML e os dados
// da biblioteca podem divergir num acento (ex.: "Básico" vs "Basico") e isso não
// pode zerar o filtro.
const normalizeLabel = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

const VALID_PROVAS = ["enem", "uerj-qualificacao", "uerj-discursiva"];

export const getFilteredTrailLessons = () => {
  const { subject, level, query } = state.studyTrails;
  // tolera estado salvo antigo (focus="ENEM"/"UERJ"): se não for prova válida, ignora.
  const prova = VALID_PROVAS.includes(state.studyTrails.prova) ? state.studyTrails.prova : "all";
  const normalizedQuery = query.trim().toLowerCase();

  return TRAIL_VIDEO_LIBRARY.filter((lesson) => {
    if (subject !== "all" && lesson.subjectId !== subject) {
      return false;
    }

    if (level !== "all" && normalizeLabel(lesson.level) !== normalizeLabel(level)) {
      return false;
    }

    if (prova !== "all" && !(lesson.provas ?? []).includes(prova)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [lesson.topic, lesson.description, lesson.teacher, lesson.channel]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
};

export const getActiveTrailLesson = () => {
  const filteredLessons = getFilteredTrailLessons();
  const activeLesson =
    filteredLessons.find((lesson) => lesson.id === state.studyTrails.activeLessonId) ??
    TRAIL_VIDEO_LIBRARY.find((lesson) => lesson.id === state.studyTrails.activeLessonId) ??
    filteredLessons[0] ??
    TRAIL_VIDEO_LIBRARY[0] ??
    null;

  return activeLesson;
};

export const getTrailProgress = () => {
  const completedSet = new Set(state.studyTrails.completedLessonIds);
  const filteredLessons = getFilteredTrailLessons();
  const completedFiltered = filteredLessons.filter((lesson) => completedSet.has(lesson.id)).length;
  const totalLessons = TRAIL_VIDEO_LIBRARY.length;
  const completedTotal = state.studyTrails.completedLessonIds.length;

  return {
    totalLessons,
    completedTotal,
    filteredCount: filteredLessons.length,
    completedFiltered,
    percentage: totalLessons ? Math.round((completedTotal / totalLessons) * 100) : 0,
  };
};

export const getTrailSubjectOverview = () =>
  SUBJECTS.map((subject) => {
    const subjectLessons = TRAIL_VIDEO_LIBRARY.filter((lesson) => lesson.subjectId === subject.id);
    const completedCount = subjectLessons.filter((lesson) => state.studyTrails.completedLessonIds.includes(lesson.id)).length;

    return {
      ...subject,
      lessonCount: subjectLessons.length,
      completedCount,
      percentage: subjectLessons.length ? Math.round((completedCount / subjectLessons.length) * 100) : 0,
    };
  });

export const setTrailSubjectFilter = (subject) => {
  state.studyTrails.subject = subject;
};

export const setTrailLevelFilter = (level) => {
  state.studyTrails.level = level;
};

export const setTrailProvaFilter = (prova) => {
  state.studyTrails.prova = prova;
};

export const setTrailQuery = (query) => {
  state.studyTrails.query = query;
};

export const setActiveTrailLesson = (lessonId) => {
  state.studyTrails.activeLessonId = lessonId;
};

export const ensureActiveTrailLesson = () => {
  const filteredLessons = getFilteredTrailLessons();
  if (!filteredLessons.length) {
    return;
  }

  if (!filteredLessons.some((lesson) => lesson.id === state.studyTrails.activeLessonId)) {
    state.studyTrails.activeLessonId = filteredLessons[0].id;
  }
};

export const toggleTrailLessonCompleted = (lessonId) => {
  const completedSet = new Set(state.studyTrails.completedLessonIds);

  if (completedSet.has(lessonId)) {
    completedSet.delete(lessonId);
  } else {
    completedSet.add(lessonId);
  }

  state.studyTrails.completedLessonIds = [...completedSet];
};

export const getCurrentPomodoroSeconds = () => {
  if (!state.pomodoro.isRunning || !state.pomodoro.endAt) {
    return state.pomodoro.remainingSeconds;
  }

  return Math.max(0, Math.ceil((state.pomodoro.endAt - Date.now()) / 1000));
};

export const getNextSession = () => {
  if (!state.sessions.length) {
    return null;
  }

  const now = new Date();
  const currentWeekMinutes = getPlannerDayIndex(now) * 1440 + now.getHours() * 60 + now.getMinutes();

  const sessions = state.sessions.map((session) => {
    const sessionStart = timeToMinutes(session.start);
    let absoluteMinutes = session.day * 1440 + sessionStart;

    if (absoluteMinutes <= currentWeekMinutes) {
      absoluteMinutes += 7 * 1440;
    }

    return {
      ...session,
      absoluteMinutes,
      subjectMeta: getSubjectMeta(session.subject),
      trackMeta: getTrackMeta(session.track),
    };
  });

  const nextSession = sessions.sort((sessionA, sessionB) => sessionA.absoluteMinutes - sessionB.absoluteMinutes)[0];

  return {
    ...nextSession,
    minutesAway: nextSession.absoluteMinutes - currentWeekMinutes,
    dayLabel: FULL_DAY_LABELS[nextSession.day] ?? FULL_DAY_LABELS[0],
  };
};

export const getReviewBacklogCount = () => getOpenTasks().filter(isReviewTask).length;

export const getCoverageScore = () => {
  const completedTasks = getCompletedTasks();
  const totalTasks = state.tasks.length;
  const weeklyFocus = getRecentStudyMinutes(7);
  const plannedMinutes = getPlannedMinutes();
  const mockAccuracy = getMockAccuracy();
  const subjectBreadth = Math.min(getSubjectDistribution().length / 6, 1);
  const reviewBacklog = getReviewBacklogCount();
  const activeTrackId = getActiveTrackId();
  const trackStats = getTrackStats();
  const currentTrack = trackStats.find((track) => track.id === activeTrackId) ?? trackStats[0];
  const balanceFactor =
    activeTrackId === "hibrido"
      ? Number(trackStats.some((track) => track.id === "enem" && (track.taskCount > 0 || track.minutes > 0))) +
        Number(trackStats.some((track) => track.id === "uerj" && (track.taskCount > 0 || track.minutes > 0)))
      : Number(currentTrack.taskCount > 0 || currentTrack.minutes > 0);

  const executionWeight = totalTasks ? (completedTasks / totalTasks) * 24 : 0;
  const focusWeight = Math.min(weeklyFocus / state.weeklyGoalMinutes, 1) * 24;
  const planningWeight = Math.min(plannedMinutes / state.weeklyGoalMinutes, 1) * 18;
  const mockWeight = (mockAccuracy / 100) * 16;
  const breadthWeight = subjectBreadth * 10;
  const balanceWeight = Math.min(balanceFactor / (activeTrackId === "hibrido" ? 2 : 1), 1) * 8;
  const reviewPenalty = reviewBacklog >= 3 ? 6 : reviewBacklog >= 1 ? 3 : 0;

  return Math.max(0, Math.round(executionWeight + focusWeight + planningWeight + mockWeight + breadthWeight + balanceWeight - reviewPenalty));
};

export const getPlanFocus = () => {
  const activeTrack = getCurrentTrackMeta();
  const openTasks = getOpenTasks();
  const reviewBacklog = getReviewBacklogCount();
  const weeklyGoalProgress = getWeeklyGoalProgress();
  const latestAttempt = getLatestMockAttempt();

  if (reviewBacklog >= 2) {
    return {
      title: "Sua maior alavanca agora e transformar erro em revisão ativa.",
      copy: `${reviewBacklog} bloco${reviewBacklog === 1 ? "" : "s"} de revisão seguem em aberto. Fechar esse ciclo melhora consolidação e reduz retrabalho nas próximas sessões.`,
    };
  }

  if (weeklyGoalProgress < 70) {
    return {
      title: "A semana ainda precisa ganhar tração antes de sofisticar o plano.",
      copy: `Feche mais ${formatMinutes(Math.max(state.weeklyGoalMinutes - getRecentStudyMinutes(7), 0))} para sustentar o ritmo que o ${activeTrack.shortLabel} pede.`,
    };
  }

  if (!latestAttempt) {
    return {
      title: "Ainda falta um treino de prova para dar leitura real do ciclo.",
      copy: "Sem bateria de questões, o aluno ve agenda, mas não enxerga como a preparação reage sob tempo e pressão.",
    };
  }

  if (openTasks.length) {
    return {
      title: "O plano está vivo, mas precisa limpar pendências para ganhar clareza.",
      copy: `${openTasks.length} tarefa${openTasks.length === 1 ? "" : "s"} em aberto ainda competem pela atenção do dia. Priorize as mais próximas da prova.`,
    };
  }

  return {
    title: "Base, revisão e treino estão caminhando de forma mais equilibrada.",
    copy: `O ${activeTrack.shortLabel} já tem estrutura para evoluir com mais consistência. Agora vale ajustar dificuldade e qualidade dos blocos.`,
  };
};

export const getPriorityItems = () => {
  const activeTrack = getCurrentTrackMeta();
  const trackStats = getTrackStats();
  const enemStats = trackStats.find((track) => track.id === "enem") ?? trackStats[1];
  const uerjStats = trackStats.find((track) => track.id === "uerj") ?? trackStats[2];
  const openTasks = getOpenTasks();
  const reviewBacklog = getReviewBacklogCount();
  const latestAttempt = getLatestMockAttempt();
  const weeklyFocus = getRecentStudyMinutes(7);
  const plannedMinutes = getPlannedMinutes();
  const items = [];

  if (openTasks.length) {
    const nextTask = openTasks[0];
    items.push({
      tone: "action",
      eyebrow: "Execução",
      title: `Fechar "${nextTask.title}"`,
      copy: `A fila tem ${openTasks.length} pendência${openTasks.length === 1 ? "" : "s"}. Encerrar um bloco agora limpa o dia e abre espaco para revisão.`,
    });
  }

  if (reviewBacklog > 0) {
    items.push({
      tone: "review",
      eyebrow: "Revisão",
      title: reviewBacklog === 1 ? "Existe uma revisão aberta pedindo retomada." : `Existem ${reviewBacklog} revisões abertas pedindo retomada.`,
      copy: "Não deixe o caderno de erros virar arquivo morto. Use uma sessão curta para consolidar antes de seguir.",
    });
  } else {
    items.push({
      tone: "review",
      eyebrow: "Revisão",
      title: "Inclua um bloco curto de revisão antes do próximo treino.",
      copy: "Mesmo com a agenda andando bem, revisão de 20 a 30 minutos protege memoria e reduz oscilação de desempenho.",
    });
  }

  if (activeTrack.id === "hibrido" && (enemStats.minutes === 0 || uerjStats.minutes === 0)) {
    items.push({
      tone: "balance",
      eyebrow: "Distribuição",
      title: "O plano híbrido ainda está pendendo para um lado só.",
      copy: "Se a proposta e ENEM + UERJ, a semana precisa ter pelo menos um bloco claro para cada prova.",
    });
  } else if (!latestAttempt) {
    items.push({
      tone: "exam",
      eyebrow: "Treino",
      title: `Falta um treino de prova no seu ${activeTrack.shortLabel}.`,
      copy: "Sem questões resolvidas, a plataforma mostra disciplina, mas ainda não devolve leitura de desempenho real.",
    });
  } else if (plannedMinutes < state.weeklyGoalMinutes * 0.65 || weeklyFocus < state.weeklyGoalMinutes * 0.65) {
    items.push({
      tone: "exam",
      eyebrow: "Carga",
      title: "Seu plano semanal ainda está abaixo do volume planejado.",
      copy: `Ajuste o planner para ganhar pelo menos ${formatMinutes(Math.max(state.weeklyGoalMinutes - plannedMinutes, 0))} de cobertura prevista.`,
    });
  } else {
    items.push({
      tone: "exam",
      eyebrow: "Prova",
      title: `Seu ${activeTrack.shortLabel} já pode subir um degrau de dificuldade.`,
      copy: "Aumente a exigência das próximas questões ou transforme o próximo bloco em treino cronometrado.",
    });
  }

  return items.slice(0, 3);
};

export const getTrackOverviewCards = () => {
  const trackStats = getTrackStats();
  const activeTrackId = getActiveTrackId();
  const coverage = getCoverageScore();
  const reviewBacklog = getReviewBacklogCount();
  const latestAttempt = getLatestMockAttempt();

  if (activeTrackId === "hibrido") {
    const enemStats = trackStats.find((track) => track.id === "enem") ?? trackStats[1];
    const uerjStats = trackStats.find((track) => track.id === "uerj") ?? trackStats[2];
    const hybridStats = trackStats.find((track) => track.id === "hibrido") ?? trackStats[0];
    const enemHasWorkload = enemStats.taskCount > 0 || enemStats.sessions.length > 0 || enemStats.minutes > 0;
    const uerjHasWorkload = uerjStats.taskCount > 0 || uerjStats.sessions.length > 0 || uerjStats.minutes > 0;

    return [
      {
        label: "ENEM",
        value: enemStats.minutes ? formatMinutes(enemStats.minutes) : `${enemStats.taskCount} blocos`,
        copy: enemHasWorkload
          ? `${enemStats.openTasks} pendência${enemStats.openTasks === 1 ? "" : "s"} e ${enemStats.sessions.length} sessão${enemStats.sessions.length === 1 ? "" : "es"} previstas`
          : "Sem bloco especifico do ENEM nesta semana",
      },
      {
        label: "UERJ",
        value: uerjStats.minutes ? formatMinutes(uerjStats.minutes) : `${uerjStats.taskCount} blocos`,
        copy: uerjHasWorkload
          ? `${uerjStats.openTasks} pendência${uerjStats.openTasks === 1 ? "" : "s"} e ${uerjStats.sessions.length} sessão${uerjStats.sessions.length === 1 ? "" : "es"} previstas`
          : "Sem bloco especifico da UERJ nesta semana",
      },
      {
        label: "Base comum",
        value: hybridStats.minutes ? formatMinutes(hybridStats.minutes) : `${coverage}%`,
        copy:
          reviewBacklog > 0
            ? `${reviewBacklog} revisão${reviewBacklog === 1 ? "" : "es"} aberta${reviewBacklog === 1 ? "" : "s"} para consolidar a base`
            : latestAttempt
              ? `${latestAttempt.label} registrado em ${formatShortDate(latestAttempt.timestamp)}`
              : "Sem treino recente registrado",
      },
    ];
  }

  const activeTrackStats = trackStats.find((track) => track.id === activeTrackId) ?? trackStats[0];

  return [
    {
      label: "Carga prevista",
      value: activeTrackStats.minutes ? formatMinutes(activeTrackStats.minutes) : "0 min",
      copy: `${activeTrackStats.sessions.length} sess${activeTrackStats.sessions.length === 1 ? "ão" : "ões"} planejada${activeTrackStats.sessions.length === 1 ? "" : "s"} para este eixo`,
    },
    {
      label: "Pendências",
      value: `${activeTrackStats.openTasks}`,
      copy: activeTrackStats.openTasks
        ? "Blocos ainda pedindo execução para o plano andar"
        : "Sem pendências abertas nesse eixo agora",
    },
    {
      label: "Treino",
      value: latestAttempt ? `${latestAttempt.score}/${latestAttempt.total}` : `${coverage}%`,
      copy: latestAttempt
        ? `${latestAttempt.label} concluído em ${formatShortDate(latestAttempt.timestamp)}`
        : "Use uma bateria curta de questões para criar referência",
    },
  ];
};

export const getMilestones = () => {
  const activeTrackId = getActiveTrackId();

  // 1) Datas reais das provas (a plataforma já sabe) viram marcos concretos.
  const examMilestones = getExamSchedule(activeTrackId)
    .filter((dia) => typeof dia.daysUntil === "number" && dia.daysUntil >= 0)
    .map((dia) => ({
      eyebrow: dia.provaNome,
      title: dia.label,
      copy: `${dia.detalhe}${dia.previsto ? " · data prevista" : ""} · ${
        dia.daysUntil === 0 ? "é hoje" : dia.daysUntil === 1 ? "falta 1 dia" : `faltam ${dia.daysUntil} dias`
      }.`,
      date: new Date(`${dia.data}T00:00:00`),
    }));

  // 2) Marcos de preparação (base/revisão/treino) como apoio, em datas relativas.
  const blueprint = MILESTONE_BLUEPRINTS[activeTrackId] ?? MILESTONE_BLUEPRINTS.hibrido;
  const prepMilestones = blueprint.map((item) => ({
    ...item,
    date: getDateFromOffset(item.offsetDays),
  }));

  return [...examMilestones, ...prepMilestones]
    .sort((a, b) => a.date - b.date)
    .map((item) => ({ ...item, dateLabel: formatMonthDay(item.date) }));
};

export const hydrateRunningPomodoro = () => {
  if (!state.pomodoro.isRunning) {
    return;
  }

  const remainingSeconds = getCurrentPomodoroSeconds();

  if (remainingSeconds <= 0) {
    state.pomodoro.isRunning = false;
    state.pomodoro.endAt = null;
    state.pomodoro.remainingSeconds = state.pomodoro.durationSeconds;
    return;
  }

  state.pomodoro.remainingSeconds = remainingSeconds;
};
