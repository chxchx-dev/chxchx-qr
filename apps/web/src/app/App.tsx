import { ui } from "../shared/lib/messages";
import { Providers } from "./providers";
import { Routes } from "./routes";

export function App() {
  return (
    <Providers>
      <div className="flex min-h-dvh flex-col bg-background text-text">
        <header className="border-b border-surface">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {ui.appName}
            </p>
            <span className="text-xs text-muted" lang="es">
              {ui.langLabel}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{ui.header.tagline}</h1>
          <p className="mt-3 max-w-2xl text-muted">{ui.header.description}</p>
          <div className="mt-8">
            <Routes />
          </div>
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
