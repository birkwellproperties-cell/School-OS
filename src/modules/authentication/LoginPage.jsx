import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../platform/auth";
import { BrandLogo } from "../../shared/branding";

export default function LoginPage() {
  const {
    authError,
    clearAuthError,
    signIn,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const destination =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/app";

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

    if (authError) {
      clearAuthError();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      const result = await signIn(form);

      if (result.success) {
        navigate(destination, {
          replace: true,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(79,70,229,0.7),transparent_38%),radial-gradient(circle_at_85%_75%,rgba(6,182,212,0.25),transparent_40%),linear-gradient(145deg,#090f2d_0%,#172554_48%,#1e1b4b_100%)]" />

        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <Link
            to="/"
            aria-label="SchoolOS home"
            className="block w-fit rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <BrandLogo
              variant="light"
              markVariant="primary"
              size="lg"
              showAttribution
              attribution="Enterprise"
              markSurface
              priority
            />
          </Link>

          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
              Unified school operations
            </p>

            <h1 className="mt-6 text-5xl font-black leading-[1.08] text-white xl:text-6xl">
              Run your entire school from one secure platform.
            </h1>

            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-slate-300">
              Admissions, students, academics, human resources,
              finance, procurement, communications, and executive
              reporting in one governed enterprise workspace.
            </p>

            <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <ShieldCheck
                  size={25}
                  aria-hidden="true"
                  className="text-cyan-300"
                />

                <p className="mt-4 font-black text-white">
                  Enterprise Security
                </p>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-400">
                  Tenant isolation, role-based access, permission
                  enforcement, and audited operations.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <Building2
                  size={25}
                  aria-hidden="true"
                  className="text-cyan-300"
                />

                <p className="mt-4 font-black text-white">
                  Multi-School Ready
                </p>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-400">
                  Operate organizations, schools, and campuses from
                  one governed platform.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-500">
            SchoolOS Enterprise · A Tavaro Group LLC platform
          </p>
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center bg-white px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <Link
            to="/"
            aria-label="SchoolOS home"
            className="mb-10 block w-fit rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
          >
            <BrandLogo
              size="md"
              showAttribution
              attribution="Enterprise"
              priority
            />
          </Link>

          <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-600">
            Secure access
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Welcome back
          </h2>

          <p className="mt-3 text-base font-medium leading-7 text-slate-500">
            Sign in with your authorized SchoolOS account.
          </p>

          <form
            className="mt-9 space-y-5"
            onSubmit={handleSubmit}
            aria-busy={submitting}
          >
            <div>
              <label
                htmlFor="email"
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
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={form.email}
                  onChange={updateField}
                  placeholder="admin@school.org"
                  aria-invalid={Boolean(authError)}
                  aria-describedby={
                    authError
                      ? "login-error"
                      : undefined
                  }
                  className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="text-sm font-black text-slate-700"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-black text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={updateField}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(authError)}
                  aria-describedby={
                    authError
                      ? "login-error"
                      : undefined
                  }
                  className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-14 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-2 top-1/2 flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {showPassword ? (
                    <EyeOff
                      size={18}
                      aria-hidden="true"
                    />
                  ) : (
                    <Eye
                      size={18}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>
            </div>

            {authError && (
              <div
                id="login-error"
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
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-base font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Signing in..."
                : "Sign in"}

              {!submitting && (
                <ArrowRight
                  size={19}
                  aria-hidden="true"
                />
              )}
            </button>
          </form>

          <div className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm font-black text-indigo-950">
              Access is restricted
            </p>

            <p className="mt-1 text-sm font-semibold leading-6 text-indigo-700">
              Only approved organization owners and invited school
              personnel can access SchoolOS.
            </p>
          </div>

          <div className="mt-7 space-y-3 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Need SchoolOS for your institution?
            </p>

            <Link
              to="/request-access"
              className="inline-flex min-h-11 items-center justify-center font-black text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Request Platform Access
            </Link>
          </div>

          <Link
            to="/"
            className="mt-7 flex min-h-11 items-center justify-center gap-2 text-sm font-black text-slate-500 transition hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />
            Return to the SchoolOS website
          </Link>
        </div>
      </main>
    </div>
  );
}