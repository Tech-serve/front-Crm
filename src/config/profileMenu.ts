export type ProfileMenuItem =
  | { type: "link"; id: "profile"; label: string; to: string }
  | { type: "action"; id: "logout"; label: string };

export const PROFILE_MENU: ProfileMenuItem[] = [
  { type: "link",   id: "profile", label: "Профиль", to: "/profile" },
  { type: "action", id: "logout",  label: "Выйти" },
];