import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/auth-context";
import { ErrorBoundary } from "./ErrorBoundary";

/** Proveedores globales de la app: router (Fase 07), sesión y errores. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
