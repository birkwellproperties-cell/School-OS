import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const EMPTY_APPLICANTS =
  Object.freeze({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    pageCount: 0,
  });

const DEFAULT_APPLICANT_FILTERS =
  Object.freeze({
    search: "",
    status: "",
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
      ...EMPTY_APPLICANTS,

      page:
        fallbackFilters.page ||
        1,

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
        fallbackFilters.page ||
        1,

      pageSize:
        fallbackFilters.pageSize ||
        25,

      pageCount:
        result.length > 0
          ? 1
          : 0,
    };
  }

  return {
    items:
      Array.isArray(result.items)
        ? result.items
        : [],

    total:
      Number(result.total) ||
      0,

    page:
      Number(result.page) ||
      fallbackFilters.page ||
      1,

    pageSize:
      Number(result.pageSize) ||
      fallbackFilters.pageSize ||
      25,

    pageCount:
      Number(result.pageCount) ||
      0,
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

export default function useApplicantState({
  service,
  
  workspaceReady,
  authorizationReady,

  canViewAdmissions,
  canCreateAdmissions,
  canEditAdmissions,

  refreshDashboard,
}) {
  const applicantRequestRef =
    useRef(0);

  const isMountedRef =
    useRef(false);  

  const applicantFiltersRef =
    useRef({
      ...DEFAULT_APPLICANT_FILTERS,
    });

  const [
    applicants,
    setApplicants,
  ] = useState(
    EMPTY_APPLICANTS,
  );

  const [
    applicantFilters,
    setApplicantFiltersState,
  ] = useState({
    ...DEFAULT_APPLICANT_FILTERS,
  });

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      applicantRequestRef.current += 1;
    };
  }, []);

  const [
    selectedApplicantId,
    setSelectedApplicantId,
  ] = useState(null);

  const [
    applicantsLoading,
    setApplicantsLoading,
  ] = useState(false);

  const [
    applicantsError,
    setApplicantsError,
  ] = useState("");

  const [
    applicantMutationLoading,
    setApplicantMutationLoading,
  ] = useState(false);

  const [
    applicantMutationError,
    setApplicantMutationError,
  ] = useState("");

  useEffect(() => {
    applicantFiltersRef.current =
      applicantFilters;
  }, [
    applicantFilters,
  ]);

  const selectedApplicant =
    useMemo(
      () =>
        applicants.items.find(
          (applicant) =>
            applicant.id ===
            selectedApplicantId,
        ) || null,
      [
        applicants.items,
        selectedApplicantId,
      ],
    );

  const resetApplicants =
    useCallback(() => {
      applicantRequestRef.current +=
        1;

      setApplicants(
        EMPTY_APPLICANTS,
      );

      setSelectedApplicantId(null);

      setApplicantsLoading(false);
      setApplicantsError("");

      setApplicantMutationLoading(
        false,
      );

      setApplicantMutationError("");
    }, []);

  const setApplicantFilters =
    useCallback(
      (
        nextFilters,
        {
          resetPage = true,
        } = {},
      ) => {
        setApplicantFiltersState(
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
            };
          },
        );
      },
      [],
    );

  const resetApplicantFilters =
    useCallback(() => {
      setApplicantFiltersState({
        ...DEFAULT_APPLICANT_FILTERS,
      });
    }, []);

  const refreshApplicants =
    useCallback(
      async (
        filterOverrides = {},
      ) => {
        if (
          !service ||
          !workspaceReady ||
          !authorizationReady ||
          !canViewAdmissions
        ) {
          resetApplicants();
          return EMPTY_APPLICANTS;
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
          ...applicantFiltersRef.current,
          ...safeOverrides,
        };

        const requestId =
          ++applicantRequestRef.current;

        setApplicantsLoading(true);
        setApplicantsError("");

        try {
          const result =
            await service
              .getApplicants({
                search:
                  resolvedFilters
                    .search ||
                  undefined,

                status:
                  resolvedFilters
                    .status ||
                  undefined,

                priority:
                  resolvedFilters.priority ||
                  undefined,  

                page:
                  resolvedFilters.page,

                pageSize:
                  resolvedFilters
                    .pageSize,

                sortBy:
                  resolvedFilters
                    .sortBy,

                ascending:
                  resolvedFilters
                    .ascending,
              });

          if (
            !isMountedRef.current ||
            requestId !==
              applicantRequestRef.current
          ) {
            return EMPTY_APPLICANTS;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters,
            );

          setApplicants(
            normalizedResult,
          );

          setSelectedApplicantId(
            (currentApplicantId) => {
              if (
                !currentApplicantId
              ) {
                return null;
              }

              const stillVisible =
                normalizedResult
                  .items
                  .some(
                    (applicant) =>
                      applicant.id ===
                      currentApplicantId,
                  );

              return stillVisible
                ? currentApplicantId
                : null;
            },
          );

          return normalizedResult;
        } catch (loadError) {
          if (
            !isMountedRef.current ||
            requestId !==
              applicantRequestRef.current
          ) {
            return EMPTY_APPLICANTS;
          }

          setApplicants(
            EMPTY_APPLICANTS,
          );

          setSelectedApplicantId(null);

          setApplicantsError(
            getErrorMessage(
              loadError,
              "Unable to load applicants.",
            ),
          );

          return EMPTY_APPLICANTS;
        } finally {
          if (
            isMountedRef.current &&
            requestId ===
              applicantRequestRef.current
          ) {
            setApplicantsLoading(
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
        resetApplicants,
      ],
    );

  const createApplicant =
    useCallback(
      async (payload = {}) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canCreateAdmissions) {
          throw new Error(
            "You do not have permission to create applicants.",
          );
        }

        setApplicantMutationLoading(
          true,
        );

        setApplicantMutationError("");

        try {
          const createdApplicant =
            await service
              .createApplicant(
                payload,
              );

          await Promise.all([
            refreshApplicants(),
            refreshDashboard(),
          ]);

          if (
            createdApplicant?.id
          ) {
            setSelectedApplicantId(
              createdApplicant.id,
            );
          }

          return createdApplicant;
        } catch (mutationError) {
          setApplicantMutationError(
            getErrorMessage(
              mutationError,
              "Unable to create the applicant.",
            ),
          );

          throw mutationError;
        } finally {
          if (
            isMountedRef.current
          ) {
            setApplicantMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAdmissions,
        refreshApplicants,
        refreshDashboard,
      ],
    );

  const updateApplicant =
    useCallback(
      async (
        applicantId,
        updates = {},
      ) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canEditAdmissions) {
          throw new Error(
            "You do not have permission to edit applicants.",
          );
        }

        if (!applicantId) {
          throw new Error(
            "Applicant id is required.",
          );
        }

        setApplicantMutationLoading(
          true,
        );

        setApplicantMutationError("");

        try {
          const updatedApplicant =
            await service
              .updateApplicant(
                applicantId,
                updates,
              );

          await Promise.all([
            refreshApplicants(),
            refreshDashboard(),
          ]);

          setSelectedApplicantId(
            updatedApplicant?.id ||
              applicantId,
          );

          return updatedApplicant;
        } catch (mutationError) {
          setApplicantMutationError(
            getErrorMessage(
              mutationError,
              "Unable to update the applicant.",
            ),
          );

          throw mutationError;
        } finally {
          if (
            isMountedRef.current
          ) {
            setApplicantMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAdmissions,
        refreshApplicants,
        refreshDashboard,
      ],
    );

  const selectApplicant =
    useCallback(
      (applicantOrId) => {
        if (!applicantOrId) {
          setSelectedApplicantId(
            null,
          );
          return;
        }

        if (
          typeof applicantOrId ===
          "string"
        ) {
          setSelectedApplicantId(
            applicantOrId,
          );
          return;
        }

        setSelectedApplicantId(
          applicantOrId.id || null,
        );
      },
      [],
    );

  const clearApplicantsError =
    useCallback(() => {
      setApplicantsError("");
    }, []);

  const clearApplicantMutationError =
    useCallback(() => {
      setApplicantMutationError("");
    }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAdmissions
    ) {
      resetApplicants();
      return;
    }

    refreshApplicants(
      applicantFilters,
    );
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,

    applicantFilters.search,
    applicantFilters.status,
    applicantFilters.page,
    applicantFilters.pageSize,
    applicantFilters.sortBy,
    applicantFilters.ascending,

    refreshApplicants,
    resetApplicants,
  ]);

  return useMemo(
    () => ({
      applicants,
      applicantFilters,

      selectedApplicantId,
      selectedApplicant,

      applicantsLoading,
      applicantsError,

      applicantMutationLoading,
      applicantMutationError,

      canCreateApplicants:
        canCreateAdmissions,

      canEditApplicants:
        canEditAdmissions,

      refreshApplicants,

      createApplicant,
      updateApplicant,

      selectApplicant,
      setApplicantFilters,
      resetApplicantFilters,

      clearApplicantsError,
      clearApplicantMutationError,
    }),
    [
      applicants,
      applicantFilters,

      selectedApplicantId,
      selectedApplicant,

      applicantsLoading,
      applicantsError,

      applicantMutationLoading,
      applicantMutationError,

      canCreateAdmissions,
      canEditAdmissions,

      refreshApplicants,

      createApplicant,
      updateApplicant,

      selectApplicant,
      setApplicantFilters,
      resetApplicantFilters,

      clearApplicantsError,
      clearApplicantMutationError,
    ],
  );
}
