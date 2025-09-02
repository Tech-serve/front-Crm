import type { Role } from "../types/domain";

export type MenuItem = { label: string; path: string };

export const menuByRole: Record<Role, MenuItem[]> = {
  hr: [
    { label: "Dashboard", path: "/" },
    { label: "Собеседование",  path: "/hr/interviews" },
  ],
  buyer: [
    { label: "Dashboard",       path: "/" },
    { label: "Генераторы ссылок", path: "/buyer/generators" },
    { label: "Обучалки",          path: "/buyer/training" },
  ],
  head: [
    { label: "Dashboard", path: "/" },
    { label: "Собеседование",  path: "/hr/interviews" },
    { label: "Генераторы ссылок", path: "/buyer/generators" },
    { label: "Обучалки",          path: "/buyer/training" },
    { label: "Администрирование", path: "/admin" },
  ],
};