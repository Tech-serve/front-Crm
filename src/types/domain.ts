// src/types/domain.ts
export type Role = "hr" | "buyer" | "head";

export interface User {
  email: string;
  role: Role;
  token?: string;
}

export type InterviewStatus = "not_held" | "success" | "declined" | "reserve" | "canceled";

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
  | "Vitehi"
  | "Tech"
  | "TechaDeals"
  | "Admin";

export type PositionValue =
  | "Head"
  | "TeamLead"
  | "Buyer"
  | "Designer"
  | "Accountant"
  | "Administrator"
  | "CTO"
  | "Translator"
  | "Frontend"
  | "FarmerTech";

export interface Candidate {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  notes?: string;
  status?: InterviewStatus;
  meetLink?: string;
  department?: DepartmentValue;
  position?: PositionValue | null;
  interviews?: Interview[];
  polygraphAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  canceledAt?: string | null;
  polygraphAddress?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  _id: string;
  candidate?: string;
  fullName: string;
  email: string;
  phone?: string;
  birthdayAt?: string | null;
  department: DepartmentValue;
  position: PositionValue | null;
  notes?: string;
  hiredAt: string;
  terminatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}