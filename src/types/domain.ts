export type Role = "hr" | "buyer" | "head";

export interface User {
  email: string;
  role: Role;
  token?: string;
}

export type InterviewStatus =
  | "not_held"
  | "success"
  | "declined"
  | "reserve"
  | "canceled";

export interface Interview {
  _id:              string;
  scheduledAt:      string;
  durationMinutes:  number;
  participants:     string[];
  status:           InterviewStatus;
  source:           "jira" | "crm";
  meetLink?:        string;
  notes?:           string;
  createdAt:        string;
  updatedAt:        string;
}

export interface Candidate {
  _id: string;
  fullName: string;
  email: string;
  status?:   InterviewStatus;
  meetLink?: string;
  notes?:    string;
  interviews?: Interview[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}