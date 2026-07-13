import {
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

import { BrandLogo } from "../../shared/branding";

const publicNavigation = [
  {
    label: "Platform",
    path: "/platform",
  },
  {
    label: "Solutions",
    path: "/solutions",
  },
  {
    label: "Pricing",
    path: "/pricing",
  },
  {
    label: "Security",
    path: "/security",
  },
  {
    label: "Resources",
    path: "/resources",
  },
  {
    label: "Contact",
    path: "/contact",
  },
];

function NavigationItem({
  item,
  darkHeader,
  onNavigate,
}) {
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "rounded-xl px-3 py-2 text-sm font-bold transition",
          darkHeader
            ? isActive
              ? "bg-white/15 text-white"
              : "text-indigo-100 hover:bg-white/10 hover:text-white"
            : isActive
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-700 hover:bg-slate-100 hover:text-indigo-700",
        ].join(" ")
      }
    >
      {item.label}
    </NavLink>
  );
}

function HeaderBrand({
  darkHeader,
  mobile = false,
  onNavigate,
}) {
  return (
    <Link
      to="/"
      aria-label="SchoolOS home"
      onClick={onNavigate}
      className="shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <BrandLogo
        variant={darkHeader ? "light" : "primary"}
        markVariant="primary"
        markSurface={darkHeader}
        size={mobile ? "sm" : "md"}
        showAttribution
        attribution="Enterprise"
        priority
      />
    </Link>
  );
}

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const darkHeader = location.pathname === "/";

  function closeMobileNavigation() {
    setMobileOpen(false);
  }

  return (
    <>
      <header
        className={[
          "inset-x-0 top-0 z-40 transition",
          darkHeader
            ? "absolute"
            : "sticky border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur",
        ].join(" ")}
      >
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <HeaderBrand darkHeader={darkHeader} />

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {publicNavigation.map((item) => (
              <NavigationItem
                key={item.path}
                item={item}
                darkHeader={darkHeader}
              />
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className={[
                "rounded-xl px-4 py-3 text-sm font-black transition",
                darkHeader
                  ? "text-white hover:bg-white/10"
                  : "text-slate-800 hover:bg-slate-100 hover:text-indigo-700",
              ].join(" ")}
            >
              Sign in
            </Link>

            <Link
              to="/request-access"
              className={[
                "flex min-h-12 items-center gap-2 rounded-xl px-5 py-3 text-sm font-black shadow-lg transition hover:-translate-y-0.5",
                darkHeader
                  ? "bg-white text-indigo-700 shadow-indigo-950/20 hover:bg-indigo-50"
                  : "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700",
              ].join(" ")}
            >
              Request Platform Access
              <ArrowRight size={17} />
            </Link>
          </div>

          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className={[
              "flex min-h-11 min-w-11 items-center justify-center rounded-xl border transition lg:hidden",
              darkHeader
                ? "border-white/15 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
            ].join(" ")}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobileNavigation}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <aside
            aria-label="Mobile navigation"
            className="relative ml-auto flex h-full w-[88%] max-w-sm flex-col bg-slate-950 p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <HeaderBrand
                darkHeader
                mobile
                onNavigate={closeMobileNavigation}
              />

              <button
                type="button"
                aria-label="Close navigation"
                onClick={closeMobileNavigation}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 text-white transition hover:bg-white/10"
              >
                <X size={21} />
              </button>
            </div>

            <nav
              aria-label="Mobile primary navigation"
              className="mt-10 flex flex-1 flex-col gap-2"
            >
              {publicNavigation.map((item) => (
                <NavigationItem
                  key={item.path}
                  item={item}
                  darkHeader
                  onNavigate={closeMobileNavigation}
                />
              ))}
            </nav>

            <div className="space-y-3 border-t border-white/10 pt-5">
              <Link
                to="/login"
                onClick={closeMobileNavigation}
                className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-black text-white"
              >
                Sign in
              </Link>

              <Link
                to="/request-access"
                onClick={closeMobileNavigation}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-indigo-700"
              >
                Request Platform Access
                <ArrowRight size={17} />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}