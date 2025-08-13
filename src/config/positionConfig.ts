export const POSITION_OPTIONS: Record<string, { value: string; label: string }[]> = {
  Sweeps: [
    { value: "Head", label: "Head" },
    { value: "TeamLead", label: "Team Lead" },
    { value: "Buyer", label: "Buyer" },
    { value: "Designer", label: "Designer" },
  ],
  Search: [
    { value: "Head", label: "Head" },
    { value: "TeamLead", label: "Team Lead" },
    { value: "Buyer", label: "Buyer" },
    { value: "Designer", label: "Designer" },
  ],
  Gambling: [
    { value: "Head", label: "Head" },
    { value: "TeamLead", label: "Team Lead" },
    { value: "Buyer", label: "Buyer" },
    { value: "Designer", label: "Designer" },
  ],
  AdminStaff: [
    { value: "Accountant", label: "Accountant" },
    { value: "Administrator", label: "Administrator" },
  ],
  Vitehi: [],
  TechaDeals: [
    { value: "CTO", label: "CTO" },             // ← ДОБАВЛЕНО
    { value: "Translator", label: "Translator" }, // ← ДОБАВЛЕНО
    { value: "Frontend", label: "Frontend" },     // ← ДОБАВЛЕНО
  ],
} as const;