import { TOAST_DURATION, FULL_DAY_LABELS, OPTION_LETTERS } from "./constants.js";
import { TRACKS, SUBJECTS } from "./content.js";
import { dom } from "./dom.js";
import {
  state,
  adjustStudyMinutes,
  ensureActiveTrailLesson,
  getActiveTrackId,
  getCurrentPomodoroSeconds,
  getMockElapsedSeconds,
  getOpenTasks,
  getTrackMeta,
  hydrateRunningPomodoro,
  startMockTimerIfNeeded,
  startMock,
  clearMock,
  setMockSize,
  getMockQuestions,
  isMockActive,
  normalizeTrackId,
  registerActivity,
  registerStudyMinutes,
  saveState,
  setActiveTrailLesson,
  setTrailProvaFilter,
  setTrailLevelFilter,
  setTrailQuery,
  setTrailSubjectFilter,
  toggleTrailLessonCompleted,
  setPracticeSubject,
  setPracticeTopic,
  setPracticeTrack,
  setPracticeLevel,
  setPracticeTipo,
  setPracticeQuery,
  setPracticeAnswer,
  setPracticeOnlyErrors,
  setPracticeOnlyReviews,
  setRedacaoProva,
  setRedacaoScore,
  revealPracticeAnswer,
  isPracticeRevealed,
  resetPracticeFilters,
  completeOnboarding,
  isOnboarded,
  resetAllProgress,
  exportProgress,
  importProgress,
  getCursosByArea,
  getCursoPesoSubjects,
  getCursoCampi,
  getExamSchedule,
} from "./store.js";
import {
  renderDashboard,
  renderGuidedStudy,
  renderMock,
  renderPomodoro,
  renderQuestionBank,
  renderRedacao,
  updateRedacaoTotal,
  populateBankSubjectOptions,
} from "./renderers.js";
import { getDurationMinutes, toDateKey, uid } from "./utils.js";

const notifyPomodoroStateChange = () => {
  document.dispatchEvent(new Event("aprova:pomodoro-state-change"));
};

const notifyMockTimerChange = () => {
  document.dispatchEvent(new Event("aprova:mock-timer-change"));
};

const showToast = (title, description, tone = "success") => {
  if (!dom.toastStack) {
    return;
  }

  const toast = document.createElement("article");
  const strong = document.createElement("strong");
  const span = document.createElement("span");

  toast.className = "toast";
  toast.dataset.tone = tone;
  strong.textContent = title;
  span.textContent = description;
  toast.append(strong, span);
  dom.toastStack.append(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => {
      toast.remove();
    }, 220);
  }, TOAST_DURATION);
};

