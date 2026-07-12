import { supabase } from "../../services/supabase";

function createAuthorizationError(operation, error) {
  const authorizationError = new Error(
    error?.message ||
      `Unable to ${operation}.`,
  );

  authorizationError.name = "AuthorizationServiceError";
  authorizationError.operation = operation;
  authorizationError.code = error?.code || null;
  authorizationError.details = error?.details || null;
  authorizationError.hint = error?.hint || null;

  return authorizationError;
}

export async function getAuthorizationContext({
  organizationId,
  schoolId,
  campusId = null,
}) {
  if (!organizationId) {
    throw new Error(
      "Organization context is required to load authorization.",
    );
  }

  if (!schoolId) {
    throw new Error(
      "School context is required to load authorization.",
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_current_authorization_context",
    {
      target_organization_id: organizationId,
      target_school_id: schoolId,
      target_campus_id: campusId,
    },
  );

  if (error) {
    throw createAuthorizationError(
      "load the current authorization context",
      error,
    );
  }

  return data || null;
}

export async function getEffectivePermissions({
  organizationId,
  schoolId = null,
}) {
  if (!organizationId) {
    throw new Error(
      "Organization context is required to load permissions.",
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_current_effective_permissions",
    {
      target_organization_id: organizationId,
      target_school_id: schoolId,
    },
  );

  if (error) {
    throw createAuthorizationError(
      "load effective permissions",
      error,
    );
  }

  return data || [];
}

export async function checkPermission({
  permissionCode,
  organizationId,
  schoolId = null,
}) {
  const normalizedPermissionCode =
    permissionCode?.trim().toLowerCase();

  if (!normalizedPermissionCode) {
    return false;
  }

  if (!organizationId) {
    return false;
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "current_user_has_permission",
    {
      target_permission_code:
        normalizedPermissionCode,

      target_organization_id:
        organizationId,

      target_school_id:
        schoolId,
    },
  );

  if (error) {
    throw createAuthorizationError(
      `check permission ${normalizedPermissionCode}`,
      error,
    );
  }

  return data === true;
}
