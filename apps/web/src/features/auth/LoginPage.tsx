/**
 * Página de login (Fase 07): formulario con validación local mínima y errores
 * del servidor (401 genérico anti-enumeración). Al entrar navega al dashboard.
 */
import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { PasswordField, TextField } from "../../shared/components/Field";
import { ApiError } from "../../shared/lib/api";
import { ui } from "../../shared/lib/messages";
import { useAuth } from "./auth-context";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (!loading && user !== null) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError ? (caught.detail ?? ui.auth.loginFailed) : ui.auth.genericError,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight">{ui.auth.loginTitle}</h1>
      <p className="mt-1 text-sm text-muted">{ui.auth.loginDescription}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <TextField
          label={ui.auth.emailLabel}
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
          placeholder="nombre@dominio.com"
        />
        <PasswordField
          label={ui.auth.passwordLabel}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        {error !== undefined && (
          <p
            role="alert"
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? ui.auth.submitting : ui.auth.loginCta}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        {ui.auth.noAccount}{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          {ui.auth.registerLink}
        </Link>
      </p>
    </div>
  );
}
