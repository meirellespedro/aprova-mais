import { DASHBOARD_TITLE, OPTION_LETTERS } from "./constants.js";
import {
  getPracticeFilters,
  getFilteredPracticeQuestions,
  getPracticeTopics,
  getPracticeSubjectsInBank,
  getPracticeAnswer,
  isPracticeRevealed,
  getPracticePerformance,
  getStudyTodaySuggestion,
  getPerformanceTimeline,
  getDueReviewCount,
  getRedacaoState,
  getRedacaoTemas,
  getRedacaoCriteria,
  getRedacaoScale,
  getRedacaoTotal,
  getCursoMeta,
  getCursoPesoSubjects,
  getCursoCampi,
  getNextExam,
} from "./store.js";
import { dom } from "./dom.js";
import { EXAM_LIBRARY, EXAM_LIBRARY_META, buildExamDownloadUrl } from "./exam-library.js";
import {
  state,
  getActiveTrackId,
  getCompletedTasks,
  getCoverageScore,
  getCurrentTrackMeta,
  getCurrentPomodoroSeconds,
  getLatestMockAttempt,
  getMilestones,
  getMockAccuracy,
  getMockElapsedSeconds,
  isMockActive,
  getMockQuestions,
  getMockReview,
  getMockPoolSize,
  getNextSession,
  getOpenTasks,
  getPlanFocus,
  getPlannedMinutes,
  getPriorityItems,
  getRecentStudyMinutes,
  getReviewBacklogCount,
  getStudyStreak,
  getSubjectDistribution,
  getSubjectMeta,
  getTrailFilterState,
  getTrailProgress,
  getTrailSubjectOverview,
  getTrackMeta,
  getTrackOverviewCards,
  getWeeklyGoalProgress,
  getFilteredTrailLessons,
  getActiveTrailLesson,
  getTrailLessons,
  getBasicMathLessons,
  getMetodoUerjLessons,
  getUerjObras,
  getRedacaoUerjLesson,
  CURRENT_CICLO,
} from "./store.js";
import {
  escapeHTML,
  formatMinutes,
  formatRelativeTime,
  formatShortDate,
  formatTime,
  formatWeekday,
  getDateFromOffset,
  toDateKey,
} from "./utils.js";

const updateDocumentTitle = (remainingSeconds) => {
  document.title = state.pomodoro.isRunning ? `${formatTime(remainingSeconds)} | Aprova+` : DASHBOARD_TITLE;
};

const PROVA_LABELS = {
  enem: "ENEM",
  "uerj-qualificacao": "UERJ 1ª fase",
  "uerj-discursiva": "UERJ 2ª fase",
};

// rótulo completo (player): "ENEM · UERJ 1ª fase · UERJ 2ª fase"
const formatProvas = (provas = []) => provas.map((p) => PROVA_LABELS[p] ?? p).join(" · ") || "—";

// rótulo curto (cards): colapsa as fases da UERJ -> "ENEM · UERJ"
const formatProvasShort = (provas = []) => {
  const out = [];
  if (provas.includes("enem")) out.push("ENEM");
  if (provas.includes("uerj-qualificacao") || provas.includes("uerj-discursiva")) out.push("UERJ");
  return out.join(" · ") || "—";
};

