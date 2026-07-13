import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../platform/auth";
import { BrandLogo } from "../../shared/branding";

export default function ResetPasswordPage() {
  const {
    authError,
    clearAuthError,
    updatePassword,
  } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmation: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    clearAuthError();

    return () => {
      clearAuthError();
    };
  }, [clearAuthError]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setLocalError("");

    if (authError) {
      clearAuthError();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    if (form.password !== form.confirmation) {
      setLocalError("The password confirmation does not match.");
      return;
    }

    if (!/[a-z]/.test(form.password)) {
      setLocalError(
        "The password must include a lowercase letter.",
      );
      return;
    }

    if (!/[A-Z]/.test(form.password)) {
      setLocalError(
        "The password must include an uppercase letter.",
      );
      return;
    }

    if (!/[0-9]/.test(form.password)) {
      setLocalError(
        "The password must include a number.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const result = await updatePassword(form.password);

      if (result.success) {
        setCompleted(true);

        window.setTimeout(() => {
          navigate("/app", {
            replace: true,
          });
        }, 1600);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const displayedError = localError || authError;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <Link
          to="/"
          aria-label="SchoolOS home"
          className="block w-fit rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          <BrandLogo
            size="md"
            showAttribution
            attribution="Enterprise"
            priority
          />
        </Link>

        {completed ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-10 text-center"
          >
            <CheckCircle2
              size={54}
              className="mx-auto text-emerald-600"
            />

            <h1 className="mt-6 text-3xl font-black text-slate-950">
              Password updated
            </h1>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
              Your new password is active. SchoolOS is opening your
              workspace.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-9 text-sm font-black uppercase tracking-[0.18em] text-indigo-600">
              Secure recovery
            </p>

            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Create a new password
            </h1>

            <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
              Use at least eight characters, including uppercase,
              lowercase, and a number.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleSubmit}
            >
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-black text-slate-700"
                >
                  New password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="new-password"
                    name="password"
                    type={showPasswords ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={updateField}
                    aria-invalid={Boolean(displayedError)}
                    aria-describedby={
                      displayedError
                        ? "password-reset-error"
                        : undefined
                    }
                    className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-14 text-base font-semibold text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPasswords
                        ? "Hide passwords"
                        : "Show passwords"
                    }
                    onClick={() =>
                      setShowPasswords((current) => !current)
                    }
                    className="absolute right-2 top-1/2 flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    {showPasswords ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-black text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirm-password"
                    name="confirmation"
                    type={showPasswords ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.confirmation}
                    onChange={updateField}
                    aria-invalid={Boolean(displayedError)}
                    aria-describedby={
                      displayedError
                        ? "password-reset-error"
                        : undefined
                    }
                    className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base font-semibold text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {displayedError && (
                <div
                  id="password-reset-error"
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
                >
                  <p className="text-sm font-bold leading-6 text-red-700">
                    {displayedError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 text-base font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Updating password..."
                  : "Update password"}
              </button>

              <Link
                to="/login"
                className="flex min-h-12 items-center justify-center rounded-xl text-sm font-black text-slate-600 transition hover:bg-slate-50 hover:text-indigo-700"
              >
                Return to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </main>
  );
}