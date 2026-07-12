import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../auth";
import { AuthorizationContext } from "./AuthorizationContext";
import { getAuthorizationContext } from "./AuthorizationService";

const EMPTY_AUTHORIZATION_STATE = {
  context: null,
  roles: [],
  permissions: [],
  permissionCodes: [],
};

function normalizePermissionCode(code) {
  return code?.trim().toLowerCase() || "";
}

export default function AuthorizationProvider({
  children,
}) {
  const {
    isAuthenticated,
    workspaceReady,
    organizationId,
    schoolId,
    campusId,
  } = useAuth();

  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  const [
    authorizationState,
    setAuthorizationState,
  ] = useState(EMPTY_AUTHORIZATION_STATE);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetAuthorization = useCallback(() => {
    requestRef.current += 1;
    setAuthorizationState(
      EMPTY_AUTHORIZATION_STATE,
    );
    setLoading(false);
    setError("");
  }, []);

  const refreshAuthorization =
    useCallback(async () => {
      if (
        !isAuthenticated ||
        !workspaceReady ||
        !organizationId ||
        !schoolId
      ) {
        resetAuthorization();
        return null;
      }

      const requestId = ++requestRef.current;

      setLoading(true);
      setError("");

      try {
        const context =
          await getAuthorizationContext({
            organizationId,
            schoolId,
            campusId,
          });

        if (
          !mountedRef.current ||
          requestId !== requestRef.current
        ) {
          return null;
        }

        const roles = Array.isArray(
          context?.roles,
        )
          ? context.roles
          : [];

        const permissions = Array.isArray(
          context?.permissions,
        )
          ? context.permissions
          : [];

        const permissionCodes = [
          ...new Set(
            permissions
              .map((permission) =>
                normalizePermissionCode(
                  permission.code,
                ),
              )
              .filter(Boolean),
          ),
        ];

        setAuthorizationState({
          context,
          roles,
          permissions,
          permissionCodes,
        });

        return context;
      } catch (authorizationError) {
        if (
          !mountedRef.current ||
          requestId !== requestRef.current
        ) {
          return null;
        }

        setAuthorizationState(
          EMPTY_AUTHORIZATION_STATE,
        );

        setError(
          authorizationError?.message ||
            "Unable to load SchoolOS authorization.",
        );

        return null;
      } finally {
        if (
          mountedRef.current &&
          requestId === requestRef.current
        ) {
          setLoading(false);
        }
      }
    }, [
      isAuthenticated,
      workspaceReady,
      organizationId,
      schoolId,
      campusId,
      resetAuthorization,
    ]);

  useEffect(() => {
    mountedRef.current = true;

    if (
      isAuthenticated &&
      workspaceReady &&
      organizationId &&
      schoolId
    ) {
      refreshAuthorization();
    } else {
      resetAuthorization();
    }

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, [
    isAuthenticated,
    workspaceReady,
    organizationId,
    schoolId,
    campusId,
    refreshAuthorization,
    resetAuthorization,
  ]);

  const permissionSet = useMemo(
    () =>
      new Set(
        authorizationState.permissionCodes,
      ),
    [authorizationState.permissionCodes],
  );

  const hasPermission = useCallback(
    (permissionCode) => {
      const normalizedCode =
        normalizePermissionCode(permissionCode);

      return (
        normalizedCode.length > 0 &&
        permissionSet.has(normalizedCode)
      );
    },
    [permissionSet],
  );

  const hasAnyPermission = useCallback(
    (permissionCodes = []) =>
      permissionCodes.some((code) =>
        hasPermission(code),
      ),
    [hasPermission],
  );

  const hasAllPermissions = useCallback(
    (permissionCodes = []) =>
      permissionCodes.every((code) =>
        hasPermission(code),
      ),
    [hasPermission],
  );

  const value = useMemo(
    () => ({
      authorizationContext:
        authorizationState.context,

      roles:
        authorizationState.roles,

      permissions:
        authorizationState.permissions,

      permissionCodes:
        authorizationState.permissionCodes,

      loading,
      error,

      authorizationReady:
        workspaceReady &&
        !loading &&
        !error &&
        Boolean(
          authorizationState.context,
        ),

      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refreshAuthorization,
    }),
    [
      authorizationState,
      workspaceReady,
      loading,
      error,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refreshAuthorization,
    ],
  );

  return (
    <AuthorizationContext.Provider
      value={value}
    >
      {children}
    </AuthorizationContext.Provider>
  );
}