const downloadPdfInBrowser = async (link) => {
  const sourceUrl = link.getAttribute("data-download-source") ?? "";
  const filename = link.getAttribute("data-download-filename") ?? "prova.pdf";

  if (!sourceUrl || link.dataset.downloadBusy === "true") {
    return;
  }

  link.dataset.downloadBusy = "true";
  link.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        Accept: "application/pdf",
      },
      mode: "cors",
      credentials: "omit",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("application/pdf")) {
      throw new Error(`Tipo invalido: ${contentType || "desconhecido"}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = objectUrl;
    downloadLink.download = filename;
    downloadLink.style.display = "none";
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  } catch {
    showToast("Download indisponivel", "Nao foi possivel baixar este PDF agora. Tente novamente em instantes.", "warning");
  } finally {
    delete link.dataset.downloadBusy;
    link.removeAttribute("aria-busy");
  }
};

const completePomodoroSession = () => {
  const sessionMinutes = Math.round(state.pomodoro.durationSeconds / 60);

  state.pomodoro.isRunning = false;
  state.pomodoro.endAt = null;
  state.pomodoro.remainingSeconds = state.pomodoro.durationSeconds;
  state.pomodoro.completedSessions += 1;
  state.pomodoro.totalFocusMinutes += sessionMinutes;

  registerStudyMinutes(sessionMinutes, `Concluiu um bloco de foco de ${sessionMinutes} minutos.`);
  saveState();
  renderDashboard();
  notifyPomodoroStateChange();
  showToast("Bloco concluído", `${sessionMinutes} minutos adicionados ao seu foco da semana.`);
};

export const syncPomodoroFromClock = () => {
  if (!state.pomodoro.isRunning) {
    return;
  }

  const remainingSeconds = getCurrentPomodoroSeconds();

  if (remainingSeconds <= 0) {
    completePomodoroSession();
    return;
  }

  state.pomodoro.remainingSeconds = remainingSeconds;
  renderPomodoro();
};

const startPomodoro = () => {
  if (state.pomodoro.isRunning) {
    return;
  }

  state.pomodoro.isRunning = true;
  state.pomodoro.endAt = Date.now() + state.pomodoro.remainingSeconds * 1000;
  saveState();
  renderPomodoro();
  notifyPomodoroStateChange();
  showToast("Foco iniciado", "O contador continua rodando enquanto você navega pela plataforma.", "info");
};

const pausePomodoro = () => {
  if (!state.pomodoro.isRunning) {
    return;
  }

  state.pomodoro.remainingSeconds = getCurrentPomodoroSeconds();
  state.pomodoro.isRunning = false;
  state.pomodoro.endAt = null;
  saveState();
  renderPomodoro();
  notifyPomodoroStateChange();
  showToast("Foco pausado", "Seu bloco foi mantido do ponto em que você parou.", "info");
};

const resetPomodoro = () => {
  state.pomodoro.isRunning = false;
  state.pomodoro.endAt = null;
  state.pomodoro.remainingSeconds = state.pomodoro.durationSeconds;
  saveState();
  renderPomodoro();
  notifyPomodoroStateChange();
  showToast("Pomodoro resetado", "Você pode iniciar um novo bloco quando quiser.", "info");
};

export const populateSubjectSelects = () => {
  dom.subjectSelects.forEach((select) => {
    const currentValue = select.value;
    // metodo-uerj é categoria de estratégia, não cabe como "Matéria" de tarefa/sessão.
    select.innerHTML = SUBJECTS.filter((subject) => subject.id !== "metodo-uerj")
      .map((subject) => `<option value="${subject.id}">${subject.label}</option>`)
      .join("");
    if (currentValue) {
      select.value = currentValue;
    }
  });
};

export const populateTrackSelects = () => {
  dom.trackSelects.forEach((select) => {
    const currentValue = normalizeTrackId(select.value);
    select.innerHTML = TRACKS.map((track) => `<option value="${track.id}">${track.shortLabel}</option>`).join("");
    select.value = currentValue || getActiveTrackId();
  });
};

export const resetSessionForm = () => {
  if (!dom.sessionForm) {
    return;
  }

  const activeTrackId = getActiveTrackId();
  dom.sessionForm.reset();
  dom.sessionForm.elements.subject.value = SUBJECTS[0].id;
  dom.sessionForm.elements.track.value = activeTrackId;
  dom.sessionForm.elements.day.value = "0";
  dom.sessionForm.elements.sessionId.value = "";
  dom.sessionSubmit.textContent = "Salvar sessão";
  dom.sessionCancel.hidden = true;
};

const startEditingSession = (sessionId) => {
  const session = state.sessions.find((item) => item.id === sessionId);

  if (!session || !dom.sessionForm) {
    return;
  }

  dom.sessionForm.elements.sessionId.value = session.id;
  dom.sessionForm.elements.title.value = session.title;
  dom.sessionForm.elements.subject.value = session.subject;
  dom.sessionForm.elements.track.value = normalizeTrackId(session.track);
  dom.sessionForm.elements.day.value = String(session.day);
  dom.sessionForm.elements.start.value = session.start;
  dom.sessionForm.elements.end.value = session.end;
  dom.sessionSubmit.textContent = "Atualizar sessão";
  dom.sessionCancel.hidden = false;
  dom.sessionForm.scrollIntoView({ behavior: "smooth", block: "center" });
};

const handleTaskSubmit = (event) => {
  event.preventDefault();

  const formData = new FormData(dom.taskForm);
  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? SUBJECTS[0].id);
  const track = normalizeTrackId(formData.get("track"));
  const estimate = Number(formData.get("estimate") ?? 30);

  if (!title) {
    showToast("Titulo obrigatório", "De um nome claro para a tarefa antes de salvar.", "warning");
    return;
  }

  state.tasks.unshift({
    id: uid("task"),
    title,
    subject,
    track,
    estimate,
    completed: false,
    createdAt: new Date().toISOString(),
  });

  registerActivity(`Adicionou a tarefa "${title}" para ${getTrackMeta(track).shortLabel}.`);
  saveState();
  dom.taskForm.reset();
  dom.taskForm.elements.subject.value = subject;
  dom.taskForm.elements.track.value = track;
  dom.taskForm.elements.estimate.value = "30";
  dom.taskForm.elements.title.focus();
  renderDashboard();
  showToast("Tarefa adicionada", `${title} entrou na fila do seu plano ${getTrackMeta(track).shortLabel}.`);
};

const handleSessionSubmit = (event) => {
  event.preventDefault();

  const formData = new FormData(dom.sessionForm);
  const sessionId = String(formData.get("sessionId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? SUBJECTS[0].id);
  const track = normalizeTrackId(formData.get("track"));
  const day = Number(formData.get("day") ?? 0);
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");

  if (!title || !start || !end) {
    showToast("Campos incompletos", "Preencha titulo, horário inicial e horário final para salvar a sessão.", "warning");
    return;
  }

  if (getDurationMinutes(start, end) <= 0) {
    showToast("Horário invalido", "Defina um horário final posterior ao inicio da sessão.", "warning");
    return;
  }

  if (sessionId) {
    state.sessions = state.sessions.map((session) =>
      session.id === sessionId ? { ...session, title, subject, track, day, start, end } : session
    );
    registerActivity(`Atualizou a sessão "${title}" em ${getTrackMeta(track).shortLabel}.`);
    showToast("Sessão atualizada", `${title} foi ajustada no planner.`);
  } else {
    state.sessions.push({
      id: uid("session"),
      title,
      subject,
      track,
      day,
      start,
      end,
    });
    registerActivity(`Planejou a sessão "${title}" para ${FULL_DAY_LABELS[day]} em ${getTrackMeta(track).shortLabel}.`);
    showToast("Sessão criada", `${title} foi adicionada para ${FULL_DAY_LABELS[day]}.`);
  }

  saveState();
  resetSessionForm();
  renderDashboard();
};

const handleTaskAction = (button) => {
  const taskItem = button.closest("[data-task-id]");
  const taskId = taskItem?.getAttribute("data-task-id");
  const task = state.tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  if (button.hasAttribute("data-task-toggle")) {
    const nextCompleted = !task.completed;
    task.completed = nextCompleted;

    if (nextCompleted) {
      task.completedAt = new Date().toISOString();
      registerStudyMinutes(task.estimate, `Concluiu a tarefa "${task.title}" do plano ${getTrackMeta(task.track).shortLabel}.`);
      showToast("Tarefa concluída", `${task.title} agora conta para o progresso da semana.`);
    } else {
      if (task.completedAt) {
        adjustStudyMinutes(toDateKey(new Date(task.completedAt)), -task.estimate);
      }

      delete task.completedAt;
      registerActivity(`Reabriu a tarefa "${task.title}".`);
      showToast("Tarefa reaberta", `${task.title} voltou para sua fila de execução.`, "info");
    }

    saveState();
    renderDashboard();
    return;
  }

  if (button.hasAttribute("data-task-delete")) {
    state.tasks = state.tasks.filter((item) => item.id !== taskId);
    registerActivity(`Removeu a tarefa "${task.title}".`);
    saveState();
    renderDashboard();
    showToast("Tarefa removida", `${task.title} saiu da sua lista.`, "warning");
  }
};

const handleSessionAction = (button) => {
  const sessionCard = button.closest("[data-session-id]");
  const sessionId = sessionCard?.getAttribute("data-session-id");
  const session = state.sessions.find((item) => item.id === sessionId);

  if (!session) {
    return;
  }

  if (button.hasAttribute("data-session-edit")) {
    startEditingSession(sessionId);
    return;
  }

  if (button.hasAttribute("data-session-delete")) {
    state.sessions = state.sessions.filter((item) => item.id !== sessionId);
    registerActivity(`Excluiu a sessão "${session.title}".`);
    saveState();
    renderDashboard();
    showToast("Sessão excluída", `${session.title} foi removida do planner.`, "warning");
  }
};

const selectMockOption = (optionIndex, focusOption = false) => {
  if (state.mock.submitted) {
    return;
  }

  const question = getMockQuestions()[state.mock.currentQuestionIndex];
  if (!question) {
    return;
  }
  state.mock.answers[question.id] = optionIndex;
  saveState();
  renderMock();

  if (focusOption) {
    dom.mockOptions.querySelector(`[data-option-index="${optionIndex}"]`)?.focus();
  }
};

const beginMock = () => {
  const n = startMock();
  notifyMockTimerChange();
  saveState();
  renderMock();
  showToast("Simulado iniciado", `${n} quest${n === 1 ? "ão" : "ões"} no relógio. Bom treino!`, "info");
};

const abortMock = () => {
  clearMock();
  notifyMockTimerChange();
  saveState();
  renderMock();
  showToast("Simulado encerrado", "Você pode montar um novo quando quiser.", "info");
};

const finishMock = () => {
  const questions = getMockQuestions();
  const unanswered = questions.filter((question) => typeof state.mock.answers[question.id] !== "number");

  if (unanswered.length) {
    dom.mockFeedback.textContent = `Responda as ${unanswered.length} questões restantes para finalizar o simulado.`;
    showToast("Simulado incompleto", `Ainda faltam ${unanswered.length} quest${unanswered.length === 1 ? "ão" : "ões"} para finalizar.`, "warning");
    return;
  }

  if (state.mock.submitted || !questions.length) {
    return;
  }

  const score = questions.reduce(
    (correctAnswers, question) => correctAnswers + Number(state.mock.answers[question.id] === question.correctIndex),
    0
  );

  const activeTrackId = getActiveTrackId();
  const label = activeTrackId === "enem" ? "Simulado ENEM" : activeTrackId === "uerj" ? "Simulado UERJ" : "Simulado híbrido";

  const durationSeconds = getMockElapsedSeconds();

  state.mock.submitted = true;
  state.mock.attempts.unshift({
    id: uid("attempt"),
    score,
    total: questions.length,
    label,
    durationSeconds,
    timestamp: new Date().toISOString(),
  });
  state.mock.attempts = state.mock.attempts.slice(0, 6);

  // Tempo real do simulado (mín. 1 min) entra no foco da semana.
  const focusMinutes = Math.max(1, Math.round(durationSeconds / 60));
  registerStudyMinutes(focusMinutes, `Finalizou um ${label.toLowerCase()} com ${score}/${questions.length} acertos.`);
  notifyMockTimerChange();
  saveState();
  renderDashboard();
  showToast("Simulado finalizado", `Você fechou ${score} de ${questions.length} questões.`);
};

const restartMock = () => {
  clearMock();
  notifyMockTimerChange();
  saveState();
  renderDashboard();
};

// Aplica um recorte no banco de questões e leva o aluno até lá. Usado pelo
// card "Estudar hoje" e pelo painel de pontos fracos.
const applyBankFilter = ({ subject, topic, onlyErrors, onlyReviews } = {}) => {
  resetPracticeFilters();

  if (onlyReviews) {
    setPracticeOnlyReviews(true);
  } else if (onlyErrors) {
    setPracticeOnlyErrors(true);
  } else {
    if (subject) {
      setPracticeSubject(subject);
    }
    if (topic) {
      setPracticeTopic(topic);
    }
  }

  if (dom.bankSearch) {
    dom.bankSearch.value = "";
  }

  saveState();
  renderQuestionBank();
  goToSection("#banco"); // abre a aba do banco e rola até ele
};

// ===== Onboarding =====
const formatExamDate = (iso) => {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const populateCourseOptions = () => {
  if (!dom.onboardingCourse) {
    return;
  }
  const track = getOnboardingTrack();
  const current = dom.onboardingCourse.value;
  const groups = getCursosByArea(track)
    .map(
      (grupo) =>
        `<optgroup label="${grupo.label}">${grupo.cursos
          .map((curso) => `<option value="${curso.id}">${curso.nome}</option>`)
          .join("")}</optgroup>`
    )
    .join("");
  // Quando o foco é só UERJ, a lista mostra apenas cursos da UERJ.
  const placeholder = track === "uerj" ? "Escolha um curso da UERJ…" : "Escolha um curso das universidades do RJ…";
  dom.onboardingCourse.innerHTML = `<option value="">${placeholder}</option>${groups}`;
  // Se o curso antes escolhido não existe na nova lista, o select volta para vazio.
  dom.onboardingCourse.value = current;
};

const getOnboardingTrack = () => {
  const field = dom.onboardingForm?.elements?.track;
  return field ? field.value : "";
};

const updateOnboardingPreview = () => {
  if (!dom.onboardingPreview) {
    return;
  }

  const track = getOnboardingTrack();
  const courseId = dom.onboardingCourse?.value || "";
  const hasCourse = Boolean(courseId);

  // As datas dependem da prova; sem escolha ainda, mostramos ENEM + UERJ.
  const schedule = getExamSchedule(track || "hibrido");

  dom.onboardingPreview.hidden = !(track || hasCourse);

  if (dom.onboardingPesosBlock) {
    dom.onboardingPesosBlock.hidden = !hasCourse;
  }

  if (hasCourse && dom.onboardingPesos) {
    const chips = getCursoPesoSubjects(courseId)
      .map((subject) => `<span class="peso-chip" style="--peso-accent:${subject.accent};">${subject.label}</span>`)
      .join("");
    // Quando o foco é UERJ, mostra também em quais campi o curso é oferecido.
    const campi = track === "uerj" ? getCursoCampi(courseId) : [];
    const campiLine = campi.length
      ? `<span class="onboarding-campi">📍 ${campi.length === 1 ? "Campus" : "Campi"}: ${campi.join(" · ")}</span>`
      : "";
    dom.onboardingPesos.innerHTML = chips + campiLine;
  }

  if (dom.onboardingDatas) {
    dom.onboardingDatas.innerHTML = schedule
      .map((dia) => {
        const countdown =
          typeof dia.daysUntil === "number" && dia.daysUntil >= 0 ? `faltam ${dia.daysUntil} dias` : "já realizada";
        return `<div class="data-row"><strong>${dia.provaNome} · ${dia.label}</strong><span>${formatExamDate(dia.data)} · ${countdown}${dia.previsto ? " (prevista)" : ""}</span></div>`;
      })
      .join("");
  }
};

// Preenche o formulário com o perfil atual (usado tanto na 1ª vez quanto ao editar).
const prefillOnboardingForm = () => {
  if (!dom.onboardingForm) {
    return;
  }
  const profile = state.profile;
  const trackField = dom.onboardingForm.elements.track;
  if (trackField) {
    trackField.value = profile.track && profile.track !== "auto" ? profile.track : "";
  }
  const goalField = dom.onboardingForm.elements.goal;
  if (goalField) {
    goalField.value = String(state.weeklyGoalMinutes);
  }
  populateCourseOptions(); // depende da prova já definida acima
  if (dom.onboardingCourse) {
    dom.onboardingCourse.value = profile.course || "";
  }
};

const openOnboarding = (editing = false) => {
  if (!dom.onboarding) {
    return;
  }
  prefillOnboardingForm();
  updateOnboardingPreview();

  if (dom.onboardingTitle) {
    dom.onboardingTitle.textContent = editing ? "Editar seu plano" : "Vamos montar seu ponto de partida";
  }
  if (dom.onboardingLead) {
    dom.onboardingLead.textContent = editing
      ? "Atualize sua prova, curso ou meta semanal. Seu progresso — treinos, tarefas e respostas — é mantido."
      : "Dois minutos agora e a plataforma já abre apontando o que estudar — em vez de uma tela cheia de dados que não são seus.";
  }
  if (dom.onboardingSubmit) {
    dom.onboardingSubmit.textContent = editing ? "Salvar alterações" : "Começar a estudar";
  }
  if (dom.onboardingSkip) {
    dom.onboardingSkip.hidden = editing; // ao editar não faz sentido "explorar sem configurar"
  }

  dom.onboarding.hidden = false;
  document.body.classList.add("is-onboarding");
  window.requestAnimationFrame(() => {
    dom.onboarding.querySelector('input[name="track"]')?.focus();
  });
};

const closeOnboarding = () => {
  if (!dom.onboarding) {
    return;
  }
  dom.onboarding.hidden = true;
  document.body.classList.remove("is-onboarding");
};

const handleOnboardingSubmit = (event) => {
  event.preventDefault();

  const data = new FormData(dom.onboardingForm);
  const track = String(data.get("track") ?? "hibrido");
  const course = String(data.get("course") ?? "");
  const goal = Number(data.get("goal") ?? 600);

  completeOnboarding({ track, course, weeklyGoalMinutes: goal });
  saveState();
  closeOnboarding();

  // Realinha selects e defaults com a prova escolhida e redesenha tudo.
  populateTrackSelects();
  resetSessionForm();
  renderDashboard();

  const trackLabel = getTrackMeta(getActiveTrackId()).shortLabel;
  showToast("Tudo pronto", `Seu painel ${trackLabel} já aponta o próximo passo. Bons estudos!`);
};

const handleOnboardingSkip = () => {
  // Marca como configurado em modo "auto" (a prova passa a ser inferida).
  completeOnboarding({ track: "auto", course: "", weeklyGoalMinutes: state.weeklyGoalMinutes });
  saveState();
  closeOnboarding();
  renderDashboard();
};

const handleResetProgress = () => {
  const confirmed = window.confirm(
    "Isto apaga todo o seu progresso salvo neste aparelho (tarefas, planner, treinos e foco) e recomeça do zero. Deseja continuar?"
  );
  if (!confirmed) {
    return;
  }

  resetAllProgress();
  closeOnboarding();
  renderDashboard();
  openOnboarding();
};

// ===== Editar plano / Backup =====
const handleEditPlan = () => openOnboarding(true);

const handleExportProgress = () => {
  try {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aprova-progresso.json";
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Progresso exportado", "Geramos um arquivo .json com tudo. Guarde em local seguro.");
  } catch {
    showToast("Não foi possível exportar", "Tente novamente em instantes.", "warning");
  }
};

const handleImportClick = () => dom.importFile?.click();

const handleImportFile = (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      importProgress(String(reader.result));
      populateTrackSelects();
      resetSessionForm();
      renderDashboard();
      notifyMockTimerChange();
      closeOnboarding();
      if (!isOnboarded()) {
        openOnboarding();
      }
      showToast("Progresso importado", "Seus dados foram restaurados neste aparelho.");
    } catch {
      showToast("Arquivo inválido", "Não foi possível ler esse arquivo de progresso.", "warning");
    } finally {
      input.value = ""; // permite reimportar o mesmo arquivo
    }
  };
  reader.onerror = () => {
    showToast("Erro ao ler", "Não foi possível abrir o arquivo.", "warning");
    input.value = "";
  };
  reader.readAsText(file);
};

export const initOnboarding = () => {
  if (dom.onboarding && !isOnboarded()) {
    openOnboarding();
  }
};

// ===== Abas reais: mostra uma seção por vez (cara de app nativo) =====
const TAB_IDS = ["hoje", "aprender", "banco", "simulado", "redacao"];
// Seção "principal" de cada aba (âncora padrão ao trocar pela barra inferior).
const TAB_PRIMARY = { hoje: "overview", aprender: "trilhas", banco: "banco", simulado: "simulado", redacao: "redacao" };
const FALLBACK_TAB = "hoje";

const getTabPanels = () => [...document.querySelectorAll(".dashboard-main > section")];
const sectionTabById = (id) => (id ? document.getElementById(id)?.closest("[data-tab]")?.dataset.tab : undefined);

let activeTab = FALLBACK_TAB;

const updateNavActive = (tab, currentId) => {
  dom.navLinks.forEach((link) => {
    const id = (link.getAttribute("href") || "").replace(/^#/, "");
    const isMobile = Boolean(link.closest(".dashboard-mobile-nav"));
    // Barra inferior representa a ABA; sidebar destaca o link exato clicado.
    const active = isMobile ? sectionTabById(id) === tab : id === currentId;
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const activateTab = (tab, { scrollToId = null, updateHash = true } = {}) => {
  activeTab = TAB_IDS.includes(tab) ? tab : FALLBACK_TAB;

  getTabPanels().forEach((panel) => {
    const panelTab = panel.dataset.tab || FALLBACK_TAB; // rede de segurança: sem data-tab cai em "Hoje"
    const show = panelTab === activeTab;
    panel.hidden = !show;
    if (show) {
      panel.classList.add("is-visible"); // garante visibilidade mesmo com data-reveal
    }
  });

  const currentId = scrollToId || TAB_PRIMARY[activeTab];
  updateNavActive(activeTab, currentId);

  if (updateHash && currentId) {
    try {
      window.history.replaceState(null, "", `#${currentId}`);
    } catch {
      /* file:// pode bloquear replaceState — ignora */
    }
  }

  if (scrollToId) {
    document.getElementById(scrollToId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "auto" }); // toda aba começa do topo
  }
};

