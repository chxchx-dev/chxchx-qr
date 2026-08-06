/**
 * Guard de rutas protegidas (Fase 07): mientras se resuelve el perfil inicial
 * muestra un estado de carga; sin sesión redirige a /login.
 */
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ui } from "../../shared/lib/messages";
import { useAuth } from "./auth-context";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p role="status" className="text-sm text-muted">
        {ui.auth.loading}
      </p>
    );
  }
  if (user === null) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
