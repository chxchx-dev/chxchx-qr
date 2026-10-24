import { webConfig } from "@acore/config";
import { GeneratorScreen } from "../features/generator/components/GeneratorScreen";
import { ui } from "../shared/lib/messages";
import { Providers } from "./providers";

export function App() {
  const appName = webConfig(import.meta.env).VITE_APP_NAME;

  return (
    <Providers>
      <div className="min-h-dvh bg-background text-text">
        <header className="border-b border-surface">
          <div className="mx-auto flex w-full max-w-5xl items-center px-4 py-4">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              {appName}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{ui.header.tagline}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{ui.header.description}</p>
          <div className="mt-8">
            <GeneratorScreen />
          </div>
        </main>
        <footer className="border-t border-surface">
          <div className="mx-auto w-full max-w-5xl px-4 py-4 text-xs text-muted">
            {ui.footer.privacy}
          </div>
        </footer>
      </div>
    </Providers>
  );
}
