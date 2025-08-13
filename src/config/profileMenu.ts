
export type ProfileMenuItem =
  | { id: "profile"; type: "link"; label: string; to: string }
  | { id: "logout"; type: "action"; label: string };

export const PROFILE_MENU: readonly ProfileMenuItem[] = [
  { id: "profile", type: "link", label: "Профиль", to: "/profile" },
  { id: "logout", type: "action", label: "Выйти" },
] as const;

export default PROFILE_MENU;