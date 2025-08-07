import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../store/store";
import { authMe } from "src/features/auth/authSlice";
import type { Role } from "../types/domain";
import type { JSX } from "react";

function CenterSpinner() {
  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <CircularProgress />
    </Box>
  );
}

export function RequireAuth({ children }: { children: JSX.Element }) {
  const dispatch = useAppDispatch();
  const { user, inited } = useAppSelector(s => s.auth);

  useEffect(() => {
    if (!inited) dispatch(authMe());
  }, [inited, dispatch]);

  if (!inited) return <CenterSpinner />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

export function RequireRoles({ roles, children }: { roles?: Role[]; children: JSX.Element }) {
  const dispatch = useAppDispatch();
  const { user, inited } = useAppSelector(s => s.auth);

  useEffect(() => {
    if (!inited) dispatch(authMe());
  }, [inited, dispatch]);

  if (!inited) return <CenterSpinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}