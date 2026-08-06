import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Error no controlado en la interfaz:", error, info);
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-center text-text">
          <h1 className="text-xl font-bold">Algo salió mal</h1>
          <p className="text-sm text-muted">Recarga la página para continuar.</p>
        </main>
      );
    }
    return this.props.children;
  }
}
