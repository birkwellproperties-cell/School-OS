import {
  ArrowLeft,
  Home,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuthorization } from "../../platform/authorization";

export default function AccessDeniedPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    roles,
  } = useAuthorization();

  const attemptedPath =
    location.state?.attemptedPath || null;

  const requiredPermission =
    location.state?.requiredPermission || null;

  const roleNames = (roles || [])
    .map((role) => role.name)
    .filter(Boolean);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-amber-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert size={32} />
        </span>

        <p className="mt-7 text-sm font-black uppercase tracking-[0.18em] text-amber-600">
          Access denied
        </p>

        <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
          You are not authorized to open this module.
        </h1>

        <p className="mt-4 text-base font-medium leading-8 text-slate-500">
          Your SchoolOS account is authenticated, but your current
          roles and effective permissions do not allow access to the
          requested workspace.
        </p>

        <div className="mt-7 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          {attemptedPath && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Requested route
              </p>

              <p className="mt-1 break-all text-sm font-black text-slate-800">
                {attemptedPath}
              </p>
            </div>
          )}

          {requiredPermission && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Required permission
              </p>

              <div className="mt-2 flex items-center gap-2">
                <LockKeyhole
                  size={16}
                  className="text-amber-600"
                />

                <code className="rounded-lg bg-white px-2 py-1 text-sm font-black text-slate-700">
                  {requiredPermission}
                </code>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Current roles
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              {roleNames.length > 0
                ? roleNames.join(", ")
                : "No active roles resolved"}
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm font-semibold leading-6 text-slate-500">
          Contact your school or organization administrator if you
          believe access should be granted.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Go back
          </button>

          <Link
            to="/app"
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700"
          >
            <Home size={17} />
            Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
