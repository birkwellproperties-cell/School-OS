import {
  Clock3,
  LogOut,
  Mail,
  School,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../platform/auth";

export default function AccountPendingPage() {
  const {
    user,
    signOut,
  } = useAuth();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white p-7 shadow-2xl sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <School size={25} strokeWidth={2.5} />
          </span>

          <div>
            <p className="text-xl font-black text-slate-950">
              SchoolOS
            </p>

            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
              Enterprise
            </p>
          </div>
        </div>

        <span className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert size={28} />
        </span>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-amber-600">
          Access pending
        </p>

        <h1 className="mt-3 text-3xl font-black text-slate-950">
          Your account is not assigned to an active workspace.
        </h1>

        <p className="mt-4 text-base font-medium leading-8 text-slate-500">
          Your identity has been authenticated, but SchoolOS could
          not find an active organization membership and authorized
          workspace assignment.
        </p>

        <div className="mt-7 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <Mail
              size={19}
              className="mt-0.5 shrink-0 text-indigo-600"
            />

            <div>
              <p className="text-sm font-black text-slate-800">
                Signed-in account
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-slate-500">
                {user?.email || "Unknown account"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock3
              size={19}
              className="mt-0.5 shrink-0 text-indigo-600"
            />

            <div>
              <p className="text-sm font-black text-slate-800">
                What happens next
              </p>

              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Contact your organization administrator or Tavaro
                support to confirm your invitation, membership,
                role, and school assignment.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/contact"
            className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700"
          >
            Contact support
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>

        <Link
          to="/"
          className="mt-6 flex min-h-11 items-center justify-center text-sm font-black text-slate-500 transition hover:text-indigo-700"
        >
          Return to the SchoolOS website
        </Link>
      </div>
    </main>
  );
}
