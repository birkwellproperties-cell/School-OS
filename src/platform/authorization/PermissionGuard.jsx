import { useAuthorization } from "./AuthorizationContext";

export default function PermissionGuard({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}) {
  const {
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuthorization();

  if (loading) {
    return fallback;
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

  return allowed ? children : fallback;
}
