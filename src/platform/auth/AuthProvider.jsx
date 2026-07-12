import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../../services/supabase";
import { bootstrapAuth } from "./AuthBootstrap";
import { AuthContext } from "./AuthContext";

const EMPTY_ENTERPRISE_STATE = {
  accessStatus: "unauthenticated",
  profile: null,

  organizationMemberships: [],
  schoolMemberships: [],
  campusAssignments: [],

  currentOrganizationMembership: null,
  currentSchoolMembership: null,
  currentCampusAssignment: null,

  organizationId: null,
  schoolId: null,
  campusId: null,
};

function getErrorMessage(error, fallbackMessage) {
  return error?.message || fallbackMessage;
}

export default function AuthProvider({ children }) {
  const mountedRef = useRef(true);
  const bootstrapRequestRef = useRef(0);

  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [bootstrapError, setBootstrapError] = useState("");

  const [enterpriseState, setEnterpriseState] = useState(
    EMPTY_ENTERPRISE_STATE,
  );

  const resetEnterpriseState = useCallback(() => {
    setEnterpriseState(EMPTY_ENTERPRISE_STATE);
    setBootstrapError("");
    setBootstrapLoading(false);
  }, []);

  const loadEnterpriseIdentity = useCallback(async () => {
    const requestId = ++bootstrapRequestRef.current;

    setBootstrapLoading(true);
    setBootstrapError("");

    try {
      const result = await bootstrapAuth(supabase);

      if (
        !mountedRef.current ||
        requestId !== bootstrapRequestRef.current
      ) {
        return null;
      }

      setEnterpriseState({
        accessStatus: result.accessStatus,
        profile: result.profile,

        organizationMemberships:
          result.organizationMemberships || [],

        schoolMemberships:
          result.schoolMemberships || [],

        campusAssignments:
          result.campusAssignments || [],

        currentOrganizationMembership:
          result.currentOrganizationMembership || null,

        currentSchoolMembership:
          result.currentSchoolMembership || null,

        currentCampusAssignment:
          result.currentCampusAssignment || null,

        organizationId: result.organizationId || null,
        schoolId: result.schoolId || null,
        campusId: result.campusId || null,
      });

      return result;
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== bootstrapRequestRef.current
      ) {
        return null;
      }

      setEnterpriseState({
        ...EMPTY_ENTERPRISE_STATE,
        accessStatus: "bootstrap_failed",
      });

      setBootstrapError(
        getErrorMessage(
          error,
          "Unable to initialize your SchoolOS workspace.",
        ),
      );

      return null;
    } finally {
      if (
        mountedRef.current &&
        requestId === bootstrapRequestRef.current
      ) {
        setBootstrapLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function initializeSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mountedRef.current) return;

        const nextSession = data.session ?? null;

        setSession(nextSession);
        setAuthError("");

        if (nextSession?.user) {
          await loadEnterpriseIdentity();
        } else {
          resetEnterpriseState();
        }
      } catch (error) {
        if (!mountedRef.current) return;

        setSession(null);
        resetEnterpriseState();

        setAuthError(
          getErrorMessage(
            error,
            "Unable to initialize the authentication session.",
          ),
        );
      } finally {
        if (mountedRef.current) {
          setInitializing(false);
        }
      }
    }

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (!mountedRef.current) return;

        setSession(nextSession ?? null);
        setAuthError("");

        if (!nextSession?.user) {
          bootstrapRequestRef.current += 1;
          resetEnterpriseState();
          setInitializing(false);
          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED" ||
          event === "INITIAL_SESSION"
        ) {
          await loadEnterpriseIdentity();
        }

        if (mountedRef.current) {
          setInitializing(false);
        }
      },
    );

    return () => {
      mountedRef.current = false;
      bootstrapRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, [
    loadEnterpriseIdentity,
    resetEnterpriseState,
  ]);

  const clearAuthError = useCallback(() => {
    setAuthError("");
    setBootstrapError("");
  }, []);

  const signIn = useCallback(
    async ({ email, password }) => {
      setAuthError("");
      setBootstrapError("");

      const normalizedEmail = email?.trim().toLowerCase();

      if (!normalizedEmail || !password) {
        const message = "Email and password are required.";

        setAuthError(message);

        return {
          success: false,
          error: new Error(message),
        };
      }

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (error) {
        setAuthError(
          getErrorMessage(
            error,
            "Unable to sign in to SchoolOS.",
          ),
        );

        return {
          success: false,
          error,
        };
      }

      setSession(data.session ?? null);

      const bootstrap = await loadEnterpriseIdentity();

      return {
        success: true,
        data,
        bootstrap,
      };
    },
    [loadEnterpriseIdentity],
  );

  const signOut = useCallback(async () => {
    setAuthError("");
    setBootstrapError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(
        getErrorMessage(
          error,
          "Unable to sign out of SchoolOS.",
        ),
      );

      return {
        success: false,
        error,
      };
    }

    bootstrapRequestRef.current += 1;
    setSession(null);
    resetEnterpriseState();

    return {
      success: true,
    };
  }, [resetEnterpriseState]);

  const sendPasswordReset = useCallback(async (email) => {
    setAuthError("");

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      const message = "Email address is required.";

      setAuthError(message);

      return {
        success: false,
        error: new Error(message),
      };
    }

    const redirectTo =
      `${window.location.origin}/reset-password`;

    const { data, error } =
      await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo,
        },
      );

    if (error) {
      setAuthError(
        getErrorMessage(
          error,
          "Unable to send the password reset email.",
        ),
      );

      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      data,
    };
  }, []);

  const updatePassword = useCallback(async (password) => {
    setAuthError("");

    if (!password || password.length < 8) {
      const message =
        "Your new password must contain at least 8 characters.";

      setAuthError(message);

      return {
        success: false,
        error: new Error(message),
      };
    }

    const { data, error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setAuthError(
        getErrorMessage(
          error,
          "Unable to update your password.",
        ),
      );

      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      data,
    };
  }, []);

  const isAuthenticated = Boolean(session?.user);
  const workspaceReady =
    isAuthenticated &&
    enterpriseState.accessStatus === "ready";

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,

      isAuthenticated,
      initializing,
      bootstrapLoading,
      workspaceLoading:
        initializing || bootstrapLoading,

      authError,
      bootstrapError,

      accessStatus:
        enterpriseState.accessStatus,

      workspaceReady,

      profile:
        enterpriseState.profile,

      organizationMemberships:
        enterpriseState.organizationMemberships,

      schoolMemberships:
        enterpriseState.schoolMemberships,

      campusAssignments:
        enterpriseState.campusAssignments,

      currentOrganizationMembership:
        enterpriseState.currentOrganizationMembership,

      currentSchoolMembership:
        enterpriseState.currentSchoolMembership,

      currentCampusAssignment:
        enterpriseState.currentCampusAssignment,

      organizationId:
        enterpriseState.organizationId,

      schoolId:
        enterpriseState.schoolId,

      campusId:
        enterpriseState.campusId,

      clearAuthError,
      refreshEnterpriseIdentity:
        loadEnterpriseIdentity,

      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [
      session,
      isAuthenticated,
      initializing,
      bootstrapLoading,
      authError,
      bootstrapError,
      enterpriseState,
      workspaceReady,
      clearAuthError,
      loadEnterpriseIdentity,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
