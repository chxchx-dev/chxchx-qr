/**
 * Rutas de la app (Fase 07, react-router): el generador es público; el
 * dashboard y el detalle/creación de QR dinámicos requieren sesión.
 */
import { Route, Routes as RouterRoutes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { RequireAuth } from "../features/auth/RequireAuth";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { QrDetailPage } from "../features/dashboard/QrDetailPage";
import { GeneratorScreen } from "../features/generator/components/GeneratorScreen";
import { ui } from "../shared/lib/messages";

function HomeScreen() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{ui.header.tagline}</h1>
      <p className="mt-3 max-w-2xl text-muted">{ui.header.description}</p>
      <div className="mt-8">
        <GeneratorScreen />
      </div>
      <section aria-labelledby="how-it-works-title" className="mt-14">
        <h2 id="how-it-works-title" className="text-lg font-semibold text-text">
          {ui.howItWorks.title}
        </h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-muted">
          {ui.howItWorks.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </>
  );
}

export function Routes() {
  return (
    <RouterRoutes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/qr/new"
        element={
          <RequireAuth>
            <QrDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/qr/:id"
        element={
          <RequireAuth>
            <QrDetailPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-sm text-muted">{ui.header.description}</p>
      <a href="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        {ui.dashboard.home}
      </a>
    </div>
  );
}
