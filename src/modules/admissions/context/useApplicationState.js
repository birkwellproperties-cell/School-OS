import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const EMPTY_APPLICATIONS =
  Object.freeze({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    pageCount: 0,
  });

const DEFAULT_APPLICATION_FILTERS =
  Object.freeze({
    search: "",
    status: "",
    priority: "",
    applicantId: "",
    assignedReviewerId: "",
    page: 1,
    pageSize: 25,
    sortBy: "created_at",
    ascending: false,
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

function normalizePagedResult(
  result,
  fallbackFilters,
) {
  if (!result) {
    return {
      ...EMPTY_APPLICATIONS,

      page:
        fallbackFilters.page || 1,

      pageSize:
        fallbackFilters.pageSize ||
        25,
    };
  }

  if (Array.isArray(result)) {
    return {
      items: result,
      total: result.length,

      page:
        fallbackFilters.page || 1,

      pageSize:
        fallbackFilters.pageSize ||
        25,

      pageCount:
        result.length > 0 ? 1 : 0,
    };
  }

  return {
    items:
      Array.isArray(result.items)
        ? result.items
        : [],

    total:
      Number(result.total) || 0,

    page:
      Number(result.page) ||
      fallbackFilters.page ||
      1,

    pageSize:
      Number(result.pageSize) ||
      fallbackFilters.pageSize ||
      25,

    pageCount:
      Number(result.pageCount) || 0,
  };
}

function normalizeFilterValue(
  value,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return value;
}

export default function useApplicationState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAdmissions,
  canCreateAdmissions,
  canEditAdmissions,

  selectedAdmissionCycleId,

  refreshDashboard,
}) {
  const applicationRequestRef =
    useRef(0);

  const isMountedRef =
    useRef(true);

  const applicationFiltersRef =
    useRef({
      ...DEFAULT_APPLICATION_FILTERS,
    });

  const [
    applications,
    setApplications,
  ] = useState(
    EMPTY_APPLICATIONS,
  );

  const [
    applicationFilters,
    setApplicationFiltersState,
  ] = useState({
    ...DEFAULT_APPLICATION_FILTERS,
  });

  const [
    selectedApplicationId,
    setSelectedApplicationId,
  ] = useState(null);

  const [
    applicationsLoading,
    setApplicationsLoading,
  ] = useState(false);

  const [
    applicationsError,
    setApplicationsError,
  ] = useState("");

  const [
    applicationMutationLoading,
    setApplicationMutationLoading,
  ] = useState(false);

  const [
    applicationMutationError,
    setApplicationMutationError,
  ] = useState("");

  useEffect(() => {
    applicationFiltersRef.current =
      applicationFilters;
  }, [
    applicationFilters,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      applicationRequestRef.current += 1;
    };
  }, []);

  const selectedApplication =
    useMemo(
      () =>
        applications.items.find(
          (application) =>
            application.id ===
            selectedApplicationId,
        ) || null,
      [
        applications.items,
        selectedApplicationId,
      ],
    );

  const resetApplications =
    useCallback(() => {
      applicationRequestRef.current +=
        1;

      setApplications(
        EMPTY_APPLICATIONS,
      );

      setSelectedApplicationId(null);

      setApplicationsLoading(false);
      setApplicationsError("");

      setApplicationMutationLoading(
        false,
      );

      setApplicationMutationError("");
    }, []);

  const setApplicationFilters =
    useCallback(
      (
        nextFilters,
        {
          resetPage = true,
        } = {},
      ) => {
        setApplicationFiltersState(
          (currentFilters) => {
            const resolvedFilters =
              typeof nextFilters ===
              "function"
                ? nextFilters(
                    currentFilters,
                  )
                : nextFilters || {};

            const merged = {
              ...currentFilters,
              ...resolvedFilters,
            };

            if (
              resetPage &&
              resolvedFilters.page ===
                undefined
            ) {
              merged.page = 1;
            }

            return {
              ...merged,

              search:
                normalizeFilterValue(
                  merged.search,
                ),

              status:
                normalizeFilterValue(
                  merged.status,
                ),

              priority:
                normalizeFilterValue(
                  merged.priority,
                ),

              applicantId:
                normalizeFilterValue(
                  merged.applicantId,
                ),

              assignedReviewerId:
                normalizeFilterValue(
                  merged.assignedReviewerId,
                ),
            };
          },
        );
      },
      [],
    );

  const resetApplicationFilters =
    useCallback(() => {
      setApplicationFiltersState({
        ...DEFAULT_APPLICATION_FILTERS,
      });
    }, []);

  const refreshApplications =
    useCallback(
      async (
        filterOverrides = {},
      ) => {
        if (
          !service ||
          !workspaceReady ||
          !authorizationReady ||
          !canViewAdmissions ||
          !selectedAdmissionCycleId
        ) {
          resetApplications();
          return EMPTY_APPLICATIONS;
        }

        const safeOverrides =
          filterOverrides &&
          typeof filterOverrides ===
            "object" &&
          !Array.isArray(
            filterOverrides,
          ) &&
          !(
            "nativeEvent" in
            filterOverrides
          )
            ? filterOverrides
            : {};

        const resolvedFilters = {
          ...applicationFiltersRef.current,
          ...safeOverrides,

          admissionCycleId:
            selectedAdmissionCycleId,
        };

        const requestId =
          ++applicationRequestRef.current;

        setApplicationsLoading(true);
        setApplicationsError("");

        try {
          const result =
            await service
              .getApplications({
                admissionCycleId:
                  selectedAdmissionCycleId,

                search:
                  resolvedFilters.search ||
                  undefined,

                status:
                  resolvedFilters.status ||
                  undefined,

                priority:
                  resolvedFilters.priority ||
                  undefined,  

                applicantId:
                  resolvedFilters
                    .applicantId ||
                  undefined,

                assignedReviewerId:
                  resolvedFilters
                    .assignedReviewerId ||
                  undefined,

                page:
                  resolvedFilters.page,

                pageSize:
                  resolvedFilters.pageSize,

                sortBy:
                  resolvedFilters.sortBy,

                ascending:
                  resolvedFilters
                    .ascending,
              });

          if (
            !isMountedRef.current ||
            requestId !==
              applicationRequestRef.current
          ) {
            return EMPTY_APPLICATIONS;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters,
            );

          setApplications(
            normalizedResult,
          );

          setSelectedApplicationId(
            (currentApplicationId) => {
              if (
                !currentApplicationId
              ) {
                return null;
              }

              const stillVisible =
                normalizedResult
                  .items
                  .some(
                    (application) =>
                      application.id ===
                      currentApplicationId,
                  );

              return stillVisible
                ? currentApplicationId
                : null;
            },
          );

          return normalizedResult;
        } catch (loadError) {
          if (
            !isMountedRef.current ||
            requestId !==
              applicationRequestRef.current
          ) {
            return EMPTY_APPLICATIONS;
          }

          setApplications(
            EMPTY_APPLICATIONS,
          );

          setSelectedApplicationId(null);

          setApplicationsError(
            getErrorMessage(
              loadError,
              "Unable to load admission applications.",
            ),
          );

          return EMPTY_APPLICATIONS;
        } finally {
          if (
            isMountedRef.current &&
            requestId ===
              applicationRequestRef.current
          ) {
            setApplicationsLoading(
              false,
            );
          }
        }
      },
      [
        service,
        workspaceReady,
        authorizationReady,
        canViewAdmissions,
        selectedAdmissionCycleId,
        resetApplications,
      ],
    );

  const createApplication =
    useCallback(
      async (payload = {}) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canCreateAdmissions) {
          throw new Error(
            "You do not have permission to create admission applications.",
          );
        }

        if (
          !selectedAdmissionCycleId
        ) {
          throw new Error(
            "Select an admission cycle before starting an application.",
          );
        }

        if (!payload.applicant_id) {
          throw new Error(
            "Applicant id is required.",
          );
        }

        setApplicationMutationLoading(
          true,
        );

        setApplicationMutationError("");

        try {
          const createdApplication =
            await service
              .createApplication({
                ...payload,

                admission_cycle_id:
                  selectedAdmissionCycleId,
              });

          await Promise.all([
            refreshApplications(),
            refreshDashboard(
              selectedAdmissionCycleId,
            ),
          ]);

          if (
            createdApplication?.id
          ) {
            setSelectedApplicationId(
              createdApplication.id,
            );
          }

          return createdApplication;
        } catch (mutationError) {
          setApplicationMutationError(
            getErrorMessage(
              mutationError,
              "Unable to create the admission application.",
            ),
          );

          throw mutationError;
        } finally {
          if (
            isMountedRef.current
          ) {
            setApplicationMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAdmissions,
        selectedAdmissionCycleId,
        refreshApplications,
        refreshDashboard,
      ],
    );

  const updateApplication =
    useCallback(
      async (
        applicationId,
        updates = {},
      ) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canEditAdmissions) {
          throw new Error(
            "You do not have permission to edit admission applications.",
          );
        }

        if (!applicationId) {
          throw new Error(
            "Application id is required.",
          );
        }

        setApplicationMutationLoading(
          true,
        );

        setApplicationMutationError("");

        try {
          const updatedApplication =
            await service
              .updateApplication(
                applicationId,
                updates,
              );

          await Promise.all([
            refreshApplications(),
            refreshDashboard(
              selectedAdmissionCycleId,
            ),
          ]);

          setSelectedApplicationId(
            updatedApplication?.id ||
              applicationId,
          );

          return updatedApplication;
        } catch (mutationError) {
          setApplicationMutationError(
            getErrorMessage(
              mutationError,
              "Unable to update the admission application.",
            ),
          );

          throw mutationError;
        } finally {
          if (
            isMountedRef.current
          ) {
            setApplicationMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAdmissions,
        selectedAdmissionCycleId,
        refreshApplications,
        refreshDashboard,
      ],
    );

  const selectApplication =
    useCallback(
      (applicationOrId) => {
        if (!applicationOrId) {
          setSelectedApplicationId(null);
          return;
        }

        if (
          typeof applicationOrId ===
          "string"
        ) {
          setSelectedApplicationId(
            applicationOrId,
          );
          return;
        }

        setSelectedApplicationId(
          applicationOrId.id || null,
        );
      },
      [],
    );

  const clearApplicationsError =
    useCallback(() => {
      setApplicationsError("");
    }, []);

  const clearApplicationMutationError =
    useCallback(() => {
      setApplicationMutationError("");
    }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAdmissions ||
      !selectedAdmissionCycleId
    ) {
      resetApplications();
      return;
    }

    refreshApplications();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,
    selectedAdmissionCycleId,
    applicationFilters,
    refreshApplications,
    resetApplications,
  ]);

  return useMemo(
    () => ({
      applications,
      applicationFilters,

      selectedApplicationId,
      selectedApplication,

      applicationsLoading,
      applicationsError,

      applicationMutationLoading,
      applicationMutationError,

      canCreateApplications:
        canCreateAdmissions,

      canEditApplications:
        canEditAdmissions,

      setApplicationFilters,
      resetApplicationFilters,

      refreshApplications,
      resetApplications,

      createApplication,
      updateApplication,

      selectApplication,

      clearApplicationsError,
      clearApplicationMutationError,
    }),
    [
      applications,
      applicationFilters,

      selectedApplicationId,
      selectedApplication,

      applicationsLoading,
      applicationsError,

      applicationMutationLoading,
      applicationMutationError,

      canCreateAdmissions,
      canEditAdmissions,

      setApplicationFilters,
      resetApplicationFilters,

      refreshApplications,
      resetApplications,

      createApplication,
      updateApplication,

      selectApplication,

      clearApplicationsError,
      clearApplicationMutationError,
    ],
  );
}