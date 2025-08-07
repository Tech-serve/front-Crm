import type { InterviewStatus } from "src/types/domain";

export type StatusOption = {
  value: InterviewStatus;
  label: string;
  dot: string;
  bg: string;
  fg: string;
};