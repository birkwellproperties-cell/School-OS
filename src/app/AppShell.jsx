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
      end={item.path === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
          isActive
            ? "bg-teal-600 text-white shadow-lg shadow-teal-950/20"
            : "text-slate-300 hover:bg-white/10 hover:text-white",
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
      item.path === "/" ? pathname === "/" : pathname.startsWith(item.path),
    )?.label || "SchoolOS"
  );
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const visibleNavigation = useMemo(() => navigationItems, []);
  const currentPage = getCurrentPage(location.pathname);

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-slate-950 lg:flex">
        <div className="flex h-24 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500 text-slate-950">
            <School size={24} strokeWidth={2.5} />
          </div>

          <div>
            <p className="text-lg font-black text-white">SchoolOS</p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Enterprise
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {visibleNavigation.map((item) => (
            <NavigationLink key={item.path} item={item} />
          ))}
        </nav>

        <div className="border-t border-white/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Tavaro Group LLC
          </p>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative flex h-full w-[86%] max-w-sm flex-col bg-slate-950 shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-slate-950">
                  <School size={22} />
                </div>

                <div>
                  <p className="font-black text-white">SchoolOS</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Enterprise
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close navigation"
                className="rounded-xl p-2 text-slate-300 hover:bg-white/10"
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
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#f5f3ed]/95 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 shadow-sm lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={21} />
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                  {currentPage}
                </p>
                <p className="truncate text-xs font-semibold text-slate-500">
                  Pointer Hill Academy · 2026 Academic Year
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Search"
                className="hidden rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm sm:inline-flex"
              >
                <Search size={19} />
              </button>

              <button
                type="button"
                aria-label="Notifications"
                className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
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

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}