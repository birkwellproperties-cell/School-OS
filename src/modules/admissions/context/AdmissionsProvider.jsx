import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../../../platform/auth";
import {
  useAuthorization,
} from "../../../platform/authorization";

import {
  AdmissionsPermission,
} from "../constants";

import {
  createAdmissionsService,
} from "../services";

import {
  AdmissionsContext,
} from "./AdmissionsContext";

const EMPTY_PAGED_RESULT = Object.freeze({
  items: [],
  total: 0,
  page: 1,
  pageSize: 25,
  pageCount: 0,
});

const EMPTY_METRICS = Object.freeze({
  activeCycles: 0,
  openInquiries: 0,
  totalApplicants: 0,
  openApplications: 0,
  pendingDocuments: 0,
  upcomingInterviews: 0,
  pendingDecisions: 0,
  openOffers: 0,
  completedEnrollments: 0,
  conversionRate: 0,
});

const EMPTY_SNAPSHOT = Object.freeze({
  metrics: EMPTY_METRICS,
  recentInquiries: EMPTY_PAGED_RESULT,
  priorityApplications: EMPTY_PAGED_RESULT,
  upcomingInterviews: EMPTY_PAGED_RESULT,
  loadedAt: null,
});

function getErrorMessage(
  error,
  fallbackMessage,
) {
  return (
    error?.message ||
    fallbackMessage
  );
}

export default function AdmissionsProvider({
  children,
}) {
  const {
    workspaceReady,
    organizationId,
    schoolId,
    campusId,
  } = useAuth();

  const {
    authorizationReady,
    hasPermission,
  } = useAuthorization();

  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  const [
    selectedAdmissionCycleId,
    setSelectedAdmissionCycleId,
  ] = useState(null);

  const [snapshot, setSnapshot] =
    useState(EMPTY_SNAPSHOT);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const canViewAdmissions =
    hasPermission(
      AdmissionsPermission.VIEW,
    );

  const service = useMemo(() => {
    if (
      !workspaceReady ||
      !organizationId ||
      !schoolId
    ) {
      return null;
    }

    return createAdmissionsService({
      organizationId,
      schoolId,
      campusId,
      admissionCycleId:
        selectedAdmissionCycleId ||
        undefined,
    });
  }, [
    workspaceReady,
    organizationId,
    schoolId,
    campusId,
    selectedAdmissionCycleId,
  ]);

  const resetAdmissions =
    useCallback(() => {
      requestRef.current += 1;
      setSnapshot(EMPTY_SNAPSHOT);
      setLoading(false);
      setError("");
    }, []);

  const refreshDashboard =
    useCallback(async () => {
      if (
        !service ||
        !workspaceReady ||
        !authorizationReady ||
        !canViewAdmissions
      ) {
        resetAdmissions();
        return null;
      }

      const requestId =
        ++requestRef.current;

      setLoading(true);
      setError("");

      try {
        const nextSnapshot =
          await service
            .getDashboardSnapshot({
              admissionCycleId:
                selectedAdmissionCycleId ||
                undefined,
            });

        if (
          !mountedRef.current ||
          requestId !== requestRef.current
        ) {
          return null;
        }

        setSnapshot({
          metrics:
            nextSnapshot?.metrics ||
            EMPTY_METRICS,

          recentInquiries:
            nextSnapshot
              ?.recentInquiries ||
            EMPTY_PAGED_RESULT,

          priorityApplications:
            nextSnapshot
              ?.priorityApplications ||
            EMPTY_PAGED_RESULT,

          upcomingInterviews:
            nextSnapshot
              ?.upcomingInterviews ||
            EMPTY_PAGED_RESULT,

          loadedAt:
            nextSnapshot?.loadedAt ||
            new Date().toISOString(),
        });

        return nextSnapshot;
      } catch (dashboardError) {
        if (
          !mountedRef.current ||
          requestId !== requestRef.current
        ) {
          return null;
        }

        setSnapshot(EMPTY_SNAPSHOT);

        setError(
          getErrorMessage(
            dashboardError,
            "Unable to load the Admissions Center.",
          ),
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
      service,
      workspaceReady,
      authorizationReady,
      canViewAdmissions,
      selectedAdmissionCycleId,
      resetAdmissions,
    ]);

  useEffect(() => {
    mountedRef.current = true;

    if (
      service &&
      workspaceReady &&
      authorizationReady &&
      canViewAdmissions
    ) {
      refreshDashboard();
    } else {
      resetAdmissions();
    }

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,
    refreshDashboard,
    resetAdmissions,
  ]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const selectAdmissionCycle =
    useCallback((admissionCycleId) => {
      setSelectedAdmissionCycleId(
        admissionCycleId || null,
      );
    }, []);

  const value = useMemo(
    () => ({
      service,

      loading,
      error,

      admissionsReady:
        workspaceReady &&
        authorizationReady &&
        canViewAdmissions &&
        Boolean(service) &&
        !loading &&
        !error,

      canViewAdmissions,

      selectedAdmissionCycleId,
      selectAdmissionCycle,

      metrics:
        snapshot.metrics,

      recentInquiries:
        snapshot.recentInquiries,

      priorityApplications:
        snapshot.priorityApplications,

      upcomingInterviews:
        snapshot.upcomingInterviews,

      loadedAt:
        snapshot.loadedAt,

      refreshDashboard,
      clearError,
    }),
    [
      service,
      loading,
      error,
      workspaceReady,
      authorizationReady,
      canViewAdmissions,
      selectedAdmissionCycleId,
      selectAdmissionCycle,
      snapshot,
      refreshDashboard,
      clearError,
    ],
  );

  return (
    <AdmissionsContext.Provider
      value={value}
    >
      {children}
    </AdmissionsContext.Provider>
  );
}
