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
  Admin: [
    { value: "Accountant", label: "Accountant" },
    { value: "Administrator", label: "Administrator" },
  ],
  Vitehi: [],
  Tech: [
    { value: "CTO", label: "CTO" },           
    { value: "Translator", label: "Translator" }, 
    { value: "Frontend", label: "Frontend" },
    { value: "FarmerTech", label: "Farmer Tech" },

  ],
} as const;