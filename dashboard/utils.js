const pad = (value) => String(value).padStart(2, "0");

export const escapeHTML = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getDateFromOffset = (offset) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

export const timeToMinutes = (value) => {
  const [hours = 0, minutes = 0] = String(value).split(":").map(Number);
  return hours * 60 + minutes;
};

export const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${pad(minutes)}:${pad(remainingSeconds)}`;
};

export const formatMinutes = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h${pad(remainingMinutes)}` : `${hours}h`;
};

export const formatRelativeTime = (timestamp) => {
  const difference = Date.now() - new Date(timestamp).getTime();
  const hours = Math.round(difference / 3_600_000);

  if (hours <= 1) {
    return "Agora há pouco";
  }

  if (hours < 24) {
    return `Há ${hours}h`;
  }

  const days = Math.round(hours / 24);
  return days === 1 ? "Ontem" : `Há ${days} dias`;
};

export const formatShortDate = (value) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(new Date(value))
    .replace(".", "");

export const formatMonthDay = (date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "");

export const formatWeekday = (date) =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
  })
    .format(date)
    .replace(".", "")
    .replace("-feira", "");

export const getDurationMinutes = (start, end) => Math.max(0, timeToMinutes(end) - timeToMinutes(start));

export const getPlannerDayIndex = (date = new Date()) => {
  const weekday = date.getDay();
  return weekday === 0 ? 6 : weekday - 1;
};
