import { afterEach, describe, expect, it, vi } from "vitest";
import {
  escapeHTML,
  toDateKey,
  getDateFromOffset,
  timeToMinutes,
  formatTime,
  formatMinutes,
  formatRelativeTime,
  getDurationMinutes,
  getPlannerDayIndex,
} from "../dashboard/utils.js";

describe("escapeHTML", () => {
  it("neutraliza os caracteres perigosos para injeção em HTML", () => {
    expect(escapeHTML('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
  });

  it("escapa o & antes dos demais para não gerar dupla codificação", () => {
    expect(escapeHTML("Tom & Jerry")).toBe("Tom &amp; Jerry");
    expect(escapeHTML("a<b")).toBe("a&lt;b");
  });

  it("converte valores não-string sem quebrar", () => {
    expect(escapeHTML(42)).toBe("42");
  });
});

describe("timeToMinutes", () => {
  it("converte HH:MM em minutos totais", () => {
    expect(timeToMinutes("08:30")).toBe(510);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("trata entrada incompleta sem retornar NaN", () => {
    expect(timeToMinutes("2")).toBe(120);
    expect(timeToMinutes("")).toBe(0);
  });
});

describe("formatTime", () => {
  it("formata segundos como MM:SS com zero à esquerda", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(3599)).toBe("59:59");
  });

  it("faz clamp de valores negativos para zero", () => {
    expect(formatTime(-30)).toBe("00:00");
  });
});

describe("formatMinutes", () => {
  it("usa minutos quando abaixo de uma hora", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(0)).toBe("0 min");
  });

  it("omite os minutos quando o total é exato em horas", () => {
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(120)).toBe("2h");
  });

  it("compõe horas e minutos com padding", () => {
    expect(formatMinutes(90)).toBe("1h30");
    expect(formatMinutes(125)).toBe("2h05");
  });
});

describe("getDurationMinutes", () => {
  it("calcula a diferença entre fim e início", () => {
    expect(getDurationMinutes("08:00", "10:00")).toBe(120);
    expect(getDurationMinutes("09:15", "09:45")).toBe(30);
  });

  it("faz clamp para zero quando o fim é anterior ao início", () => {
    expect(getDurationMinutes("10:00", "08:00")).toBe(0);
  });
});

describe("getPlannerDayIndex", () => {
  it("mapeia segunda como índice 0 e domingo como 6", () => {
    expect(getPlannerDayIndex(new Date(2024, 0, 1))).toBe(0); // segunda
    expect(getPlannerDayIndex(new Date(2024, 0, 3))).toBe(2); // quarta
    expect(getPlannerDayIndex(new Date(2024, 0, 7))).toBe(6); // domingo
  });
});

describe("toDateKey", () => {
  it("gera chave YYYY-MM-DD com padding", () => {
    expect(toDateKey(new Date(2024, 0, 5))).toBe("2024-01-05");
    expect(toDateKey(new Date(2024, 11, 31))).toBe("2024-12-31");
  });
});

describe("getDateFromOffset", () => {
  afterEach(() => vi.useRealTimers());

  it("zera o horário e desloca os dias a partir de hoje", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15, 13, 45, 30));

    expect(toDateKey(getDateFromOffset(0))).toBe("2024-06-15");
    expect(toDateKey(getDateFromOffset(-1))).toBe("2024-06-14");
    expect(toDateKey(getDateFromOffset(1))).toBe("2024-06-16");

    const today = getDateFromOffset(0);
    expect([today.getHours(), today.getMinutes(), today.getSeconds()]).toEqual([0, 0, 0]);
  });
});

describe("formatRelativeTime", () => {
  afterEach(() => vi.useRealTimers());

  const freezeAt = (date) => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  };

  it("trata a última hora como 'agora há pouco'", () => {
    freezeAt(new Date(2024, 0, 1, 12, 0, 0));
    expect(formatRelativeTime(new Date(2024, 0, 1, 11, 30, 0))).toBe("Agora há pouco");
  });

  it("mostra horas dentro do mesmo dia", () => {
    freezeAt(new Date(2024, 0, 1, 12, 0, 0));
    expect(formatRelativeTime(new Date(2024, 0, 1, 9, 0, 0))).toBe("Há 3h");
  });

  it("resume um dia atrás como 'ontem'", () => {
    freezeAt(new Date(2024, 0, 2, 12, 0, 0));
    expect(formatRelativeTime(new Date(2024, 0, 1, 11, 0, 0))).toBe("Ontem");
  });

  it("agrega vários dias", () => {
    freezeAt(new Date(2024, 0, 5, 12, 0, 0));
    expect(formatRelativeTime(new Date(2024, 0, 1, 12, 0, 0))).toBe("Há 4 dias");
  });
});
