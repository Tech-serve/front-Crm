import { Navigate, Route, Routes } from "react-router-dom";

import PrivateLayout from "../layouts/PrivateLayout";
import PublicLayout  from "../layouts/PublicLayout";

import LoginPage      from "src/common/LoginPage";
import CandidatesPage from "src/pages/CandidatesPage";

import { RequireAuth, RequireRoles } from "src/config/guards";
import Dashboard from "src/pages/Dashboard";
import EmployeesPage from "src/pages/EmployeesPage";

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}