import { Navigate, Route, Routes } from "react-router-dom";

import PrivateLayout from "../layouts/PrivateLayout";
import PublicLayout  from "../layouts/PublicLayout";

import LoginPage      from "src/common/LoginPage";
import CandidatesPage from "src/pages/CandidatesPage";
import EmployeesPage  from "src/pages/EmployeesPage";
import Dashboard      from "src/pages/Dashboard";
import ChecklistPage  from "src/pages/ChecklistPage";

import { RequireAuth, RequireRoles } from "src/config/guards";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        }
      />

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

      <Route path="/candidates" element={<Navigate to="/hr/checklist" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}