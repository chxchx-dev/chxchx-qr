import { webConfig } from "@acore/config";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { ui } from "../shared/lib/messages";
import { Providers } from "./providers";
import { Routes } from "./routes";

export function App() {
  return (
    <Providers>
      <div className="flex min-h-dvh flex-col bg-background text-text">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <Routes />
        </main>
        <footer className="border-t border-surface">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted">
            <p>{ui.footer.note}</p>
            <p>{ui.footer.privacy}</p>
          </div>
        </footer>
      </div>
    </Providers>
  );
}

/** Navegación: generador público + dashboard/sesión (Fase 07). */
function SiteHeader() {
  const { user, logout } = useAuth();
  const dynamicEnabled = webConfig(import.meta.env).VITE_DYNAMIC_QR_ENABLED;

  return (
    <header className="border-b border-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link
          to="/"
          className="text-sm font-semibold uppercase tracking-widest text-primary hover:text-primary/80"
        >
          {ui.appName}
        </Link>
        <nav className="flex items-center gap-4" aria-label="Navegación principal">
          <Link to="/" className="text-sm text-muted transition-colors hover:text-text">
            {ui.auth.generatorNav}
          </Link>
          {dynamicEnabled && user !== null && (
            <Link to="/dashboard" className="text-sm text-muted transition-colors hover:text-text">
              {ui.auth.dashboardNav}
            </Link>
          )}
          {user === null ? (
            <>
              <Link
                to="/login"
                className="rounded-md border border-surface bg-surface px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-primary/40 hover:text-primary"
              >
                {ui.auth.loginNav}
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                {ui.auth.registerNav}
              </Link>
            </>
          ) : (
            <>
              <span className="max-w-40 truncate text-sm text-muted" title={user.email}>
                {user.displayName ?? user.email}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-md border border-surface bg-surface px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-danger/40 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {ui.auth.logout}
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
