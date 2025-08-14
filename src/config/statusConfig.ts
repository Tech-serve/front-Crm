import type { InterviewStatus } from "src/types/domain";

export type StatusOption = {
  value: InterviewStatus;
  label: string;
  dot: string;
  bg: string;
  fg: string;
};

export const HR_STATUS_OPTIONS: StatusOption[] = [
  { value: "not_held", label: "В процессе",          dot: "#3a86ff", bg: "#fff", fg: "#3a86ff" },
  { value: "reserve",  label: "Полиграф",            dot: "#f4a261", bg: "#fff", fg: "#f4a261" },
  { value: "success",  label: "Принято",             dot: "#2ecc71", bg: "#fff", fg: "#2ecc71" },
  { value: "declined", label: "Отказано",            dot: "#ff6b6b", bg: "#fff", fg: "#ff6b6b" },
  { value: "canceled", label: "Отказался кандидат",  dot: "#95a5a6", bg: "#fff", fg: "#95a5a6" },
];