import {
  Bell,
  ChevronDown,
  Menu,
  School,
  Search,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navigationItems } from "./navigation";

function NavigationLink({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path === "/app"}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition duration-200",
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
            : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
        ].join(" ")
      }
    >
      <Icon size={19} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function getCurrentPage(pathname) {
  return (
    navigationItems.find((item) =>
      item.path === "/app" ? pathname === "/app" : pathname.startsWith(item.path),
    )?.label || "SchoolOS"
  );
}

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm",
          compact ? "h-10 w-10" : "h-11 w-11",
        ].join(" ")}
      >
        <School size={compact ? 22 : 24} strokeWidth={2.5} />
      </div>

      <div>
        <p
          className={[
            "font-black text-slate-950",
            compact ? "text-base" : "text-lg",
          ].join(" ")}
        >
          SchoolOS
        </p>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          Enterprise
        </p>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const visibleNavigation = useMemo(() => navigationItems, []);
  const currentPage = getCurrentPage(location.pathname);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-24 items-center border-b border-slate-200 px-6">
          <Brand />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {visibleNavigation.map((item) => (
            <NavigationLink key={item.path} item={item} />
          ))}
        </nav>

        <div className="border-t border-slate-200 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Tavaro Group LLC
          </p>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
              <Brand compact />

              <button
                type="button"
                aria-label="Close navigation"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {visibleNavigation.map((item) => (
                <NavigationLink
                  key={item.path}
                  item={item}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </nav>

            <div className="border-t border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Tavaro Group LLC
              </p>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={21} />
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                  {currentPage}
                </p>

                <p className="truncate text-xs font-semibold text-slate-500">
                  Pointer Hill Academy Â· 2026 Academic Year
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Search"
                className="hidden min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:inline-flex"
              >
                <Search size={19} />
              </button>

              <button
                type="button"
                aria-label="Notifications"
                className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Bell size={19} />

                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              <button
                type="button"
                className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50 sm:px-2"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                  SA
                </span>

                <span className="hidden text-left md:block">
                  <span className="block text-sm font-black text-slate-950">
                    School Admin
                  </span>

                  <span className="block text-xs font-semibold text-slate-500">
                    Administrator
                  </span>
                </span>

                <ChevronDown
                  size={16}
                  className="hidden text-slate-500 md:block"
                />
              </button>
            </div>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}