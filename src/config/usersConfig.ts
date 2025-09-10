import type { Role } from "../types/domain";

export const allowedUsers: Array<{ email: string; role: Role }> = [
  { email: "anna.hr@traffic-jet.com", role: "hr" },
  { email: "buyer@company.com", role: "buyer" },
  { email: "head@company.com", role: "head" },
];