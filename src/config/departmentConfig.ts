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
  _id?: string;
  scheduledAt: string;
  durationMinutes: number;
  participants: string[];
  status: InterviewStatus;
  source: "jira" | "crm";
  meetLink?: string;
  notes?: string;
}

export type DepartmentValue =
  | "Gambling"
  | "Sweeps"
  | "Search"
  | "Tech"
  | "Admin";

export type PositionValue =
  | "Head"
  | "TeamLead"
  | "Buyer"
  | "Designer"
  | "Accountant"
  | "Administrator";

export interface Candidate {
  _id: string;
  fullName: string;
  email: string;
  notes?: string;
  status?: InterviewStatus;
  meetLink?: string;
  department?: DepartmentValue;
  position?: PositionValue;
  interviews?: Interview[];

  polygraphAt?: string; 
  acceptedAt?: string;  
  declinedAt?: string;  
  canceledAt?: string; 
  polygraphAddress?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const DEPARTMENTS = [
  { value: "Gambling",   label: "Gambling",   bg: "#E0F7FA", fg: "#006064", dot: "#4DD0E1" },
  { value: "Sweeps",     label: "Sweeps",     bg: "#FFF3E0", fg: "#E65100", dot: "#FFB74D" },
  { value: "Search",     label: "Search",     bg: "#F1F8E9", fg: "#33691E", dot: "#AED581" },
  { value: "Tech", label: "Tech", bg: "#EDE7F6", fg: "#311B92", dot: "#B39DDB" },
  { value: "Admin", label: "Admin", bg: "#FCE4EC", fg: "#880E4F", dot: "#F48FB1" },
] as const;