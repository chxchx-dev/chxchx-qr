/**
 * Página de registro (Fase 07): crea la cuenta (login implícito, la API fija
 * la cookie) y navega al dashboard. El email duplicado → 409 del servidor.
 */
import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { PasswordField, TextField } from "../../shared/components/Field";
import { ApiError } from "../../shared/lib/api";
import { ui } from "../../shared/lib/messages";
import { useAuth } from "./auth-context";

export function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        ...(displayName.trim() !== "" ? { displayName: displayName.trim() } : {}),
      });
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.detail ?? ui.auth.registerFailed)
          : ui.auth.genericError,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight">{ui.auth.registerTitle}</h1>
      <p className="mt-1 text-sm text-muted">{ui.auth.registerDescription}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <TextField
          label={ui.auth.emailLabel}
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
          placeholder="nombre@dominio.com"
        />
        <TextField
          label={ui.auth.displayNameLabel}
          value={displayName}
          onChange={setDisplayName}
          autoComplete="name"
          placeholder={ui.auth.displayNamePlaceholder}
        />
        <PasswordField
          label={ui.auth.passwordLabel}
          value={password}
          onChange={setPassword}
          help={ui.auth.passwordHelp}
          autoComplete="new-password"
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
          {submitting ? ui.auth.submitting : ui.auth.registerCta}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        {ui.auth.haveAccount}{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          {ui.auth.loginLink}
        </Link>
      </p>
    </div>
  );
}
