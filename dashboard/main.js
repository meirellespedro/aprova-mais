import { dom } from "./dom.js";
import { bindEvents, initOnboarding, primeInterface, resetSessionForm, syncPomodoroFromClock } from "./interactions.js";
import { bindRedacaoAI } from "./redacao-ai.js";
import { state } from "./store.js";
import { renderDashboard, updateMockTimer } from "./renderers.js";

document.documentElement.classList.add("js");

let pomodoroTickerId = null;

const stopPomodoroTicker = () => {
  if (pomodoroTickerId === null) {
    return;
  }

  window.clearInterval(pomodoroTickerId);
  pomodoroTickerId = null;
};

const syncPomodoroTicker = () => {
  if (!state.pomodoro.isRunning) {
    stopPomodoroTicker();
    return;
  }

  if (pomodoroTickerId !== null) {
    return;
  }

  pomodoroTickerId = window.setInterval(() => {
    syncPomodoroFromClock();

    if (!state.pomodoro.isRunning) {
      stopPomodoroTicker();
    }
  }, 1000);
};

let mockTickerId = null;

const stopMockTicker = () => {
  if (mockTickerId === null) {
    return;
  }
  window.clearInterval(mockTickerId);
  mockTickerId = null;
};

const syncMockTicker = () => {
  const active = Boolean(state.mock.startedAt) && !state.mock.submitted;

  if (!active) {
    stopMockTicker();
    updateMockTimer();
    return;
  }

  if (mockTickerId !== null) {
    return;
  }

  mockTickerId = window.setInterval(updateMockTimer, 1000);
};

primeInterface();
bindEvents();
bindRedacaoAI();
resetSessionForm();
renderDashboard();
syncPomodoroTicker();
syncMockTicker();
initOnboarding();

document.addEventListener("aprova:pomodoro-state-change", syncPomodoroTicker);
document.addEventListener("aprova:mock-timer-change", syncMockTicker);

if (dom.taskForm) {
  dom.taskForm.elements.estimate.value = dom.taskForm.elements.estimate.value || "30";
}
