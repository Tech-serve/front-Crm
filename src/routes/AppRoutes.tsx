// src/routes/AppRoutes.tsx
import { Navigate, Route, Routes } from "react-router-dom";

import PrivateLayout from "../layouts/PrivateLayout";
import PublicLayout  from "../layouts/PublicLayout";

import LoginPage        from "src/common/LoginPage";
import CandidatesPage   from "src/pages/CandidatesPage";
import EmployeesPage    from "src/pages/EmployeesPage";
import Dashboard        from "src/pages/Dashboard";
import ChecklistPage    from "src/pages/ChecklistPage";
import CalendarPage     from "src/pages/Calendar";
import EmployeesDashboard from "src/pages/EmployeesDashboard"; // ← новый дашборд сотрудников

import { RequireAuth, RequireRoles } from "src/config/guards";

export function AppRoutes() {
  return (
    <Routes>
      {/* Публичная зона */}
      <Route
        path="/login"
        element={
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        }
      />

      {/* Домашняя страница (доступна всем авторизованным) */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <PrivateLayout>
              <Dashboard />
            </PrivateLayout>
          </RequireAuth>
        }
      />

      {/* Календарь — HR/Head */}
      <Route
        path="/calendar"
        element={
          <RequireRoles roles={["hr", "head"]}>
            <PrivateLayout>
              <CalendarPage />
            </PrivateLayout>
          </RequireRoles>
        }
      />
      {/* Алиас на старый/HR-префиксный путь */}
      <Route path="/hr/calendar" element={<Navigate to="/calendar" replace />} />

      {/* Дашборд сотрудников — HR/Head */}
      <Route
        path="/hr/employees-dashboard"
        element={
          <RequireRoles roles={["hr", "head"]}>
            <PrivateLayout>
              <EmployeesDashboard />
            </PrivateLayout>
          </RequireRoles>
        }
      />

      {/* Кандидаты — HR/Head */}
      <Route
        path="/hr/candidates"
        element={
          <RequireRoles roles={["hr", "head"]}>
            <PrivateLayout>
              <CandidatesPage />
            </PrivateLayout>
          </RequireRoles>
        }
      />

      {/* Сотрудники — HR/Head */}
      <Route
        path="/hr/employeesPage"
        element={
          <RequireRoles roles={["hr", "head"]}>
            <PrivateLayout>
              <EmployeesPage />
            </PrivateLayout>
          </RequireRoles>
        }
      />

      {/* Чеклист — HR/Head */}
      <Route
        path="/hr/checklist"
        element={
          <RequireRoles roles={["hr", "head"]}>
            <PrivateLayout>
              <ChecklistPage />
            </PrivateLayout>
          </RequireRoles>
        }
      />

      {/* Совместимость/редиректы */}
      <Route path="/candidates" element={<Navigate to="/hr/checklist" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}