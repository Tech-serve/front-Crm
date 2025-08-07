import { Navigate, Route, Routes } from "react-router-dom";

import PrivateLayout from "../layouts/PrivateLayout";
import PublicLayout  from "../layouts/PublicLayout";

import LoginPage      from "src/common/LoginPage";
import Dashboard      from "src/common/Dashboard";
import GeneratorsPage from "src/common/GeneratorsPage";
import CandidatesPage from "src/pages/CandidatesPage";

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
        path="/buyer/generators"
        element={
          <RequireRoles roles={["buyer", "head"]}>
            <PrivateLayout>
              <GeneratorsPage />
            </PrivateLayout>
          </RequireRoles>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}