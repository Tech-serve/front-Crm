import type { InterviewStatus } from "src/types/domain";

export type StatusOption = {
  value: InterviewStatus;
  label: string;
  dot: string; // цвет точки
  bg: string;  // фон "пилюли"
  fg: string;  // текст "пилюли"
};

export const HR_STATUS_OPTIONS: StatusOption[] = [
  { value: "not_held", label: "В процессе", dot: "#3a86ff", bg: "rgba(58,134,255,0.12)", fg: "#3a86ff" },
  { value: "reserve",  label: "Резерв",     dot: "#f4a261", bg: "rgba(244,162,97,0.14)",  fg: "#f4a261" },
  { value: "success",  label: "Принято",    dot: "#2ecc71", bg: "rgba(46,204,113,0.14)",  fg: "#2ecc71" },
  { value: "declined", label: "Отказано",   dot: "#ff6b6b", bg: "rgba(255,107,107,0.14)", fg: "#ff6b6b" },
  { value: "canceled", label: "Отменено",   dot: "#95a5a6", bg: "rgba(149,165,166,0.18)", fg: "#95a5a6" },
];