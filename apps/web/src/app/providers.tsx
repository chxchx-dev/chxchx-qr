import type { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

/** Captura errores inesperados del generador en un estado recuperable. */
export function Providers({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
