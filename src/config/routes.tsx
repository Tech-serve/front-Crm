import type { Role } from "../types/domain";
import type { JSX } from "react";
import InterviewsPage from "src/pages/CandidatesPage";
import GeneratorsPage from "src/common/GeneratorsPage";
import Dashboard from "src/pages/Dashboard";

export type AppRoute = {
  path: string;
  element: JSX.Element;
  label?: string;       
  roles?: Role[]; 
  inMenu?: boolean;     
};

export const routes: AppRoute[] = [
  { path: "/", element: <Dashboard />, label: "Dashboard", inMenu: true, roles: ["hr", "buyer", "head"] },
  { path: "/hr/interviews", element: <InterviewsPage />, label: "Интервью", inMenu: true, roles: ["hr", "head"] },
  { path: "/buyer/generators", element: <GeneratorsPage />, label: "Генераторы ссылок", inMenu: true, roles: ["buyer", "head"] },
];

export function menuForRole(role: Role) {
  return routes.filter(r => r.inMenu && (!r.roles || r.roles.includes(role)));
}