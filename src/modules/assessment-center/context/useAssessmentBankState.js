import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_PAGE_SIZE = 25;

const DEFAULT_FILTERS =
  Object.freeze({
    search: "",
    status: "",
    ownerId: "",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: "name",
    sortDirection: "asc",
  });

const EMPTY_PAGED_RESULT =
  Object.freeze({
    items: [],
    data: [],
    count: 0,
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  });

function getErrorMessage(
  error,
  fallbackMessage,
) {
  if (
    typeof error?.message ===
      "string" &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return fallbackMessage;
}

function normalizePagedResult(
  result,
  fallbackPage = 1,
  fallbackPageSize =
    DEFAULT_PAGE_SIZE,
) {
  const items =
    Array.isArray(result?.items)
      ? result.items
      : Array.isArray(result?.data)
        ? result.data
        : [];

  const total =
    Number.isFinite(result?.total)
      ? result.total
      : Number.isFinite(result?.count)
        ? result.count
        : items.length;

  const page =
    Number.isInteger(result?.page)
      ? result.page
      : fallbackPage;

  const pageSize =
    Number.isInteger(result?.pageSize)
      ? result.pageSize
      : fallbackPageSize;

  const totalPages =
    pageSize > 0
      ? Math.ceil(
          total / pageSize,
        )
      : 0;

  return {
    items,
    data: items,
    count: total,
    total,
    page,
    pageSize,
    totalPages,
  };
}

function normalizeFilters(
  filters = {},
) {
  return {
    search:
      typeof filters.search ===
      "string"
        ? filters.search
        : "",

    status:
      typeof filters.status ===
      "string"
        ? filters.status
        : "",

    ownerId:
      typeof filters.ownerId ===
      "string"
        ? filters.ownerId
        : "",

    page:
      Number.isInteger(
        filters.page,
      ) &&
      filters.page > 0
        ? filters.page
        : 1,

    pageSize:
      Number.isInteger(
        filters.pageSize,
      ) &&
      filters.pageSize > 0
        ? filters.pageSize
        : DEFAULT_PAGE_SIZE,

    sortBy:
      typeof filters.sortBy ===
        "string" &&
      filters.sortBy.trim()
        ? filters.sortBy.trim()
        : "name",

    sortDirection:
      filters.sortDirection ===
      "desc"
        ? "desc"
        : "asc",
  };
}

function createServiceFilters(
  filters,
) {
  const normalized =
    normalizeFilters(
      filters,
    );

  return {
    search:
      normalized.search ||
      undefined,

    status:
      normalized.status ||
      undefined,

    ownerId:
      normalized.ownerId ||
      undefined,

    page:
      normalized.page,

    pageSize:
      normalized.pageSize,

    sortBy:
      normalized.sortBy,

    sortDirection:
      normalized.sortDirection,
  };
}

export function useAssessmentBankState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAssessments,
  canCreateAssessments,
  canEditAssessments,
} = {}) {
  const mountedRef =
    useRef(true);

  const requestRef =
    useRef(0);

  const [
    assessmentBanksResult,
    setAssessmentBanksResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    assessmentBankFilters,
    setAssessmentBankFiltersState,
  ] = useState(
    DEFAULT_FILTERS,
  );

  const [
    assessmentBanksLoading,
    setAssessmentBanksLoading,
  ] = useState(false);

  const [
    assessmentBanksError,
    setAssessmentBanksError,
  ] = useState("");

  const [
    assessmentBankMutationLoading,
    setAssessmentBankMutationLoading,
  ] = useState(false);

  const [
    assessmentBankMutationError,
    setAssessmentBankMutationError,
  ] = useState("");

  const [
    selectedAssessmentBankId,
    setSelectedAssessmentBankId,
  ] = useState(null);

  const assessmentBanks =
    useMemo(
      () =>
        assessmentBanksResult.items,
      [
        assessmentBanksResult,
      ],
    );

  const selectedAssessmentBank =
    useMemo(
      () =>
        assessmentBanks.find(
          (bank) =>
            bank.id ===
            selectedAssessmentBankId,
        ) || null,
      [
        assessmentBanks,
        selectedAssessmentBankId,
      ],
    );

  const assessmentBanksReady =
    workspaceReady &&
    authorizationReady &&
    canViewAssessments &&
    Boolean(service) &&
    !assessmentBanksLoading &&
    !assessmentBanksError;

  const resetAssessmentBanks =
    useCallback(() => {
      requestRef.current += 1;

      setAssessmentBanksResult(
        EMPTY_PAGED_RESULT,
      );

      setAssessmentBanksLoading(
        false,
      );

      setAssessmentBanksError(
        "",
      );

      setAssessmentBankMutationLoading(
        false,
      );

      setAssessmentBankMutationError(
        "",
      );

      setSelectedAssessmentBankId(
        null,
      );
    }, []);

  const setAssessmentBankFilters =
    useCallback(
      (
        nextFilters,
      ) => {
        setAssessmentBankFiltersState(
          (currentFilters) => {
            const resolvedFilters =
              typeof nextFilters ===
              "function"
                ? nextFilters(
                    currentFilters,
                  )
                : nextFilters;

            return normalizeFilters({
              ...currentFilters,
              ...resolvedFilters,
            });
          },
        );
      },
      [],
    );

  const updateAssessmentBankFilters =
    useCallback(
      (
        updates = {},
      ) => {
        setAssessmentBankFiltersState(
          (currentFilters) =>
            normalizeFilters({
              ...currentFilters,
              ...updates,

              page:
                updates.page ??
                (
                  updates.search !==
                    undefined ||
                  updates.status !==
                    undefined ||
                  updates.ownerId !==
                    undefined ||
                  updates.pageSize !==
                    undefined ||
                  updates.sortBy !==
                    undefined ||
                  updates.sortDirection !==
                    undefined
                )
                  ? 1
                  : currentFilters.page,
            }),
        );
      },
      [],
    );

  const resetAssessmentBankFilters =
    useCallback(() => {
      setAssessmentBankFiltersState(
        DEFAULT_FILTERS,
      );
    }, []);

  const selectAssessmentBank =
    useCallback(
      (
        assessmentBankId,
      ) => {
        setSelectedAssessmentBankId(
          assessmentBankId ||
          null,
        );
      },
      [],
    );

  const refreshAssessmentBanks =
    useCallback(
      async (
        filtersOverride = null,
      ) => {
        if (
          !service ||
          !workspaceReady ||
          !authorizationReady ||
          !canViewAssessments
        ) {
          resetAssessmentBanks();
          return EMPTY_PAGED_RESULT;
        }

        const resolvedFilters =
          normalizeFilters({
            ...assessmentBankFilters,
            ...(filtersOverride ||
              {}),
          });

        const requestId =
          ++requestRef.current;

        setAssessmentBanksLoading(
          true,
        );

        setAssessmentBanksError(
          "",
        );

        try {
          const result =
            await service
              .getAssessmentBanks(
                createServiceFilters(
                  resolvedFilters,
                ),
              );

          if (
            !mountedRef.current ||
            requestId !==
              requestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters.page,
              resolvedFilters.pageSize,
            );

          setAssessmentBanksResult(
            normalizedResult,
          );

          setSelectedAssessmentBankId(
            (
              currentBankId,
            ) => {
              if (
                currentBankId &&
                normalizedResult.items.some(
                  (bank) =>
                    bank.id ===
                    currentBankId,
                )
              ) {
                return currentBankId;
              }

              return null;
            },
          );

          return normalizedResult;
        } catch (error) {
          if (
            !mountedRef.current ||
            requestId !==
              requestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          setAssessmentBanksResult(
            EMPTY_PAGED_RESULT,
          );

          setSelectedAssessmentBankId(
            null,
          );

          setAssessmentBanksError(
            getErrorMessage(
              error,
              "Unable to load assessment banks.",
            ),
          );

          return EMPTY_PAGED_RESULT;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              requestRef.current
          ) {
            setAssessmentBanksLoading(
              false,
            );
          }
        }
      },
      [
        service,
        workspaceReady,
        authorizationReady,
        canViewAssessments,
        assessmentBankFilters,
        resetAssessmentBanks,
      ],
    );

  const createAssessmentBank =
    useCallback(
      async (
        payload = {},
      ) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (
          !canCreateAssessments
        ) {
          throw new Error(
            "You do not have permission to create assessment banks.",
          );
        }

        setAssessmentBankMutationLoading(
          true,
        );

        setAssessmentBankMutationError(
          "",
        );

        try {
          const createdBank =
            await service
              .createAssessmentBank(
                payload,
              );

          await refreshAssessmentBanks();

          if (
            createdBank?.id
          ) {
            setSelectedAssessmentBankId(
              createdBank.id,
            );
          }

          return createdBank;
        } catch (error) {
          setAssessmentBankMutationError(
            getErrorMessage(
              error,
              "Unable to create the assessment bank.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setAssessmentBankMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAssessments,
        refreshAssessmentBanks,
      ],
    );

  const updateAssessmentBank =
    useCallback(
      async (
        assessmentBankId,
        updates = {},
      ) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (
          !canEditAssessments
        ) {
          throw new Error(
            "You do not have permission to edit assessment banks.",
          );
        }

        if (
          !assessmentBankId
        ) {
          throw new Error(
            "Assessment bank id is required.",
          );
        }

        setAssessmentBankMutationLoading(
          true,
        );

        setAssessmentBankMutationError(
          "",
        );

        try {
          const updatedBank =
            await service
              .updateAssessmentBank(
                assessmentBankId,
                updates,
              );

          await refreshAssessmentBanks();

          return updatedBank;
        } catch (error) {
          setAssessmentBankMutationError(
            getErrorMessage(
              error,
              "Unable to update the assessment bank.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setAssessmentBankMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        refreshAssessmentBanks,
      ],
    );

  const deleteAssessmentBank =
    useCallback(
      async (
        assessmentBankId,
        deletedBy = null,
      ) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (
          !canEditAssessments
        ) {
          throw new Error(
            "You do not have permission to delete assessment banks.",
          );
        }

        if (
          !assessmentBankId
        ) {
          throw new Error(
            "Assessment bank id is required.",
          );
        }

        setAssessmentBankMutationLoading(
          true,
        );

        setAssessmentBankMutationError(
          "",
        );

        try {
          const deletedBank =
            await service
              .deleteAssessmentBank(
                assessmentBankId,
                deletedBy,
              );

          if (
            selectedAssessmentBankId ===
            assessmentBankId
          ) {
            setSelectedAssessmentBankId(
              null,
            );
          }

          await refreshAssessmentBanks();

          return deletedBank;
        } catch (error) {
          setAssessmentBankMutationError(
            getErrorMessage(
              error,
              "Unable to delete the assessment bank.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setAssessmentBankMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        selectedAssessmentBankId,
        refreshAssessmentBanks,
      ],
    );

  const clearAssessmentBanksError =
    useCallback(() => {
      setAssessmentBanksError(
        "",
      );
    }, []);

  const clearAssessmentBankMutationError =
    useCallback(() => {
      setAssessmentBankMutationError(
        "",
      );
    }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAssessments
    ) {
      resetAssessmentBanks();
    }
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    resetAssessmentBanks,
  ]);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAssessments
    ) {
      return;
    }

    refreshAssessmentBanks();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    assessmentBankFilters,
    refreshAssessmentBanks,
  ]);

  return useMemo(
    () => ({
      assessmentBanks,
      assessmentBanksResult,

      assessmentBankFilters,
      setAssessmentBankFilters,
      updateAssessmentBankFilters,
      resetAssessmentBankFilters,

      assessmentBanksLoading,
      assessmentBanksError,
      assessmentBanksReady,

      assessmentBankMutationLoading,
      assessmentBankMutationError,

      selectedAssessmentBankId,
      selectedAssessmentBank,
      selectAssessmentBank,

      refreshAssessmentBanks,

      createAssessmentBank,
      updateAssessmentBank,
      deleteAssessmentBank,

      clearAssessmentBanksError,
      clearAssessmentBankMutationError,
    }),
    [
      assessmentBanks,
      assessmentBanksResult,

      assessmentBankFilters,
      setAssessmentBankFilters,
      updateAssessmentBankFilters,
      resetAssessmentBankFilters,

      assessmentBanksLoading,
      assessmentBanksError,
      assessmentBanksReady,

      assessmentBankMutationLoading,
      assessmentBankMutationError,

      selectedAssessmentBankId,
      selectedAssessmentBank,
      selectAssessmentBank,

      refreshAssessmentBanks,

      createAssessmentBank,
      updateAssessmentBank,
      deleteAssessmentBank,

      clearAssessmentBanksError,
      clearAssessmentBankMutationError,
    ],
  );
}

export default useAssessmentBankState;