// Leva o aluno a uma seção, trocando de aba se necessário. Usado por toda navegação.
const goToSection = (rawId) => {
  const id = String(rawId || "").replace(/^#/, "");
  const tab = sectionTabById(id);
  if (!tab) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  activateTab(tab, { scrollToId: TAB_PRIMARY[tab] === id ? null : id });
};

const bindTabs = () => {
  // Qualquer link de âncora interno (sidebar, barra inferior, topo, conteúdo) troca de aba.
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const link = target.closest('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("data-download-mode")) {
      return;
    }
    const id = (link.getAttribute("href") || "").replace(/^#/, "");
    if (!id || !sectionTabById(id)) {
      return; // âncora vazia ou que não aponta para uma seção — deixa passar
    }
    event.preventDefault();
    goToSection(id);
  });

  window.addEventListener("hashchange", () => {
    const id = (window.location.hash || "").replace(/^#/, "");
    const tab = sectionTabById(id);
    if (tab) {
      activateTab(tab, { scrollToId: TAB_PRIMARY[tab] === id ? null : id, updateHash: false });
    }
  });

  // Estado inicial: deep-link pelo hash ou aba padrão.
  const initialId = (window.location.hash || "").replace(/^#/, "");
  const initialTab = sectionTabById(initialId) || FALLBACK_TAB;
  activateTab(initialTab, {
    scrollToId: sectionTabById(initialId) && TAB_PRIMARY[initialTab] !== initialId ? initialId : null,
    updateHash: false,
  });
};

const bindRevealObserver = () => {
  const revealElements = [...document.querySelectorAll("[data-reveal]")];

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }
};

const handleTrailSelect = (lessonId) => {
  if (!lessonId) {
    return;
  }

  setActiveTrailLesson(lessonId);
  saveState();
  renderGuidedStudy();
};

const handleTrailToggle = (lessonId) => {
  if (!lessonId) {
    return;
  }

  toggleTrailLessonCompleted(lessonId);
  saveState();
  renderGuidedStudy();
  showToast("Progresso atualizado", "A aula foi atualizada na sua trilha.", "info");
};

export const bindEvents = () => {
  dom.scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
      goToSection(button.getAttribute("data-scroll-target"));
    });
  });

  dom.pomodoroButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-pomodoro-action");
      if (action === "start") {
        startPomodoro();
      }
      if (action === "pause") {
        pausePomodoro();
      }
      if (action === "reset") {
        resetPomodoro();
      }
    });
  });

  dom.taskForm?.addEventListener("submit", handleTaskSubmit);
  dom.sessionForm?.addEventListener("submit", handleSessionSubmit);
  dom.sessionCancel?.addEventListener("click", resetSessionForm);

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const examDownloadLink = target.closest("[data-download-mode='browser-fetch']");
    if (examDownloadLink instanceof HTMLAnchorElement) {
      event.preventDefault();
      void downloadPdfInBrowser(examDownloadLink);
      return;
    }

    const studyCta = target.closest("[data-study-cta]");
    if (studyCta instanceof HTMLElement) {
      const kind = studyCta.dataset.studyKind ?? "";
      const targetSel = studyCta.dataset.studyTarget || "#banco";
      if (kind === "reviews") {
        applyBankFilter({ onlyReviews: true });
      } else if (kind === "errors") {
        applyBankFilter({ onlyErrors: true });
      } else if (studyCta.dataset.studySubject) {
        applyBankFilter({ subject: studyCta.dataset.studySubject, topic: studyCta.dataset.studyTopic });
      } else {
        goToSection(targetSel);
      }
      return;
    }

    const weakTrain = target.closest("[data-weak-train]");
    if (weakTrain instanceof HTMLElement) {
      applyBankFilter({ subject: weakTrain.dataset.weakSubject, topic: weakTrain.dataset.weakTopic });
      return;
    }

    const weakCta = target.closest("[data-weak-cta]");
    if (weakCta instanceof HTMLElement) {
      applyBankFilter({ onlyErrors: true });
      return;
    }

    const reviewsCta = target.closest("[data-reviews-cta]");
    if (reviewsCta instanceof HTMLElement) {
      applyBankFilter({ onlyReviews: true });
      return;
    }

    const pesoChip = target.closest("[data-peso-subject]");
    if (pesoChip instanceof HTMLElement) {
      applyBankFilter({ subject: pesoChip.dataset.pesoSubject });
      return;
    }

    // Clique-para-tocar: troca o thumbnail pela videoaula embutida só quando o
    // aluno pede (evita carregar vários iframes do YouTube de uma vez).
    const videoFacade = target.closest("[data-yt-facade]");
    if (videoFacade instanceof HTMLElement) {
      const videoId = videoFacade.getAttribute("data-yt-facade") ?? "";
      if (videoId) {
        const frame = document.createElement("iframe");
        frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        frame.title = videoFacade.getAttribute("data-yt-title") ?? "";
        frame.loading = "lazy";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        frame.allowFullscreen = true;
        videoFacade.replaceWith(frame);
      }
      return;
    }

    const taskButton = target.closest("[data-task-toggle], [data-task-delete]");
    if (taskButton instanceof HTMLElement) {
      handleTaskAction(taskButton);
      return;
    }

    const sessionButton = target.closest("[data-session-edit], [data-session-delete]");
    if (sessionButton instanceof HTMLElement) {
      handleSessionAction(sessionButton);
      return;
    }

    const optionButton = target.closest("[data-option-index]");
    if (optionButton instanceof HTMLElement) {
      selectMockOption(Number(optionButton.getAttribute("data-option-index")), false);
      return;
    }

    const trailSelectButton = target.closest("[data-trail-select]");
    if (trailSelectButton instanceof HTMLElement) {
      handleTrailSelect(String(trailSelectButton.getAttribute("data-trail-select") ?? ""));
      return;
    }

    const trailSubjectChip = target.closest("[data-trail-subject-chip]");
    if (trailSubjectChip instanceof HTMLElement) {
      setTrailSubjectFilter(String(trailSubjectChip.getAttribute("data-trail-subject-chip") ?? "all"));
      ensureActiveTrailLesson();
      saveState();
      renderGuidedStudy();
      return;
    }

    const trailToggleButton = target.closest("[data-trail-complete], [data-trail-toggle-completed]");
    if (trailToggleButton instanceof HTMLElement) {
      handleTrailToggle(
        String(trailToggleButton.getAttribute("data-trail-complete") ?? trailToggleButton.getAttribute("data-lesson-id") ?? "")
      );
    }
  });

  dom.trailSearch?.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    setTrailQuery(target.value);
    ensureActiveTrailLesson();
    saveState();
    renderGuidedStudy();
  });

  dom.trailSubjectFilter?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    setTrailSubjectFilter(target.value);
    ensureActiveTrailLesson();
    saveState();
    renderGuidedStudy();
  });

  dom.trailLevelFilter?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    setTrailLevelFilter(target.value);
    ensureActiveTrailLesson();
    saveState();
    renderGuidedStudy();
  });

  dom.trailFocusFilter?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    setTrailProvaFilter(target.value);
    ensureActiveTrailLesson();
    saveState();
    renderGuidedStudy();
  });

  dom.mockOptions?.addEventListener("keydown", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement) || state.mock.submitted) {
      return;
    }

    const currentIndex = Number(target.getAttribute("data-option-index"));
    if (Number.isNaN(currentIndex)) {
      return;
    }

    let nextIndex = currentIndex;
    const optionCount = getMockQuestions()[state.mock.currentQuestionIndex]?.options.length ?? OPTION_LETTERS.length;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % optionCount;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + optionCount) % optionCount;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = optionCount - 1;
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      selectMockOption(currentIndex, true);
      return;
    } else {
      return;
    }

    event.preventDefault();
    selectMockOption(nextIndex, true);
  });

  dom.mockPrev?.addEventListener("click", () => {
    state.mock.currentQuestionIndex = Math.max(0, state.mock.currentQuestionIndex - 1);
    saveState();
    renderMock();
  });

  dom.mockNext?.addEventListener("click", () => {
    state.mock.currentQuestionIndex = Math.min(getMockQuestions().length - 1, state.mock.currentQuestionIndex + 1);
    saveState();
    renderMock();
  });

  dom.mockSubmit?.addEventListener("click", finishMock);
  dom.mockRestart?.addEventListener("click", restartMock);
  dom.mockStart?.addEventListener("click", beginMock);
  dom.mockAbort?.addEventListener("click", abortMock);
  dom.mockSizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMockSize(Number(button.dataset.mockSize));
      saveState();
      renderMock();
    });
  });

  dom.onboardingForm?.addEventListener("submit", handleOnboardingSubmit);
  dom.onboardingSkip?.addEventListener("click", handleOnboardingSkip);
  dom.onboardingCourse?.addEventListener("change", updateOnboardingPreview);
  dom.onboardingForm?.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === "track") {
      // Trocar a prova refiltra a lista de cursos (UERJ mostra só cursos da UERJ).
      populateCourseOptions();
      updateOnboardingPreview();
    }
  });
  dom.resetProgress?.addEventListener("click", handleResetProgress);
  dom.editPlan?.addEventListener("click", handleEditPlan);
  dom.exportProgress?.addEventListener("click", handleExportProgress);
  dom.importProgress?.addEventListener("click", handleImportClick);
  dom.importFile?.addEventListener("change", handleImportFile);

  dom.redacaoProva?.addEventListener("change", (event) => {
    setRedacaoProva(event.target.value);
    saveState();
    renderRedacao();
  });

  dom.redacaoCriteria?.addEventListener("change", (event) => {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement) || !select.dataset.redacaoScore) {
      return;
    }
    setRedacaoScore(select.dataset.redacaoScore, select.value);
    saveState();
    updateRedacaoTotal();
  });

  dom.weakList?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const target = event.target;
    const item = target instanceof HTMLElement ? target.closest("[data-weak-train]") : null;
    if (item instanceof HTMLElement) {
      event.preventDefault();
      applyBankFilter({ subject: item.dataset.weakSubject, topic: item.dataset.weakTopic });
    }
  });

  dom.bankSubject?.addEventListener("change", (event) => {
    setPracticeSubject(event.target.value);
    saveState();
    renderQuestionBank();
  });

  dom.bankTopic?.addEventListener("change", (event) => {
    setPracticeTopic(event.target.value);
    saveState();
    renderQuestionBank();
  });

  dom.bankTrack?.addEventListener("change", (event) => {
    setPracticeTrack(event.target.value);
    saveState();
    renderQuestionBank();
  });

  dom.bankLevel?.addEventListener("change", (event) => {
    setPracticeLevel(event.target.value);
    saveState();
    renderQuestionBank();
  });

  dom.bankTipo?.addEventListener("change", (event) => {
    setPracticeTipo(event.target.value);
    saveState();
    renderQuestionBank();
  });

  dom.bankSearch?.addEventListener("input", (event) => {
    setPracticeQuery(event.target.value);
    saveState();
    renderQuestionBank();
  });

  dom.bankErrors?.addEventListener("change", (event) => {
    setPracticeOnlyErrors(event.target.checked);
    saveState();
    renderQuestionBank();
  });

  dom.bankReset?.addEventListener("click", () => {
    resetPracticeFilters();
    if (dom.bankSearch) {
      dom.bankSearch.value = "";
    }
    saveState();
    renderQuestionBank();
  });

  dom.bankGrid?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const optionButton = target.closest("[data-bank-option]");
    if (optionButton) {
      const questionId = optionButton.getAttribute("data-bank-option");
      const optionIndex = Number(optionButton.getAttribute("data-bank-option-index"));
      if (questionId && !Number.isNaN(optionIndex) && !isPracticeRevealed(questionId)) {
        setPracticeAnswer(questionId, optionIndex);
        saveState();
        renderQuestionBank();
      }
      return;
    }

    const revealButton = target.closest("[data-bank-reveal]");
    if (revealButton) {
      const questionId = revealButton.getAttribute("data-bank-reveal");
      if (questionId) {
        if (isPracticeRevealed(questionId)) {
          // "Refazer questão": limpa a resposta registrada para essa questão.
          const { [questionId]: _removed, ...rest } = state.practice.answers;
          state.practice.answers = rest;
        } else {
          revealPracticeAnswer(questionId);
        }
        saveState();
        renderQuestionBank();
      }
    }
  });

  bindTabs();
  bindRevealObserver();
};

export const primeInterface = () => {
  populateSubjectSelects();
  populateTrackSelects();
  populateBankSubjectOptions();

  if (dom.taskForm) {
    dom.taskForm.elements.subject.value = getOpenTasks()[0]?.subject ?? SUBJECTS[0].id;
    dom.taskForm.elements.track.value = getOpenTasks()[0]?.track ?? getActiveTrackId();
  }

  if (dom.sessionForm) {
    dom.sessionForm.elements.subject.value = state.sessions[0]?.subject ?? SUBJECTS[0].id;
    dom.sessionForm.elements.track.value = state.sessions[0]?.track ?? getActiveTrackId();
  }

  hydrateRunningPomodoro();
};
