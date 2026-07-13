import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../platform/auth";
import {
  groupNavigation,
  resolveNavigation,
  useAuthorization,
} from "../platform/authorization";
import { navigationItems } from "./navigation";

import { BrandLogo } from "../shared/branding";

function NavigationLink({
  item,
  onNavigate,
}) {
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

function NavigationGroups({
  groups,
  onNavigate,
}) {
  return groups.map((group) => (
    <div
      key={group.label}
      className="space-y-1"
    >
      <p className="px-4 pb-1 pt-4 text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400 first:pt-0">
        {group.label}
      </p>

      {group.items.map((item) => (
        <NavigationLink
          key={item.path}
          item={item}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  ));
}

function EmptyNavigation({
  mobile = false,
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-black text-amber-900">
        No modules assigned
      </p>

      <p className="mt-1 text-xs font-semibold leading-5 text-amber-700">
        {mobile
          ? "Contact your administrator to request access."
          : "Your account is active, but no application modules are currently available through your permissions."}
      </p>
    </div>
  );
}

function getCurrentPage(
  pathname,
  visibleNavigation,
) {
  return (
    visibleNavigation.find((item) =>
      item.path === "/app"
        ? pathname === "/app"
        : pathname.startsWith(item.path),
    )?.label || "SchoolOS"
  );
}

function getInitials(name, email) {
  const source =
    name?.trim() ||
    email?.split("@")[0] ||
    "SchoolOS User";

  const words = source
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function WorkspaceLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

        <p className="mt-4 text-sm font-black text-slate-700">
          Loading your authorized workspace...
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          Resolving roles, permissions, and modules.
        </p>
      </div>
    </div>
  );
}

function AuthorizationErrorScreen({
  error,
  refreshing,
  onRetry,
  onSignOut,
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-[2rem] border border-red-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle size={28} />
        </span>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-red-600">
          Authorization unavailable
        </p>

        <h1 className="mt-3 text-3xl font-black text-slate-950">
          SchoolOS could not load your permissions.
        </h1>

        <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
          {error ||
            "The enterprise authorization context could not be resolved."}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={refreshing}
            onClick={onRetry}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Checking access..."
              : "Retry authorization"}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    profile,
    signOut,
  } = useAuth();

  const {
    authorizationContext,
    roles,
    loading,
    error,
    authorizationReady,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshAuthorization,
  } = useAuthorization();

  const visibleNavigation = useMemo(
    () =>
      resolveNavigation({
        items: navigationItems,
        authorization: {
          hasPermission,
          hasAnyPermission,
          hasAllPermissions,
        },
        licensedModules: [],
        enabledFeatures: [],
      }),
    [
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    ],
  );

  const navigationGroups = useMemo(
    () => groupNavigation(visibleNavigation),
    [visibleNavigation],
  );

  const currentPage = getCurrentPage(
    location.pathname,
    visibleNavigation,
  );

  const resolvedProfile =
    authorizationContext?.profile ||
    profile ||
    null;

  const organization =
    authorizationContext?.organization ||
    null;

  const school =
    authorizationContext?.school ||
    null;

  const campus =
    authorizationContext?.campus ||
    null;

  const displayName =
    resolvedProfile?.preferred_name ||
    resolvedProfile?.full_name ||
    user?.email ||
    "SchoolOS User";

  const primaryRole =
    roles?.[0]?.name ||
    "Authorized User";

  const initials = getInitials(
    displayName,
    user?.email,
  );

  const workspaceLabel = [
    school?.name,
    campus?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  async function handleSignOut() {
    const result = await signOut();

    if (result?.success) {
      navigate("/login", {
        replace: true,
      });
    }
  }

  if (loading) {
    return <WorkspaceLoadingScreen />;
  }

  if (error || !authorizationReady) {
    return (
      <AuthorizationErrorScreen
        error={error}
        refreshing={loading}
        onRetry={refreshAuthorization}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-24 items-center border-b border-slate-200 px-6">
          <BrandLogo
            size="md"
            showAttribution
            attribution="Enterprise"
          />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {visibleNavigation.length > 0 ? (
            <NavigationGroups
              groups={navigationGroups}
            />
          ) : (
            <EmptyNavigation />
          )}
        </nav>

        <div className="border-t border-slate-200 p-5">
          <p className="truncate text-xs font-black text-slate-600">
            {organization?.name ||
              "SchoolOS Organization"}
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
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
            onClick={() =>
              setMobileOpen(false)
            }
          />

          <aside className="relative flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
              <BrandLogo
                size="sm"
                showAttribution
                attribution="Enterprise"
              />

              <button
                type="button"
                aria-label="Close navigation"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {visibleNavigation.length > 0 ? (
                <NavigationGroups
                  groups={navigationGroups}
                  onNavigate={() =>
                    setMobileOpen(false)
                  }
                />
              ) : (
                <EmptyNavigation mobile />
              )}
            </nav>

            <div className="border-t border-slate-200 p-5">
              <p className="truncate text-xs font-black text-slate-600">
                {organization?.name ||
                  "SchoolOS Organization"}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
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
                onClick={() =>
                  setMobileOpen(true)
                }
              >
                <Menu size={21} />
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                  {currentPage}
                </p>

                <p className="truncate text-xs font-semibold text-slate-500">
                  {workspaceLabel ||
                    organization?.name ||
                    "Authorized SchoolOS Workspace"}
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
              </button>

              <div className="group relative">
                <button
                  type="button"
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50 sm:px-2"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                    {initials}
                  </span>

                  <span className="hidden min-w-0 text-left md:block">
                    <span className="block max-w-40 truncate text-sm font-black text-slate-950">
                      {displayName}
                    </span>

                    <span className="block max-w-40 truncate text-xs font-semibold text-slate-500">
                      {primaryRole}
                    </span>
                  </span>

                  <ChevronDown
                    size={16}
                    className="hidden text-slate-500 md:block"
                  />
                </button>

                <div className="invisible absolute right-0 top-full z-50 mt-2 w-64 translate-y-1 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate text-sm font-black text-slate-950">
                      {displayName}
                    </p>

                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {user?.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-black text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut size={17} />
                    Sign out
                  </button>
                </div>
              </div>
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
