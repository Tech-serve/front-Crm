// src/config/positionConfig.ts
export const POSITION_OPTIONS: Record<
  string,
  readonly { value: string; label: string }[]
> = {
  Gambling: [
    { value: "Head",        label: "Head" },
    { value: "TeamLead",    label: "Team Lead" },
    { value: "Buyer",       label: "Buyer" },
    { value: "Designer",    label: "Designer" },
    { value: "FarmerTech",  label: "Farmer's Tech" },
  ],
  Sweeps: [
    { value: "Head",     label: "Head" },
    { value: "TeamLead", label: "Team Lead" },
    { value: "Buyer",    label: "Buyer" },
    { value: "Designer", label: "Designer" },
  ],
  Search: [
    { value: "Head",     label: "Head" },
    { value: "TeamLead", label: "Team Lead" },
    { value: "Buyer",    label: "Buyer" },
    { value: "Designer", label: "Designer" },
  ],
  Admin: [
    { value: "Accountant",   label: "Accountant" },
    { value: "Administrator",label: "Administrator" },
  ],
  Vitehi: [],
  Tech: [
    { value: "CTO",        label: "CTO" },
    { value: "Translator", label: "Translator" },
    { value: "Frontend",   label: "Frontend" },
  ],
  TechaDeals: [],
} as const;