const renderTrailLessonCard = (lesson, activeLessonId, completedLessonIds) => {
  const subject = getSubjectMeta(lesson.subjectId);
  const isActive = activeLessonId === lesson.id;
  const isCompleted = completedLessonIds.includes(lesson.id);
  const classes = [
    "trail-lesson-card",
    isActive ? "is-active" : "",
    isCompleted ? "is-complete" : "",
    lesson.isPlaceholder ? "is-placeholder" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <article class="${classes}" data-lesson-id="${lesson.id}">
      <button class="trail-lesson-main" type="button" data-trail-select="${lesson.id}">
        <div class="trail-lesson-head">
          <span class="trail-lesson-subject">${escapeHTML(subject.label)}</span>
          <span class="trail-lesson-focus">${escapeHTML(formatProvasShort(lesson.provas))}</span>
        </div>
        <strong>${escapeHTML(lesson.topic)}</strong>
        <p>${escapeHTML(lesson.description)}</p>
        <div class="trail-lesson-meta">
          ${lesson.isPlaceholder ? `<span class="trail-lesson-flag">Em breve</span>` : ""}
          <span>${escapeHTML(lesson.teacher)}</span>
          <span>${escapeHTML(lesson.level)}</span>
          <span>${escapeHTML(lesson.priority)}</span>
        </div>
      </button>
      <button
        class="trail-lesson-complete"
        type="button"
        data-trail-complete="${lesson.id}"
        aria-pressed="${String(isCompleted)}"
        aria-label="${isCompleted ? "Desmarcar aula vista" : "Marcar aula vista"}"
      >
        ${isCompleted ? "Vista" : "Marcar"}
      </button>
    </article>
  `;
};

const renderTrailLessonCollection = (filteredLessons, activeLessonId, completedLessonIds) => {
  const chunks = [];
  let currentModuleKey = "";
  let currentModuleLessons = [];
  let currentModuleDescription = "";

  const flushModule = () => {
    if (!currentModuleLessons.length) {
      return;
    }

    chunks.push(`
      <section class="trail-lesson-group surface-subtle" aria-label="${escapeHTML(currentModuleKey)}">
        <div class="trail-lesson-group-head">
          <div>
            <span class="trail-lesson-group-kicker">Bloco da trilha</span>
            <strong>${escapeHTML(currentModuleKey)}</strong>
            <p>${escapeHTML(currentModuleDescription || "Sequência organizada para destravar a base da matéria antes dos tópicos mais densos.")}</p>
          </div>
          <span class="trail-lesson-group-count">${currentModuleLessons.length} aula${currentModuleLessons.length === 1 ? "" : "s"}</span>
        </div>
        <div class="trail-lesson-group-grid">
          ${currentModuleLessons.map((lesson) => renderTrailLessonCard(lesson, activeLessonId, completedLessonIds)).join("")}
        </div>
      </section>
    `);

    currentModuleKey = "";
    currentModuleLessons = [];
    currentModuleDescription = "";
  };

  filteredLessons.forEach((lesson) => {
    if (lesson.module) {
      if (currentModuleKey && currentModuleKey !== lesson.module) {
        flushModule();
      }

      currentModuleKey = lesson.module;
      currentModuleDescription = lesson.moduleDescription || currentModuleDescription;
      currentModuleLessons.push(lesson);
      return;
    }

    flushModule();
    chunks.push(renderTrailLessonCard(lesson, activeLessonId, completedLessonIds));
  });

  flushModule();
  return chunks.join("");
};

export const renderStrategy = () => {
  const activeTrack = getCurrentTrackMeta();
  const planFocus = getPlanFocus();
  const priorities = getPriorityItems();
  const overviewCards = getTrackOverviewCards();
  const milestones = getMilestones();
  const nextMilestone = milestones[0];

  if (dom.topbarStatusTitle) {
    dom.topbarStatusTitle.textContent = activeTrack.topbarTitle;
  }

  if (dom.topbarStatusCopy) {
    dom.topbarStatusCopy.textContent = activeTrack.topbarCopy;
  }

  if (dom.trackOverview) {
    dom.trackOverview.innerHTML = overviewCards
      .map(
        (card) => `
          <article class="track-stat surface-subtle">
            <span>${escapeHTML(card.label)}</span>
            <strong>${escapeHTML(card.value)}</strong>
            <small>${escapeHTML(card.copy)}</small>
          </article>
        `
      )
      .join("");
  }

  if (dom.planFocusTitle) {
    dom.planFocusTitle.textContent = planFocus.title;
  }

  if (dom.planFocusCopy) {
    dom.planFocusCopy.textContent = planFocus.copy;
  }

  if (dom.priorityList) {
    dom.priorityList.innerHTML = priorities
      .map(
        (item) => `
          <li class="priority-item" data-tone="${item.tone}">
            <span>${escapeHTML(item.eyebrow)}</span>
            <strong>${escapeHTML(item.title)}</strong>
            <p>${escapeHTML(item.copy)}</p>
          </li>
        `
      )
      .join("");
  }

  if (dom.nextMilestoneTitle) {
    dom.nextMilestoneTitle.textContent = nextMilestone?.title ?? "Defina seus marcos de prova.";
  }

  if (dom.nextMilestoneCopy) {
    dom.nextMilestoneCopy.textContent =
      nextMilestone?.copy ?? "O Aprova+ usa marcos do ciclo para distribuir base, revisão e treino com mais clareza.";
  }

  if (dom.milestoneList) {
    // O hero já mostra o próximo marco; a lista mostra os seguintes (sem repetir).
    dom.milestoneList.innerHTML = milestones
      .slice(1)
      .map(
        (item) => `
          <article class="milestone-item surface-subtle">
            <div class="milestone-date">
              <span>${escapeHTML(item.eyebrow)}</span>
              <strong>${escapeHTML(item.dateLabel)}</strong>
            </div>
            <div>
              <strong>${escapeHTML(item.title)}</strong>
              <p>${escapeHTML(item.copy)}</p>
            </div>
          </article>
        `
      )
      .join("");
  }
};

export const renderHighlights = () => {
  const nextSession = getNextSession();
  const weeklyFocus = getRecentStudyMinutes(7);
  const weeklyGoalProgress = getWeeklyGoalProgress();
  const priorities = getPriorityItems();
  const reviewBacklog = getReviewBacklogCount();

  if (nextSession) {
    dom.nextSession.textContent = nextSession.title;
    dom.nextSessionCopy.textContent = `${nextSession.dayLabel} | ${nextSession.start} as ${nextSession.end} | ${nextSession.trackMeta.shortLabel} | ${nextSession.subjectMeta.label}`;
  } else {
    dom.nextSession.textContent = "Agenda pronta para montar";
    dom.nextSessionCopy.textContent = "Crie uma sessão no planner para destacar o próximo bloco da semana.";
  }

  if (weeklyFocus > 0) {
    dom.focusPace.textContent = weeklyGoalProgress >= 100 ? "Meta semanal coberta" : `${weeklyGoalProgress}% da meta visível`;
    dom.focusPaceCopy.textContent =
      weeklyGoalProgress >= 100
        ? `${formatMinutes(weeklyFocus)} registrados nos últimos 7 dias.`
        : `Faltam ${formatMinutes(Math.max(state.weeklyGoalMinutes - weeklyFocus, 0))} para fechar a carga planejada.`;
  } else {
    dom.focusPace.textContent = "Semana em construção";
    dom.focusPaceCopy.textContent = "Use foco, planner e questões para transformar o plano em tração.";
  }

  const highlightTip = priorities[0];
  dom.dashboardTip.textContent = highlightTip?.title ?? "Mantenha o fluxo";
  dom.dashboardTipCopy.textContent =
    reviewBacklog > 0
      ? `${reviewBacklog} revisão${reviewBacklog === 1 ? "" : "es"} aberta${reviewBacklog === 1 ? "" : "s"} pedem retomada nesta semana.`
      : highlightTip?.copy ?? "Concluir uma tarefa ou sessão atualiza seu progresso.";
};

export const renderGuidedStudy = () => {
  const lessons = getTrailLessons();
  const filteredLessons = getFilteredTrailLessons();
  const activeLesson = getActiveTrailLesson();
  const trailFilters = getTrailFilterState();
  const trailProgress = getTrailProgress();
  const subjectOverview = getTrailSubjectOverview();
  const subjectOptions = subjectOverview
    .map((subject) => `<option value="${subject.id}">${escapeHTML(subject.label)} (${subject.lessonCount})</option>`)
    .join("");

  if (dom.trailSummaryBadge) {
    const availableCount = lessons.filter((lesson) => !lesson.isPlaceholder).length;
    dom.trailSummaryBadge.textContent = `${availableCount} aulas com vídeo · ${subjectOverview.length} matérias`;
  }

  if (dom.trailSearch) {
    dom.trailSearch.value = trailFilters.query;
  }

  if (dom.trailSubjectFilter) {
    dom.trailSubjectFilter.innerHTML = `<option value="all">Todas as matérias</option>${subjectOptions}`;
    dom.trailSubjectFilter.value = trailFilters.subject;
  }

  if (dom.trailLevelFilter) {
    dom.trailLevelFilter.value = trailFilters.level;
  }

  if (dom.trailFocusFilter) {
    dom.trailFocusFilter.value = trailFilters.prova;
  }

  if (dom.trailResultCount) {
    dom.trailResultCount.textContent = `${filteredLessons.length} aula${filteredLessons.length === 1 ? "" : "s"} na visão atual`;
  }

  if (dom.trailCompletedCount) {
    dom.trailCompletedCount.textContent = `${trailProgress.completedTotal} vista${trailProgress.completedTotal === 1 ? "" : "s"} de ${trailProgress.totalLessons}`;
  }

  if (dom.trailProgressFill) {
    dom.trailProgressFill.style.width = `${trailProgress.percentage}%`;
  }

  if (dom.trailProgressText) {
    dom.trailProgressText.textContent =
      trailProgress.completedFiltered > 0
        ? `${trailProgress.completedFiltered} concluída${trailProgress.completedFiltered === 1 ? "" : "s"} dentro dos filtros atuais`
        : "Marque aulas como vistas para acompanhar o progresso da trilha.";
  }

  if (dom.trailSubjectRail) {
    dom.trailSubjectRail.innerHTML = subjectOverview
      .map((subject) => {
        const isActive = trailFilters.subject === subject.id;
        const classes = ["trail-subject-chip", isActive ? "is-active" : ""].filter(Boolean).join(" ");

        return `
          <button class="${classes}" type="button" data-trail-subject-chip="${subject.id}">
            <strong>${escapeHTML(subject.label)}</strong>
            <span>${subject.completedCount}/${subject.lessonCount}</span>
          </button>
        `;
      })
      .join("");
  }

  if (!filteredLessons.length) {
    if (dom.trailPlayerSubject) {
      dom.trailPlayerSubject.textContent = "Sem resultado";
    }

    if (dom.trailPlayerTopic) {
      dom.trailPlayerTopic.textContent = "Nenhuma aula corresponde aos filtros atuais";
    }

    if (dom.trailPlayerDescription) {
      dom.trailPlayerDescription.textContent = "Limpe a busca ou ajuste matéria, nível e foco para voltar a navegar pelas aulas da trilha.";
    }

    if (dom.trailPlayerTeacher) {
      dom.trailPlayerTeacher.textContent = "Ajuste os filtros para continuar.";
    }

    if (dom.trailPlayerLevel) {
      dom.trailPlayerLevel.textContent = "Sem nível";
    }

    if (dom.trailPlayerPriority) {
      dom.trailPlayerPriority.textContent = "Sem prioridade";
    }

    if (dom.trailPlayerFocus) {
      dom.trailPlayerFocus.textContent = "Sem foco";
    }

    if (dom.trailToggleCompleted) {
      dom.trailToggleCompleted.textContent = "Marcar como vista";
      dom.trailToggleCompleted.removeAttribute("data-lesson-id");
      dom.trailToggleCompleted.setAttribute("aria-pressed", "false");
    }

    if (dom.trailPlayerShell) {
      dom.trailPlayerShell.innerHTML = `
        <div class="trail-player-placeholder surface-subtle">
          <span>Sem resultados</span>
          <strong>Ajuste os filtros da trilha</strong>
          <p>Você pode trocar a matéria, mudar o foco da prova ou limpar a busca para visualizar novamente a biblioteca de aulas.</p>
        </div>
      `;
    }
  } else if (activeLesson) {
    const activeSubject = getSubjectMeta(activeLesson.subjectId);
    const completedSet = new Set(state.studyTrails.completedLessonIds);
    const isCompleted = completedSet.has(activeLesson.id);

    if (dom.trailPlayerSubject) {
      dom.trailPlayerSubject.textContent = activeSubject.label;
    }

    if (dom.trailPlayerTopic) {
      dom.trailPlayerTopic.textContent = activeLesson.topic;
    }

    if (dom.trailPlayerDescription) {
      dom.trailPlayerDescription.textContent = activeLesson.description;
    }

    if (dom.trailPlayerTeacher) {
      dom.trailPlayerTeacher.textContent = `${activeLesson.teacher} | ${activeLesson.channel}`;
    }

    if (dom.trailPlayerLevel) {
      dom.trailPlayerLevel.textContent = activeLesson.level;
    }

    if (dom.trailPlayerPriority) {
      dom.trailPlayerPriority.textContent = activeLesson.priority;
    }

    if (dom.trailPlayerFocus) {
      dom.trailPlayerFocus.textContent = formatProvas(activeLesson.provas);
    }

    if (dom.trailToggleCompleted) {
      dom.trailToggleCompleted.textContent = isCompleted ? "Remover dos vistos" : "Marcar como vista";
      dom.trailToggleCompleted.setAttribute("data-lesson-id", activeLesson.id);
      dom.trailToggleCompleted.setAttribute("aria-pressed", String(isCompleted));
    }

    if (dom.trailPlayerShell) {
      dom.trailPlayerShell.innerHTML = activeLesson.isPlaceholder
        ? `
            <div class="trail-player-placeholder surface-subtle">
              <span>Curadoria exata pendente</span>
              <strong>${escapeHTML(activeLesson.topic)}</strong>
              <p>Este tópico ainda não recebeu um video especifico validado. Preferi bloquear o player aqui em vez de exibir uma aula generica da matéria no lugar errado.</p>
            </div>
          `
        : `
            <iframe
              src="${escapeHTML(activeLesson.embedUrl)}"
              title="${escapeHTML(`${activeLesson.topic} | ${activeLesson.teacher}`)}"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          `;
    }
  }

  if (dom.trailLessonGrid) {
    dom.trailLessonGrid.innerHTML = filteredLessons.length
      ? renderTrailLessonCollection(filteredLessons, activeLesson?.id ?? "", state.studyTrails.completedLessonIds)
      : `
          <div class="trail-empty-state surface-subtle">
            <strong>Nenhuma aula encontrada</strong>
            <p>Ajuste busca, matéria, dificuldade ou foco para abrir outra parte da trilha.</p>
          </div>
        `;
  }
};

export const renderExamLibrary = () => {
  renderExamLibraryDownloads();
  return;

  const renderDownloadLinks = (downloads) =>
    downloads
      .map(
        (download) => `
          <a
            class="exam-chip-link"
            href="${escapeHTML(buildExamDownloadUrl(download))}"
            download="${escapeHTML(download.fileName)}"
            target="_blank"
            rel="noopener"
          >
            ${escapeHTML(download.label)}
          </a>
        `
      )
      .join("");

  if (dom.examLibraryEnem) {
    dom.examLibraryEnem.innerHTML = EXAM_LIBRARY.enem
      .map(
        (item) => `
          <article class="exam-year-card surface-subtle">
            <div class="exam-year-head">
              <strong>${item.year}</strong>
              <span>${escapeHTML(item.summary)}</span>
            </div>
            <div class="exam-link-group">
              ${renderDownloadLinks(item.downloads)}
                Abrir página oficial
            </div>
          </article>
        `
      )
      .join("");
  }

  if (dom.examLibraryUerj) {
    dom.examLibraryUerj.innerHTML = `
      <div class="exam-library-helper-row">
        <a class="exam-helper-link" href="${EXAM_LIBRARY_META.uerjFallbackUrl}" target="_blank" rel="noreferrer">Portal geral de provas</a>
        <a class="exam-helper-link" href="${EXAM_LIBRARY_META.uerjMagazineUrl}" target="_blank" rel="noreferrer">Revista eletrônica</a>
      </div>
      <div class="exam-library-list">
        ${EXAM_LIBRARY.uerj
          .map(
            (item) => `
              <article class="exam-year-card surface-subtle">
                <div class="exam-year-head">
                  <strong>${item.year}</strong>
                  <span>${escapeHTML(`${item.qualificationLabel} · discursiva`)}</span>
                </div>
                <div class="exam-link-group">
                  <a
                    class="exam-chip-link"
                    href="${item.qualificationUrl}"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Qualificação
                  </a>
                  <a
                    class="exam-chip-link"
                    href="${item.discursivaUrl}"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Discursiva
                  </a>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  }
};

const renderExamLibraryDownloads = () => {
  const renderDownloadLinks = (downloads, depth = 0) =>
    downloads
      .map((download) => {
        if (download.kind === "group") {
          return `
            <details class="exam-download-group" data-depth="${depth}">
              <summary class="exam-chip-link exam-chip-group-toggle" data-depth="${depth}">
                <span>${escapeHTML(download.label)}</span>
                ${download.description ? `<small>${escapeHTML(download.description)}</small>` : ""}
              </summary>
              <div class="exam-download-group-panel" data-depth="${depth + 1}">
                ${renderDownloadLinks(download.downloads, depth + 1)}
              </div>
            </details>
          `;
        }

        return `
          <a
            class="exam-chip-link"
            href="${escapeHTML(buildExamDownloadUrl(download))}"
            download="${escapeHTML(download.fileName)}"
            target="_blank"
            rel="noopener"
            data-download-mode="${escapeHTML(download.delivery || "route")}"
            data-download-source="${escapeHTML(download.sourceUrl)}"
            data-download-filename="${escapeHTML(download.fileName)}"
          >
            ${escapeHTML(download.label)}
          </a>
        `;
      })
      .join("");

  if (dom.examLibraryEnem) {
    dom.examLibraryEnem.innerHTML = EXAM_LIBRARY.enem
      .map(
        (item) => `
          <article class="exam-year-card surface-subtle">
            <div class="exam-year-head">
              <strong>${item.year}</strong>
              <span>${escapeHTML(item.summary)}</span>
            </div>
            <div class="exam-link-group">
              ${renderDownloadLinks(item.downloads)}
            </div>
          </article>
        `
      )
      .join("");
  }

  if (dom.examLibraryUerj) {
    dom.examLibraryUerj.innerHTML = `
      <div class="exam-library-list">
        ${EXAM_LIBRARY.uerj
          .map(
            (item) => `
              <article class="exam-year-card surface-subtle">
                <div class="exam-year-head">
                  <strong>${item.year}</strong>
                  <span>${escapeHTML(item.summary)}</span>
                </div>
                <div class="exam-link-group">
                  ${renderDownloadLinks(item.downloads)}
                </div>
              </article>
            `
          )
          .join("")}
      </div>
      <p class="module-intro">${escapeHTML(EXAM_LIBRARY_META.uerjStageNote)}</p>
    `;
  }
};

export const renderBasicMath = () => {
  if (!dom.basicMathGrid) {
    return;
  }

  const lessons = getBasicMathLessons();

  if (dom.basicMathBadge) {
    dom.basicMathBadge.textContent = `${lessons.length} tópicos · ENEM e UERJ`;
  }

  dom.basicMathGrid.innerHTML = lessons
    .map((lesson, index) => {
      const videoId = lesson.embedUrl.split("/embed/")[1]?.split(/[?&]/)[0] ?? "";
      const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return `
        <article class="basic-math-card surface-card">
          <button
            class="basic-math-thumb"
            type="button"
            data-yt-facade="${escapeHTML(videoId)}"
            data-yt-title="${escapeHTML(`${lesson.topic} | ${lesson.teacher}`)}"
            style="background-image: url('${thumb}')"
            aria-label="Assistir videoaula: ${escapeHTML(lesson.topic)}"
          >
            <span class="basic-math-index">${index + 1}</span>
            <span class="basic-math-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </span>
          </button>
          <div class="basic-math-body">
            <div class="basic-math-meta">
              <span>${escapeHTML(lesson.level)}</span>
              <span>${escapeHTML(formatProvasShort(lesson.provas))}</span>
            </div>
            <strong>${escapeHTML(lesson.topic)}</strong>
            <p>${escapeHTML(lesson.description)}</p>
            <span class="basic-math-teacher">${escapeHTML(lesson.teacher)}</span>
          </div>
        </article>
      `;
    })
    .join("");
};

// Card de vídeo reaproveitável (área UERJ Discursiva). Trata aula sem vídeo (placeholder).
const renderVideoCard = (lesson) => {
  const videoId = lesson.embedUrl.split("/embed/")[1]?.split(/[?&]/)[0] ?? "";
  const media = lesson.isPlaceholder
    ? `<div class="basic-math-thumb is-soon"><span class="basic-math-soon">Em breve</span></div>`
    : `
        <button
          class="basic-math-thumb"
          type="button"
          data-yt-facade="${escapeHTML(videoId)}"
          data-yt-title="${escapeHTML(`${lesson.topic} | ${lesson.teacher}`)}"
          style="background-image: url('https://i.ytimg.com/vi/${videoId}/hqdefault.jpg')"
          aria-label="Assistir videoaula: ${escapeHTML(lesson.topic)}"
        >
          <span class="basic-math-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </button>`;

  return `
    <article class="basic-math-card surface-card">
      ${media}
      <div class="basic-math-body">
        <div class="basic-math-meta">
          <span>${escapeHTML(lesson.level)}</span>
          <span>${escapeHTML(formatProvasShort(lesson.provas))}</span>
        </div>
        <strong>${escapeHTML(lesson.topic)}</strong>
        <p>${escapeHTML(lesson.description)}</p>
        <span class="basic-math-teacher">${escapeHTML(lesson.teacher)}</span>
      </div>
    </article>
  `;
};

export const renderUerjDiscursiva = () => {
  if (!dom.discursivaContent) {
    return;
  }

  const block = (kicker, title, lessons) =>
    lessons.length
      ? `
        <div class="discursiva-block">
          <div class="discursiva-block-head">
            <span class="module-kicker">${escapeHTML(kicker)}</span>
            <h3>${escapeHTML(title)}</h3>
          </div>
          <div class="basic-math-grid">${lessons.map(renderVideoCard).join("")}</div>
        </div>
      `
      : "";

  const redacao = getRedacaoUerjLesson();

  dom.discursivaContent.innerHTML =
    block("Comece por aqui", "Entenda a prova", getMetodoUerjLessons()) +
    block("Texto + obra", "Redação UERJ", redacao ? [redacao] : []) +
    block(`Leitura obrigatória · ciclo ${CURRENT_CICLO}`, "Obras do edital", getUerjObras());
};

export const renderOverview = () => {
  const weeklyFocus = getRecentStudyMinutes(7);
  const weeklyGoalProgress = getWeeklyGoalProgress();
  const completedTasks = getCompletedTasks();
  const totalTasks = state.tasks.length;
  const mockAccuracy = getMockAccuracy();
  const streak = getStudyStreak();
  const plannedMinutes = getPlannedMinutes();
  const latestAttempt = getLatestMockAttempt();

  dom.summaryFocus.textContent = formatMinutes(weeklyFocus);
  dom.summaryFocusCopy.textContent = `${weeklyGoalProgress}% da meta semanal concluída`;
  dom.summaryTasks.textContent = `${completedTasks}/${totalTasks}`;
  dom.summaryTasksCopy.textContent = `${Math.max(totalTasks - completedTasks, 0)} pendência${totalTasks - completedTasks === 1 ? "" : "s"} ainda em aberto`;
  dom.summaryAccuracy.textContent = `${mockAccuracy}%`;
  dom.summaryAccuracyCopy.textContent = latestAttempt
    ? `${latestAttempt.label} em ${formatShortDate(latestAttempt.timestamp)}`
    : "Sem treino registrado ainda";
  dom.summaryStreak.textContent = `${streak} ${streak === 1 ? "dia" : "dias"}`;
  dom.summaryStreakCopy.textContent = plannedMinutes
    ? `${formatMinutes(plannedMinutes)} planejados nesta semana`
    : "Organize o planner para ganhar ritmo";
};

export const renderPomodoro = () => {
  const remainingSeconds = state.pomodoro.isRunning ? getCurrentPomodoroSeconds() : state.pomodoro.remainingSeconds;
  state.pomodoro.remainingSeconds = remainingSeconds;

  dom.pomodoroTime.textContent = formatTime(remainingSeconds);
  dom.pomodoroSessions.textContent = String(state.pomodoro.completedSessions);
  dom.pomodoroMinutes.textContent = `${state.pomodoro.totalFocusMinutes} min`;

  if (state.pomodoro.isRunning) {
    dom.pomodoroStatus.textContent = "Foco em andamento";
  } else if (remainingSeconds !== state.pomodoro.durationSeconds) {
    dom.pomodoroStatus.textContent = "Pausado";
  } else {
    dom.pomodoroStatus.textContent = "Pronto para iniciar";
  }

  dom.pomodoroButtons.forEach((button) => {
    const action = button.getAttribute("data-pomodoro-action");
    if (action === "start") {
      button.disabled = state.pomodoro.isRunning;
    }
    if (action === "pause") {
      button.disabled = !state.pomodoro.isRunning;
    }
  });

  updateDocumentTitle(remainingSeconds);
};

export const renderTasks = () => {
  const sortedTasks = [...state.tasks].sort((taskA, taskB) => Number(taskA.completed) - Number(taskB.completed));
  const completedTasks = getCompletedTasks();

  dom.taskCompletedCount.textContent = String(completedTasks);
  dom.taskTotalCount.textContent = String(state.tasks.length);
  dom.taskEmpty.hidden = state.tasks.length > 0;

  dom.taskList.innerHTML = sortedTasks
    .map((task) => {
      const subject = getSubjectMeta(task.subject);
      const track = getTrackMeta(task.track);
      const completedClass = task.completed ? " is-completed" : "";
      const safeTitle = escapeHTML(task.title);

      return `
        <li class="task-item${completedClass}" data-task-id="${task.id}">
          <button class="task-check" type="button" data-task-toggle aria-label="${task.completed ? "Desmarcar" : "Concluir"} tarefa" aria-pressed="${String(task.completed)}">${task.completed ? "✓" : ""}</button>
          <div class="task-content">
            <strong>${safeTitle}</strong>
            <span class="task-meta">${subject.label} | ${track.shortLabel} | ${task.estimate} min</span>
          </div>
          <div class="task-actions">
            <button class="icon-button" type="button" data-task-delete aria-label="Excluir tarefa">x</button>
          </div>
        </li>
      `;
    })
    .join("");
};

export const renderPlanner = () => {
  const sessionsByDay = new Map();

  state.sessions.forEach((session) => {
    const daySessions = sessionsByDay.get(session.day) ?? [];
    daySessions.push(session);
    sessionsByDay.set(session.day, daySessions);
  });

  dom.sessionTotal.textContent = String(state.sessions.length);

  dom.sessionColumns.forEach((column, dayIndex) => {
    const sessions = [...(sessionsByDay.get(dayIndex) ?? [])].sort((sessionA, sessionB) => sessionA.start.localeCompare(sessionB.start));
    const countBadge = dom.sessionCounts.find((count) => count.getAttribute("data-session-count") === String(dayIndex));

    if (countBadge) {
      countBadge.textContent = String(sessions.length);
    }

    if (!sessions.length) {
      column.innerHTML = `<p class="empty-state">Nenhuma sessão planejada.</p>`;
      return;
    }

    column.innerHTML = sessions
      .map((session) => {
        const subject = getSubjectMeta(session.subject);
        const track = getTrackMeta(session.track);

        return `
          <article class="session-card" data-session-id="${session.id}" data-track="${track.id}">
            <strong>${escapeHTML(session.title)}</strong>
            <time>${session.start} - ${session.end}</time>
            <div class="session-meta">
              <span>${subject.label}</span>
              <span class="track-pill" data-track="${track.id}">${track.shortLabel}</span>
            </div>
            <div class="session-actions">
              <button type="button" data-session-edit>Editar</button>
              <button type="button" data-session-delete>Excluir</button>
            </div>
          </article>
        `;
      })
      .join("");
  });
};

export const renderMock = () => {
  if (!dom.mockSetup) {
    return;
  }

  const active = isMockActive();
  const submitted = state.mock.submitted;
  const trackMeta = getTrackMeta(getActiveTrackId());

  // Alterna entre tela de início, simulado em andamento e resultado.
  dom.mockSetup.hidden = active;
  if (dom.mockPlay) dom.mockPlay.hidden = !(active && !submitted);
  if (dom.mockResult) dom.mockResult.hidden = !(active && submitted);

  // Tela de início: destaca o tamanho escolhido e mostra o que há no banco.
  dom.mockSizeButtons.forEach((button) => {
    button.classList.toggle("is-selected", Number(button.dataset.mockSize) === state.mock.config.size);
  });
  if (dom.mockSetupCopy) {
    dom.mockSetupCopy.textContent = `Questões objetivas no foco ${trackMeta.shortLabel} — ${getMockPoolSize()} disponíveis no banco. O cronômetro começa ao iniciar.`;
  }

  if (!active) {
    if (dom.mockProgress) dom.mockProgress.textContent = "Pronto para começar";
    updateMockTimer();
    return;
  }

  const questions = getMockQuestions();
  const total = questions.length;
  const answeredQuestions = questions.filter((item) => typeof state.mock.answers[item.id] === "number").length;
  const allAnswered = total > 0 && answeredQuestions === total;
  const idx = Math.min(Math.max(state.mock.currentQuestionIndex, 0), total - 1);
  const question = questions[idx];
  const selectedIndex = state.mock.answers[question.id];
  const hasSelection = typeof selectedIndex === "number";

  if (dom.mockProgress) {
    dom.mockProgress.textContent = submitted ? "Simulado finalizado" : `Questão ${idx + 1} de ${total}`;
  }

  dom.mockSubject.textContent = getSubjectMeta(question.subject).label;
  dom.mockHelper.textContent = `${getTrackMeta(question.track).shortLabel} · ${question.topic} · ${question.difficulty}`;
  dom.mockQuestion.textContent = question.prompt;
  dom.mockPrev.disabled = idx === 0;
  dom.mockNext.disabled = idx === total - 1;
  dom.mockSubmit.disabled = !allAnswered || submitted;
  dom.mockSubmit.textContent = submitted ? "Finalizado" : "Finalizar simulado";

  dom.mockTrack.style.setProperty("--mock-count", String(total));
  dom.mockTrack.innerHTML = questions
    .map((item, index) => {
      const isCurrent = index === idx;
      const isAnswered = typeof state.mock.answers[item.id] === "number";
      const classes = [isCurrent ? "is-active" : "", isAnswered ? "is-complete" : ""].filter(Boolean).join(" ");
      return `<span class="${classes}"></span>`;
    })
    .join("");

  dom.mockOptions.innerHTML = question.options
    .map((option, index) => {
      const isSelected = selectedIndex === index;
      const selectedClass = isSelected ? " is-selected" : "";
      const tabIndex = isSelected || (!hasSelection && index === 0) ? "0" : "-1";

      return `
        <button
          class="mock-option${selectedClass}"
          type="button"
          data-option-index="${index}"
          role="radio"
          tabindex="${tabIndex}"
          aria-checked="${String(isSelected)}"
          aria-label="Alternativa ${OPTION_LETTERS[index]}: ${escapeHTML(option)}"
        >
          <span class="mock-option-letter">${OPTION_LETTERS[index]}</span>
          <span>${escapeHTML(option)}</span>
        </button>
      `;
    })
    .join("");

  updateMockTimer();

  if (!submitted) {
    dom.mockFeedback.textContent = `${answeredQuestions} de ${total} respondidas`;
    return;
  }

  // ----- Resultado + revisão dos erros -----
  const latestAttempt = getLatestMockAttempt();
  const accuracy = latestAttempt ? Math.round((latestAttempt.score / latestAttempt.total) * 100) : 0;
  const durationSeconds = latestAttempt?.durationSeconds ?? 0;
  const timeLabel = durationSeconds ? ` em ${formatTime(durationSeconds)}` : "";
  const feedbackMessage =
    accuracy >= 80
      ? "Boa consistência. Suba o tamanho ou a dificuldade no próximo."
      : accuracy >= 60
        ? "Bom caminho. Revise os erros abaixo e repita para consolidar."
        : "O diagnóstico apareceu. Revise os erros e volte com uma nova rodada.";

  dom.resultScore.textContent = `${latestAttempt?.score ?? 0}/${latestAttempt?.total ?? 0} · ${accuracy}%`;
  dom.resultCopy.textContent = `Você fechou ${latestAttempt?.score ?? 0} de ${latestAttempt?.total ?? 0}${timeLabel}. ${feedbackMessage}`;

  if (dom.mockReview) {
    const review = getMockReview();
    dom.mockReview.innerHTML = review.length
      ? `<h4 class="mock-review-title">Revise o que você errou (${review.length})</h4>` +
        review
          .map(
            ({ question: item, picked }) => `
            <div class="mock-review-item surface-card">
              <span class="mock-review-meta">${escapeHTML(getSubjectMeta(item.subject).label)} · ${escapeHTML(item.topic)}</span>
              <p class="mock-review-prompt">${escapeHTML(item.prompt)}</p>
              <p class="mock-review-answer"><span class="bank-verdict is-wrong">Você: ${OPTION_LETTERS[picked]}) ${escapeHTML(item.options[picked])}</span></p>
              <p class="mock-review-answer"><span class="bank-verdict is-correct">Correta: ${OPTION_LETTERS[item.correctIndex]}) ${escapeHTML(item.options[item.correctIndex])}</span></p>
              ${item.explanation ? `<p class="mock-review-expl">${escapeHTML(item.explanation)}</p>` : ""}
            </div>`
          )
          .join("")
      : `<p class="mock-review-empty">Você não errou nenhuma questão. 🎯</p>`;
  }
};

// Atualiza apenas o texto do cronômetro (chamado a cada segundo pelo ticker).
export const updateMockTimer = () => {
  if (!dom.mockTimer) {
    return;
  }
  const elapsed = getMockElapsedSeconds();
  dom.mockTimer.textContent = `⏱ ${formatTime(elapsed)}`;
  dom.mockTimer.classList.toggle("is-running", state.mock.startedAt && !state.mock.submitted);
};

const renderBankDiscursiveCard = (question, subjectMeta, trackMeta, revealed) => {
  const rubrica = Array.isArray(question.rubrica) ? question.rubrica : [];
  const totalPts = rubrica.reduce((sum, item) => sum + (Number(item.pontos) || 0), 0);
  const rubricaHtml = rubrica
    .map((item) => `<li>${escapeHTML(item.etapa)} — <strong>${item.pontos} pt</strong></li>`)
    .join("");

  const padraoHtml = revealed
    ? `
      <div class="bank-explanation surface-subtle">
        <strong>Padrão de resposta esperada</strong>
        <p>${escapeHTML(question.respostaEsperada || "")}</p>
        <strong>Distribuição de pontos (total: ${totalPts} pts)</strong>
        <ul class="bank-rubrica">${rubricaHtml}</ul>
      </div>
    `
    : "";

  return `
    <article class="bank-question bank-question-discursiva surface-card" data-question-id="${question.id}">
      <div class="bank-question-head">
        <span class="subject-tag">${escapeHTML(subjectMeta.label)}</span>
        <span class="bank-pill">${escapeHTML(question.topic)}</span>
        <span class="bank-pill bank-pill-track">${escapeHTML(trackMeta.shortLabel)}</span>
        <span class="bank-pill bank-pill-diff">${escapeHTML(question.difficulty)}</span>
        <span class="bank-pill bank-pill-tipo">Discursiva</span>
      </div>
      <span class="bank-source bank-source-autoral">Questão autoral · estilo UERJ (Exame Discursivo)</span>
      <p class="bank-question-prompt">${escapeHTML(question.prompt)}</p>
      <div class="bank-question-actions">
        <button class="btn btn-ghost" type="button" data-bank-reveal="${question.id}">
          ${revealed ? "Ocultar padrão" : "Ver padrão de resposta"}
        </button>
      </div>
      ${padraoHtml}
    </article>
  `;
};

const renderBankQuestionCard = (question) => {
  const subjectMeta = getSubjectMeta(question.subject);
  const trackMeta = getTrackMeta(question.track);
  const revealed = isPracticeRevealed(question.id);

  if (question.tipo === "discursiva") {
    return renderBankDiscursiveCard(question, subjectMeta, trackMeta, revealed);
  }

  const pickedIndex = getPracticeAnswer(question.id);

  const optionsHtml = question.options
    .map((option, index) => {
      let stateClass = "";
      if (revealed) {
        if (index === question.correctIndex) {
          stateClass = " is-correct";
        } else if (index === pickedIndex) {
          stateClass = " is-wrong";
        }
      }

      return `
        <button
          class="bank-option${stateClass}"
          type="button"
          data-bank-option="${question.id}"
          data-bank-option-index="${index}"
          ${revealed ? "disabled" : ""}
          aria-label="Alternativa ${OPTION_LETTERS[index]}: ${escapeHTML(option)}"
        >
          <span class="bank-option-letter">${OPTION_LETTERS[index]}</span>
          <span>${escapeHTML(option)}</span>
        </button>
      `;
    })
    .join("");

  let feedbackHtml = "";
  if (revealed) {
    const verdict =
      typeof pickedIndex === "number" && pickedIndex >= 0
        ? pickedIndex === question.correctIndex
          ? '<span class="bank-verdict is-correct">Você acertou!</span>'
          : '<span class="bank-verdict is-wrong">Resposta marcada incorreta.</span>'
        : "";

    feedbackHtml = `
      <div class="bank-explanation surface-subtle">
        ${verdict}
        <strong>Gabarito: ${OPTION_LETTERS[question.correctIndex]}) ${escapeHTML(question.options[question.correctIndex])}</strong>
        <p>${escapeHTML(question.explanation)}</p>
      </div>
    `;
  }

  return `
    <article class="bank-question surface-card" data-question-id="${question.id}">
      <div class="bank-question-head">
        <span class="subject-tag">${escapeHTML(subjectMeta.label)}</span>
        <span class="bank-pill">${escapeHTML(question.topic)}</span>
        <span class="bank-pill bank-pill-track">${escapeHTML(trackMeta.shortLabel)}</span>
        <span class="bank-pill bank-pill-diff">${escapeHTML(question.difficulty)}</span>
      </div>
      ${
        question.source
          ? `<span class="bank-source">Prova oficial: ${escapeHTML(question.source)}</span>`
          : `<span class="bank-source bank-source-autoral">Questão autoral · estilo ${escapeHTML(trackMeta.shortLabel)}</span>`
      }
      <p class="bank-question-prompt">${escapeHTML(question.prompt)}</p>
      <div class="bank-options" role="list">${optionsHtml}</div>
      <div class="bank-question-actions">
        <button class="btn btn-ghost" type="button" data-bank-reveal="${question.id}">
          ${revealed ? "Refazer questão" : "Ver resposta"}
        </button>
      </div>
      ${feedbackHtml}
    </article>
  `;
};

export const renderQuestionBank = () => {
  if (!dom.bankGrid) {
    return;
  }

  const filters = getPracticeFilters();
  const topics = getPracticeTopics(filters.subject);

  if (dom.bankSubject) {
    dom.bankSubject.value = filters.subject;
  }

  if (dom.bankTopic) {
    dom.bankTopic.innerHTML = ['<option value="all">Todos os conteúdos</option>']
      .concat(topics.map((topic) => `<option value="${escapeHTML(topic)}">${escapeHTML(topic)}</option>`))
      .join("");
    dom.bankTopic.value = filters.topic;
    dom.bankTopic.disabled = filters.subject === "all" || topics.length === 0;
  }

  if (dom.bankTrack) {
    dom.bankTrack.value = filters.track;
  }

  if (dom.bankLevel) {
    dom.bankLevel.value = filters.level;
  }

  if (dom.bankTipo) {
    dom.bankTipo.value = filters.tipo;
  }

  if (dom.bankSearch && document.activeElement !== dom.bankSearch) {
    dom.bankSearch.value = filters.query;
  }

  if (dom.bankErrors) {
    const wrongCount = getPracticePerformance().wrongCount;
    dom.bankErrors.checked = filters.onlyErrors;
    dom.bankErrors.disabled = wrongCount === 0 && !filters.onlyErrors;
    if (dom.bankErrorsCount) {
      dom.bankErrorsCount.textContent = wrongCount ? `(${wrongCount})` : "";
    }
  }

  const questions = getFilteredPracticeQuestions();

  if (dom.bankCount) {
    dom.bankCount.textContent = `${questions.length} quest${questions.length === 1 ? "ão" : "ões"}`;
  }

  dom.bankGrid.innerHTML = questions.map(renderBankQuestionCard).join("");

  if (dom.bankEmpty) {
    dom.bankEmpty.hidden = questions.length !== 0;
  }
};

export const populateBankSubjectOptions = () => {
  if (!dom.bankSubject) {
    return;
  }

  dom.bankSubject.innerHTML = ['<option value="all">Todas as matérias</option>']
    .concat(getPracticeSubjectsInBank().map((subject) => `<option value="${subject.id}">${escapeHTML(subject.label)}</option>`))
    .join("");
};

const formatExamDateLabel = (iso) => {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

// Faixa "Seu plano": curso, matérias de maior peso e a próxima prova (a plataforma diz a data).
export const renderMeuPlano = () => {
  if (!dom.meuPlano) {
    return;
  }

  const curso = getCursoMeta();
  const trackMeta = getTrackMeta(getActiveTrackId());

  if (dom.planoCurso) {
    dom.planoCurso.textContent = curso ? curso.nome : "Curso ainda não definido";
  }
  if (dom.planoProva) {
    const campi = curso ? getCursoCampi(curso.id) : [];
    dom.planoProva.textContent =
      campi.length && getActiveTrackId() === "uerj"
        ? `UERJ · ${campi.join(" · ")}`
        : `Foco de estudo: ${trackMeta.shortLabel}`;
  }

  if (dom.planoPesos) {
    const pesos = getCursoPesoSubjects();
    dom.planoPesos.innerHTML = pesos.length
      ? pesos
          .map(
            (subject) =>
              `<button type="button" class="peso-chip peso-chip-action" style="--peso-accent:${subject.accent};" data-peso-subject="${subject.id}" title="Treinar ${escapeHTML(subject.label)} no banco">${escapeHTML(subject.label)}</button>`
          )
          .join("")
      : `<span class="meu-plano-hint">Defina seu curso para ver — e treinar — as matérias de maior peso.</span>`;
  }

  const nextExam = getNextExam();
  if (dom.planoExamDate) {
    dom.planoExamDate.textContent = nextExam
      ? `${nextExam.provaNome} · ${nextExam.label}`
      : "Sem prova futura no calendário";
  }
  if (dom.planoExamCount) {
    if (nextExam) {
      const dias = nextExam.daysUntil;
      const quando =
        dias === 0 ? "é hoje!" : dias === 1 ? "falta 1 dia" : `faltam ${dias} dias`;
      dom.planoExamCount.textContent = `${formatExamDateLabel(nextExam.data)} · ${quando}${nextExam.previsto ? " (prevista)" : ""}`;
    } else {
      dom.planoExamCount.textContent = "";
    }
  }
};

// Card "Estudar hoje": a próxima ação concreta, no topo do painel.
export const renderStudyToday = () => {
  if (!dom.studyToday) {
    return;
  }

  const suggestion = getStudyTodaySuggestion();
  const performance = getPracticePerformance();

  if (dom.studyEyebrow) dom.studyEyebrow.textContent = suggestion.eyebrow;
  if (dom.studyTitle) dom.studyTitle.textContent = suggestion.title;
  if (dom.studyCopy) dom.studyCopy.textContent = suggestion.copy;

  if (dom.studyCta) {
    dom.studyCta.textContent = suggestion.ctaLabel;
    dom.studyCta.dataset.studyTarget = suggestion.target ?? "#banco";
    dom.studyCta.dataset.studyKind = suggestion.kind ?? "";
    if (suggestion.subject) {
      dom.studyCta.dataset.studySubject = suggestion.subject;
    } else {
      delete dom.studyCta.dataset.studySubject;
    }
    if (suggestion.topic) {
      dom.studyCta.dataset.studyTopic = suggestion.topic;
    } else {
      delete dom.studyCta.dataset.studyTopic;
    }
  }

  if (dom.studyMetric) {
    const show = performance.answered > 0;
    dom.studyMetric.hidden = !show;
    if (show && dom.studyMetricValue) {
      dom.studyMetricValue.textContent = `${performance.accuracy}%`;
    }
  }
};

// ===== Redação =====
const renderRedacaoTemaCard = (tema) => `
  <article class="redacao-tema surface-subtle">
    <span class="redacao-tema-eixo">${escapeHTML(tema.eixo)}</span>
    <h4>${escapeHTML(tema.titulo)}</h4>
    <p class="redacao-tema-comando">${escapeHTML(tema.comando)}</p>
    <details class="redacao-tema-rep">
      <summary>Repertórios para usar</summary>
      <ul>${tema.repertorios.map((rep) => `<li>${escapeHTML(rep)}</li>`).join("")}</ul>
    </details>
  </article>`;

const redacaoBandMessage = (total, max) => {
  const ratio = max ? total / max : 0;
  if (total === 0) return "Preencha as competências para ver a leitura.";
  if (ratio >= 0.9) return "Nota de elite. Mantenha o padrão e cuide do tempo de escrita.";
  if (ratio >= 0.7) return "Boa redação. Ajuste os pontos mais baixos para subir de faixa.";
  if (ratio >= 0.5) return "No caminho. Reforce a competência com menor nota antes da próxima.";
  return "Base a construir. Escolha uma competência por vez e treine só ela.";
};

export const updateRedacaoTotal = () => {
  if (!dom.redacaoTotal) {
    return;
  }
  const { prova } = getRedacaoState();
  const scale = getRedacaoScale(prova);
  const total = getRedacaoTotal(prova);
  dom.redacaoTotal.textContent = `${total} / ${scale.total}`;
  if (dom.redacaoBand) {
    dom.redacaoBand.textContent = redacaoBandMessage(total, scale.total);
  }
};

export const renderRedacao = () => {
  if (!dom.redacaoTemas) {
    return;
  }

  const { prova, scores } = getRedacaoState();

  if (dom.redacaoProva) {
    dom.redacaoProva.value = prova;
  }

  dom.redacaoTemas.innerHTML = getRedacaoTemas(prova).map(renderRedacaoTemaCard).join("");

  const scale = getRedacaoScale(prova);
  if (dom.redacaoCriteria) {
    dom.redacaoCriteria.innerHTML = getRedacaoCriteria(prova)
      .map((criterio) => {
        const current = Number(scores[criterio.id]) || 0;
        const options = [];
        for (let value = 0; value <= scale.max; value += scale.step) {
          options.push(`<option value="${value}"${value === current ? " selected" : ""}>${value}</option>`);
        }
        return `
          <div class="redacao-criterio">
            <div class="redacao-criterio-head">
              <strong>${escapeHTML(criterio.titulo)}</strong>
              <select data-redacao-score="${criterio.id}" aria-label="Nota de ${escapeHTML(criterio.titulo)}">${options.join("")}</select>
            </div>
            <p>${escapeHTML(criterio.descricao)}</p>
          </div>`;
      })
      .join("");
  }

  if (dom.redacaoGraderIntro) {
    dom.redacaoGraderIntro.textContent =
      prova === "uerj"
        ? "Dê de 0 a 5 a cada critério depois de escrever 20–30 linhas dialogando com a obra do edital."
        : "Dê uma nota honesta de 0 a 200 a cada competência depois de escrever. O total mostra onde focar.";
  }

  updateRedacaoTotal();
};

// Painel "Seus pontos fracos": acerto por conteúdo, derivado das respostas reais.
// Mini-gráfico de evolução do acerto acumulado (P5).
const renderPerfTimeline = () => {
  if (!dom.perfTimeline) {
    return;
  }
  const timeline = getPerformanceTimeline(12);
  if (timeline.length < 2) {
    dom.perfTimeline.hidden = true;
    dom.perfTimeline.innerHTML = "";
    return;
  }

  const first = timeline[0].accuracy;
  const last = timeline[timeline.length - 1].accuracy;
  const delta = last - first;
  const deltaLabel = delta > 0 ? `▲ +${delta} pts` : delta < 0 ? `▼ ${delta} pts` : "estável";

  dom.perfTimeline.hidden = false;
  dom.perfTimeline.innerHTML = `
    <div class="perf-timeline-head">
      <span class="perf-timeline-label">Evolução do acerto</span>
      <span class="perf-timeline-delta ${delta >= 0 ? "is-up" : "is-down"}">${deltaLabel}</span>
    </div>
    <div class="perf-bars">
      ${timeline
        .map(
          (point) =>
            `<div class="perf-bar" title="${point.dateKey}: ${point.accuracy}% em ${point.answered} questões"><span style="height:${Math.max(8, point.accuracy)}%;"></span></div>`
        )
        .join("")}
    </div>`;
};

export const renderWeakPoints = () => {
  if (!dom.weakPoints) {
    return;
  }

  const performance = getPracticePerformance();

  if (dom.weakAccuracy) {
    dom.weakAccuracy.hidden = !performance.answered;
    dom.weakAccuracy.textContent = performance.answered ? `${performance.accuracy}% de acerto` : "";
  }

  const dueReviews = getDueReviewCount();
  if (dom.reviewsCta) {
    dom.reviewsCta.hidden = dueReviews === 0;
    dom.reviewsCta.textContent = `Revisões de hoje (${dueReviews})`;
  }

  renderPerfTimeline();

  if (performance.answered === 0) {
    if (dom.weakSummary) {
      dom.weakSummary.textContent =
        "Responda questões no banco para o Aprova+ medir onde você acerta e onde precisa reforçar.";
    }
    if (dom.weakList) dom.weakList.innerHTML = "";
    if (dom.weakCta) dom.weakCta.hidden = true;
    return;
  }

  if (dom.weakSummary) {
    dom.weakSummary.textContent = `${performance.answered} respondida${performance.answered === 1 ? "" : "s"} · ${performance.correct} certa${performance.correct === 1 ? "" : "s"} · ${performance.wrongCount} errada${performance.wrongCount === 1 ? "" : "s"}.`;
  }

  if (dom.weakList) {
    const items = performance.weakTopics.slice(0, 5);
    dom.weakList.innerHTML = items.length
      ? items
          .map(
            (topic) => `
            <li class="weak-point" data-weak-train data-weak-subject="${topic.subject}" data-weak-topic="${escapeHTML(topic.topic)}" role="button" tabindex="0">
              <div class="weak-point-head">
                <strong>${escapeHTML(topic.topic)}</strong>
                <span>${topic.accuracy}%</span>
              </div>
              <span class="weak-point-sub">${escapeHTML(topic.label)} · ${topic.correct}/${topic.answered} acertos</span>
              <div class="weak-point-bar"><span style="width:${topic.accuracy}%;"></span></div>
            </li>`
          )
          .join("")
      : `<li class="weak-point-empty">Nenhum ponto fraco aberto: acerto acima de 70% em todos os conteúdos treinados. Continue assim! 🎯</li>`;
  }

  if (dom.weakCta) {
    dom.weakCta.hidden = performance.wrongCount === 0;
    dom.weakCta.textContent = `Refazer os ${performance.wrongCount} que errei`;
  }
};

export const renderAnalytics = () => {
  const coverage = getCoverageScore();
  const weeklyMinutes = Array.from({ length: 7 }, (_, index) => {
    const date = getDateFromOffset(index - 6);
    return {
      label: formatWeekday(date).slice(0, 3),
      minutes: state.studyLog[toDateKey(date)] ?? 0,
    };
  });
  const totalWeeklyMinutes = weeklyMinutes.reduce((sum, item) => sum + item.minutes, 0);
  const maxDayMinutes = Math.max(...weeklyMinutes.map((item) => item.minutes), 30);
  const bestDay = weeklyMinutes.reduce((currentBest, item) => (item.minutes > currentBest.minutes ? item : currentBest), weeklyMinutes[0]);
  const averageMinutes = Math.round(totalWeeklyMinutes / weeklyMinutes.length);
  const subjectDistribution = getSubjectDistribution();
  const weeklyGoalProgress = getWeeklyGoalProgress();
  const activeDays = Array.from({ length: 28 }, (_, index) => state.studyLog[toDateKey(getDateFromOffset(index - 27))] ?? 0).filter((minutes) => minutes > 0).length;

  dom.readinessRing.style.setProperty("--progress", String(coverage));
  dom.readinessScore.textContent = `${coverage}%`;

  dom.subjectList.innerHTML = subjectDistribution.length
    ? subjectDistribution
        .map(
          (subject) => `
            <div class="subject-row">
              <div class="subject-row-header">
                <strong>${subject.label}</strong>
                <span>${formatMinutes(subject.minutes)}</span>
              </div>
              <div class="subject-bar"><span style="width:${subject.percentage}%; background:${subject.accent};"></span></div>
            </div>
          `
        )
        .join("")
    : `<p class="empty-state">Crie tarefas e sessões para visualizar a distribuição por matéria.</p>`;

  dom.weeklyChart.innerHTML = weeklyMinutes
    .map((item) => {
      const height = Math.max(14, Math.round((item.minutes / maxDayMinutes) * 100));
      return `
        <div class="weekly-bar">
          <div class="weekly-bar-track">
            <div class="weekly-bar-fill" style="height:${height}%;"></div>
          </div>
          <strong class="weekly-bar-label">${item.label}</strong>
          <span class="weekly-bar-value">${item.minutes} min</span>
        </div>
      `;
    })
    .join("");

  dom.chartBestDay.textContent = bestDay.minutes > 0 ? `${bestDay.label} | ${formatMinutes(bestDay.minutes)}` : "Sem registros";
  dom.chartAverage.textContent = formatMinutes(averageMinutes);
  dom.chartGoal.textContent = `${weeklyGoalProgress}%`;

  dom.mockHistory.innerHTML = state.mock.attempts.length
    ? state.mock.attempts
        .slice(0, 4)
        .map((attempt) => {
          const percentage = Math.round((attempt.score / attempt.total) * 100);
          return `
            <article class="mock-history-item">
              <div>
                <strong>${escapeHTML(attempt.label)}</strong>
                <span>${formatShortDate(attempt.timestamp)}</span>
              </div>
              <strong>${attempt.score}/${attempt.total} | ${percentage}%</strong>
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">Sem histórico de treino por enquanto.</p>`;

  dom.heatmap.innerHTML = Array.from({ length: 28 }, (_, index) => {
    const date = getDateFromOffset(index - 27);
    const minutes = state.studyLog[toDateKey(date)] ?? 0;
    const alpha = minutes ? Math.min(0.92, 0.12 + minutes / 120) : 0.06;

    return `
      <span
        class="heatmap-cell"
        style="--heat-alpha:${alpha};"
        title="${formatShortDate(date)} | ${minutes} min"
      ></span>
    `;
  }).join("");

  dom.heatmapSummary.textContent = `${activeDays} dias com atividade nas últimas 4 semanas`;

  dom.activityFeed.innerHTML = state.activity.length
    ? state.activity
        .slice(0, 5)
        .map(
          (item) => `
            <li>
              <strong>${escapeHTML(item.message)}</strong>
              <small>${formatRelativeTime(item.timestamp)}</small>
            </li>
          `
        )
        .join("")
    : `<li><strong>Sem atividade recente.</strong><small>Use o dashboard para gerar histórico.</small></li>`;
};

export const renderDashboard = () => {
  renderStrategy();
  renderHighlights();
  renderGuidedStudy();
  renderExamLibraryDownloads();
  renderBasicMath();
  renderUerjDiscursiva();
  renderStudyToday();
  renderMeuPlano();
  renderOverview();
  renderPomodoro();
  renderTasks();
  renderPlanner();
  renderMock();
  renderQuestionBank();
  renderRedacao();
  renderWeakPoints();
  renderAnalytics();
};
