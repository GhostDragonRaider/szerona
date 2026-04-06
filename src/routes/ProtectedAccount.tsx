/**
 * Csak bejelentkezett felhasználónak engedélyezi a fiók oldalt.
 */
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedAccount({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return null;
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
