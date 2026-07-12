import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuthorization } from "./AuthorizationContext";

function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

        <p className="mt-4 text-sm font-black text-slate-700">
          Verifying module access...
        </p>
      </div>
    </div>
  );
}

export default function ModuleRouteGuard({
  permission,
  anyOf,
  allOf,
  redirectTo = "/app/access-denied",
  children,
}) {
  const {
    loading,
    authorizationReady,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuthorization();

  const location = useLocation();

  if (loading || !authorizationReady) {
    return <LoadingScreen />;
  }

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  }

  if (
    allowed &&
    Array.isArray(anyOf) &&
    anyOf.length > 0
  ) {
    allowed = hasAnyPermission(anyOf);
  }

  if (
    allowed &&
    Array.isArray(allOf) &&
    allOf.length > 0
  ) {
    allowed = hasAllPermissions(allOf);
  }

  if (!allowed) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          attemptedPath:
            location.pathname +
            location.search +
            location.hash,
          requiredPermission:
            permission || null,
          requiredAnyOf:
            Array.isArray(anyOf)
              ? anyOf
              : [],
          requiredAllOf:
            Array.isArray(allOf)
              ? allOf
              : [],
        }}
      />
    );
  }

  if (children) {
    return children;
  }

  return <Outlet />;
}
