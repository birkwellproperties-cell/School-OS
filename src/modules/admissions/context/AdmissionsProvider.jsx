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

import useInquiryState
  from "./useInquiryState";

import useApplicantState
  from "./useApplicantState";  

import useApplicationState
  from "./useApplicationState";  

import useApplicationDocumentState
  from "./useApplicationDocumentState";

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

function normalizeAdmissionCycles(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
  }

  return [];
}

function findDefaultAdmissionCycle(
  admissionCycles,
) {
  if (!admissionCycles.length) {
    return null;
  }

  return (
    admissionCycles.find(
      (cycle) =>
        cycle.status === "open",
    ) ||
    admissionCycles.find(
      (cycle) =>
        cycle.status === "draft",
    ) ||
    admissionCycles.find(
      (cycle) =>
        cycle.status !== "archived",
    ) ||
    admissionCycles[0]
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

  const dashboardRequestRef =
    useRef(0);

  const cyclesRequestRef =
    useRef(0);

  const [
    selectedAdmissionCycleId,
    setSelectedAdmissionCycleId,
  ] = useState(null);

  const [
    admissionCycles,
    setAdmissionCycles,
  ] = useState([]);

  const [
    admissionCyclesLoading,
    setAdmissionCyclesLoading,
  ] = useState(false);

  const [
    admissionCyclesError,
    setAdmissionCyclesError,
  ] = useState("");

  const [
    admissionCycleMutationLoading,
    setAdmissionCycleMutationLoading,
  ] = useState(false);

  const [
    admissionCycleMutationError,
    setAdmissionCycleMutationError,
  ] = useState("");

  const [
    snapshot,
    setSnapshot,
  ] = useState(EMPTY_SNAPSHOT);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const canViewAdmissions =
    hasPermission(
      AdmissionsPermission.VIEW,
    );

  const canCreateAdmissions =
    hasPermission(
      AdmissionsPermission.CREATE,
    );

  const canEditAdmissions =
    hasPermission(
      AdmissionsPermission.EDIT,
    );

  const canManageAdmissionCycles =
    canCreateAdmissions ||
    canEditAdmissions;

  /*
   * The service remains scoped to the active
   * organization, school, and campus.
   *
   * Admission-cycle scope is passed explicitly
   * to dashboard and workflow calls so changing
   * cycles does not rebuild the service instance.
   */
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
    });
  }, [
    workspaceReady,
    organizationId,
    schoolId,
    campusId,
  ]);

  const selectedAdmissionCycle =
    useMemo(
      () =>
        admissionCycles.find(
          (cycle) =>
            cycle.id ===
            selectedAdmissionCycleId,
        ) || null,
      [
        admissionCycles,
        selectedAdmissionCycleId,
      ],
    );

  const resetDashboard =
    useCallback(() => {
      dashboardRequestRef.current += 1;

      setSnapshot(EMPTY_SNAPSHOT);
      setLoading(false);
      setError("");
    }, []);

  const resetAdmissionCycles =
    useCallback(() => {
      cyclesRequestRef.current += 1;

      setAdmissionCycles([]);
      setSelectedAdmissionCycleId(null);

      setAdmissionCyclesLoading(false);
      setAdmissionCyclesError("");

      setAdmissionCycleMutationLoading(
        false,
      );

      setAdmissionCycleMutationError("");
    }, []);

  const resetAdmissions =
    useCallback(() => {
      resetDashboard();
      resetAdmissionCycles();
    }, [
      resetDashboard,
      resetAdmissionCycles,
    ]);

  const refreshAdmissionCycles =
    useCallback(async () => {
      if (
        !service ||
        !workspaceReady ||
        !authorizationReady ||
        !canViewAdmissions
      ) {
        resetAdmissionCycles();
        return [];
      }

      const requestId =
        ++cyclesRequestRef.current;

      setAdmissionCyclesLoading(true);
      setAdmissionCyclesError("");

      try {
        const result =
          await service
            .getAdmissionCycles();

        const items =
          normalizeAdmissionCycles(
            result,
          );

        if (
          !mountedRef.current ||
          requestId !==
            cyclesRequestRef.current
        ) {
          return [];
        }

        setAdmissionCycles(items);

        setSelectedAdmissionCycleId(
          (currentCycleId) => {
            const currentCycleStillExists =
              items.some(
                (cycle) =>
                  cycle.id ===
                  currentCycleId,
              );

            if (
              currentCycleId &&
              currentCycleStillExists
            ) {
              return currentCycleId;
            }

            return (
              findDefaultAdmissionCycle(
                items,
              )?.id || null
            );
          },
        );

        return items;
      } catch (cyclesError) {
        if (
          !mountedRef.current ||
          requestId !==
            cyclesRequestRef.current
        ) {
          return [];
        }

        setAdmissionCycles([]);
        setSelectedAdmissionCycleId(null);

        setAdmissionCyclesError(
          getErrorMessage(
            cyclesError,
            "Unable to load admission cycles.",
          ),
        );

        return [];
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            cyclesRequestRef.current
        ) {
          setAdmissionCyclesLoading(false);
        }
      }
    }, [
      service,
      workspaceReady,
      authorizationReady,
      canViewAdmissions,
      resetAdmissionCycles,
    ]);

  const refreshDashboard =
    useCallback(
      async (
        admissionCycleIdOverride =
          selectedAdmissionCycleId,
      ) => {
        const resolvedAdmissionCycleId =
          typeof admissionCycleIdOverride ===
            "string" &&
          admissionCycleIdOverride.trim()
            ? admissionCycleIdOverride
            : selectedAdmissionCycleId;
        if (
          !service ||
          !workspaceReady ||
          !authorizationReady ||
          !canViewAdmissions
        ) {
          resetDashboard();
          return null;
        }

        const requestId =
          ++dashboardRequestRef.current;

        setLoading(true);
        setError("");

        try {
          const nextSnapshot =
            await service
              .getDashboardSnapshot({
                admissionCycleId:
                  resolvedAdmissionCycleId ||
                  undefined,
              });

          if (
            !mountedRef.current ||
            requestId !==
              dashboardRequestRef.current
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
            requestId !==
              dashboardRequestRef.current
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
            requestId ===
              dashboardRequestRef.current
          ) {
            setLoading(false);
          }
        }
      },
      [
        service,
        workspaceReady,
        authorizationReady,
        canViewAdmissions,
        selectedAdmissionCycleId,
        resetDashboard,
      ],
    );

  /*
   * Mounted lifecycle.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      dashboardRequestRef.current += 1;
      cyclesRequestRef.current += 1;
    };
  }, []);  

  const inquiryState =
    useInquiryState({
      service,
      mountedRef,

      workspaceReady,
      authorizationReady,

      canViewAdmissions,
      canCreateAdmissions,
      canEditAdmissions,

      selectedAdmissionCycleId,

      refreshDashboard,
    });
  
  const applicantState =
    useApplicantState({
      service,

      workspaceReady,
      authorizationReady,

      canViewAdmissions,
      canCreateAdmissions,
      canEditAdmissions,

      selectedAdmissionCycleId,

      refreshDashboard,
    });  

  const applicationState =
    useApplicationState({
      service,

      workspaceReady,
      authorizationReady,

      canViewAdmissions,
      canCreateAdmissions,
      canEditAdmissions,

      selectedAdmissionCycleId,

    refreshDashboard,
  });

  const applicationDocumentState =
    useApplicationDocumentState({
      service,

      workspaceReady,
      authorizationReady,

      canViewAdmissions,
      canCreateAdmissions,
      canEditAdmissions,

      organizationId,
      schoolId,
      campusId,

      selectedApplicationId:
        applicationState
          .selectedApplicationId,

      selectedApplication:
        applicationState
          .selectedApplication,

      refreshDashboard,
    });

  const createAdmissionCycle =
    useCallback(
      async (payload = {}) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canCreateAdmissions) {
          throw new Error(
            "You do not have permission to create admission cycles.",
          );
        }

        setAdmissionCycleMutationLoading(
          true,
        );

        setAdmissionCycleMutationError("");

        try {
          const createdCycle =
            await service
              .createAdmissionCycle(
                payload,
              );

          const refreshedCycles =
            await refreshAdmissionCycles();

          const createdCycleId =
            createdCycle?.id || null;

          const createdCycleExists =
            createdCycleId &&
            refreshedCycles.some(
              (cycle) =>
                cycle.id ===
                createdCycleId,
            );

          const nextCycleId =
            createdCycleExists
              ? createdCycleId
              : findDefaultAdmissionCycle(
                  refreshedCycles,
                )?.id || null;

          setSelectedAdmissionCycleId(
            nextCycleId,
          );

          await refreshDashboard(
            nextCycleId,
          );

          return createdCycle;
        } catch (mutationError) {
          const message =
            getErrorMessage(
              mutationError,
              "Unable to create the admission cycle.",
            );

          setAdmissionCycleMutationError(
            message,
          );

          throw mutationError;
        } finally {
          if (mountedRef.current) {
            setAdmissionCycleMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAdmissions,
        refreshAdmissionCycles,
        refreshDashboard,
      ],
    );

  const updateAdmissionCycle =
    useCallback(
      async (
        admissionCycleId,
        updates = {},
      ) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canEditAdmissions) {
          throw new Error(
            "You do not have permission to edit admission cycles.",
          );
        }

        if (!admissionCycleId) {
          throw new Error(
            "Admission cycle id is required.",
          );
        }

        setAdmissionCycleMutationLoading(
          true,
        );

        setAdmissionCycleMutationError("");

        try {
          const updatedCycle =
            await service
              .updateAdmissionCycle(
                admissionCycleId,
                updates,
              );

          const refreshedCycles =
            await refreshAdmissionCycles();

          const selectedCycleStillExists =
            refreshedCycles.some(
              (cycle) =>
                cycle.id ===
                selectedAdmissionCycleId,
            );

          const nextCycleId =
            selectedCycleStillExists
              ? selectedAdmissionCycleId
              : findDefaultAdmissionCycle(
                  refreshedCycles,
                )?.id || null;

          if (
            nextCycleId !==
            selectedAdmissionCycleId
          ) {
            setSelectedAdmissionCycleId(
              nextCycleId,
            );
          }

          await refreshDashboard(
            nextCycleId,
          );

          return updatedCycle;
        } catch (mutationError) {
          const message =
            getErrorMessage(
              mutationError,
              "Unable to update the admission cycle.",
            );

          setAdmissionCycleMutationError(
            message,
          );

          throw mutationError;
        } finally {
          if (mountedRef.current) {
            setAdmissionCycleMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAdmissions,
        selectedAdmissionCycleId,
        refreshAdmissionCycles,
        refreshDashboard,
      ],
    );

  const archiveAdmissionCycle =
    useCallback(
      async (admissionCycleId) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canEditAdmissions) {
          throw new Error(
            "You do not have permission to archive admission cycles.",
          );
        }

        if (!admissionCycleId) {
          throw new Error(
            "Admission cycle id is required.",
          );
        }

        setAdmissionCycleMutationLoading(
          true,
        );

        setAdmissionCycleMutationError("");

        try {
          const archivedCycle =
            await service
              .archiveAdmissionCycle(
                admissionCycleId,
              );

          const refreshedCycles =
            await refreshAdmissionCycles();

          let nextCycleId =
            selectedAdmissionCycleId;

          const selectedCycleStillValid =
            refreshedCycles.some(
              (cycle) =>
                cycle.id ===
                  selectedAdmissionCycleId &&
                cycle.status !==
                  "archived",
            );

          if (!selectedCycleStillValid) {
            const availableCycles =
              refreshedCycles.filter(
                (cycle) =>
                  cycle.status !==
                  "archived",
              );

            nextCycleId =
              findDefaultAdmissionCycle(
                availableCycles,
              )?.id || null;

            setSelectedAdmissionCycleId(
              nextCycleId,
            );
          }

          await refreshDashboard(
            nextCycleId,
          );

          return archivedCycle;
        } catch (mutationError) {
          const message =
            getErrorMessage(
              mutationError,
              "Unable to archive the admission cycle.",
            );

          setAdmissionCycleMutationError(
            message,
          );

          throw mutationError;
        } finally {
          if (mountedRef.current) {
            setAdmissionCycleMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAdmissions,
        selectedAdmissionCycleId,
        refreshAdmissionCycles,
        refreshDashboard,
      ],
    );

  const deleteAdmissionCycle =
    useCallback(
      async (admissionCycleId) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canEditAdmissions) {
          throw new Error(
            "You do not have permission to delete admission cycles.",
          );
        }

        if (!admissionCycleId) {
          throw new Error(
            "Admission cycle id is required.",
          );
        }

        setAdmissionCycleMutationLoading(
          true,
        );

        setAdmissionCycleMutationError("");

        try {
          const deletedCycle =
            await service
              .deleteAdmissionCycle(
                admissionCycleId,
              );

          const refreshedCycles =
            await refreshAdmissionCycles();

          const selectedCycleStillExists =
            refreshedCycles.some(
              (cycle) =>
                cycle.id ===
                selectedAdmissionCycleId,
            );

          const nextCycleId =
            selectedCycleStillExists
              ? selectedAdmissionCycleId
              : findDefaultAdmissionCycle(
                  refreshedCycles,
                )?.id || null;

          if (
            nextCycleId !==
            selectedAdmissionCycleId
          ) {
            setSelectedAdmissionCycleId(
              nextCycleId,
            );
          }

          await refreshDashboard(
            nextCycleId,
          );

          return deletedCycle;
        } catch (mutationError) {
          const message =
            getErrorMessage(
              mutationError,
              "Unable to delete the admission cycle.",
            );

          setAdmissionCycleMutationError(
            message,
          );

          throw mutationError;
        } finally {
          if (mountedRef.current) {
            setAdmissionCycleMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAdmissions,
        selectedAdmissionCycleId,
        refreshAdmissionCycles,
        refreshDashboard,
      ],
    );

  const clearError =
    useCallback(() => {
      setError("");
    }, []);

  const clearAdmissionCyclesError =
    useCallback(() => {
      setAdmissionCyclesError("");
    }, []);

  const clearAdmissionCycleMutationError =
    useCallback(() => {
      setAdmissionCycleMutationError("");
    }, []);

  const selectAdmissionCycle =
    useCallback((admissionCycleId) => {
      setSelectedAdmissionCycleId(
        admissionCycleId || null,
      );
    }, []);

  /*
   * Reset all Admissions state when the
   * workspace or authorization scope is lost.
   */
  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAdmissions
    ) {
      resetAdmissions();
    }
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,
    resetAdmissions,
  ]);

  /*
   * Load admission cycles when the workspace
   * scope becomes available.
   */
  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAdmissions
    ) {
      return;
    }

    refreshAdmissionCycles();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,
    refreshAdmissionCycles,
  ]);

  /*
   * Refresh dashboard data when the selected
   * admission cycle changes.
   */
  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAdmissions ||
      admissionCyclesLoading
    ) {
      return;
    }

    refreshDashboard(
      selectedAdmissionCycleId,
    );
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,
    admissionCyclesLoading,
    selectedAdmissionCycleId,
    refreshDashboard,
  ]);

  const value = useMemo(
    () => ({
      service,
      loading,
      error,

      admissionCycles,
      admissionCyclesLoading,
      admissionCyclesError,

      admissionCycleMutationLoading,
      admissionCycleMutationError,

      admissionsReady:
        workspaceReady &&
        authorizationReady &&
        canViewAdmissions &&
        Boolean(service) &&
        !loading &&
        !admissionCyclesLoading &&
        !error &&
        !admissionCyclesError,

      canViewAdmissions,
      canCreateAdmissions,
      canEditAdmissions,
      canManageAdmissionCycles,

      selectedAdmissionCycleId,
      selectedAdmissionCycle,
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

      refreshAdmissionCycles,
      refreshDashboard,

      createAdmissionCycle,
      updateAdmissionCycle,
      archiveAdmissionCycle,
      deleteAdmissionCycle,

      ...inquiryState,
      ...applicantState,
      ...applicationState,
      ...applicationDocumentState,

      clearError,
      clearAdmissionCyclesError,
      clearAdmissionCycleMutationError,
    }),
    [
      service,
      loading,
      error,

      admissionCycles,
      admissionCyclesLoading,
      admissionCyclesError,

      admissionCycleMutationLoading,
      admissionCycleMutationError,

      workspaceReady,
      authorizationReady,

      canViewAdmissions,
      canCreateAdmissions,
      canEditAdmissions,
      canManageAdmissionCycles,

      selectedAdmissionCycleId,
      selectedAdmissionCycle,
      selectAdmissionCycle,

      snapshot,

      refreshAdmissionCycles,
      refreshDashboard,

      createAdmissionCycle,
      updateAdmissionCycle,
      archiveAdmissionCycle,
      deleteAdmissionCycle,

      inquiryState,
      applicantState,
      applicationState,
      applicationDocumentState,

      clearError,
      clearAdmissionCyclesError,
      clearAdmissionCycleMutationError,
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