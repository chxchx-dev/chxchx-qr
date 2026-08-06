import type { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

/** Proveedores globales de la app (hoy: error boundary; mañana: tema/i18n). */
export function Providers({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
