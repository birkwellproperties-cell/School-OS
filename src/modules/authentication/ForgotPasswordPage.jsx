import {
  ArrowLeft,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../platform/auth";
import { BrandLogo } from "../../shared/branding";

export default function ForgotPasswordPage() {
  const {
    authError,
    clearAuthError,
    sendPasswordReset,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    clearAuthError();

    return () => {
      clearAuthError();
    };
  }, [clearAuthError]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      const result = await sendPasswordReset(email);

      if (result.success) {
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (authError) {
      clearAuthError();
    }
  }

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

        {submitted ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-10"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2
                size={28}
                aria-hidden="true"
              />
            </span>

            <h1 className="mt-6 text-3xl font-black text-slate-950">
              Check your email
            </h1>

            <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
              If an authorized SchoolOS account exists for{" "}
              <span className="font-black text-slate-700">
                {email}
              </span>
              , a secure recovery link has been sent.
            </p>

            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-sm font-semibold leading-6 text-indigo-700">
                For security, SchoolOS does not confirm whether an
                email address is registered.
              </p>
            </div>

            <Link
              to="/login"
              className="mt-7 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-black text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <ArrowLeft
                size={17}
                aria-hidden="true"
              />
              Return to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-9 text-sm font-black uppercase tracking-[0.18em] text-indigo-600">
              Account recovery
            </p>

            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Reset your password
            </h1>

            <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
              Enter the email associated with your authorized
              SchoolOS account.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleSubmit}
              aria-busy={submitting}
            >
              <div>
                <label
                  htmlFor="recovery-email"
                  className="mb-2 block text-sm font-black text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="recovery-email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="admin@school.org"
                    aria-invalid={Boolean(authError)}
                    aria-describedby={
                      authError
                        ? "password-recovery-error"
                        : undefined
                    }
                    className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {authError && (
                <div
                  id="password-recovery-error"
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
                >
                  <p className="text-sm font-bold leading-6 text-red-700">
                    {authError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 text-base font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Sending recovery email..."
                  : "Send recovery link"}
              </button>

              <Link
                to="/login"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-black text-slate-600 transition hover:bg-slate-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <ArrowLeft
                  size={17}
                  aria-hidden="true"
                />
                Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </main>
  );
}