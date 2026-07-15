import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const EMPTY_INQUIRIES =
  Object.freeze({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    pageCount: 0,
  });

const DEFAULT_INQUIRY_FILTERS =
  Object.freeze({
    search: "",
    status: "",
    assignedTo: "",
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
      ...EMPTY_INQUIRIES,
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

export default function useInquiryState({
  service,
  mountedRef,

  workspaceReady,
  authorizationReady,

  canViewAdmissions,
  canCreateAdmissions,
  canEditAdmissions,

  selectedAdmissionCycleId,

  refreshDashboard,
}) {
  const inquiryRequestRef =
    useRef(0);

  const [
    inquiries,
    setInquiries,
  ] = useState(
    EMPTY_INQUIRIES,
  );

  const [
    inquiryFilters,
    setInquiryFiltersState,
  ] = useState({
    ...DEFAULT_INQUIRY_FILTERS,
  });

  const [
    selectedInquiryId,
    setSelectedInquiryId,
  ] = useState(null);

  const [
    inquiriesLoading,
    setInquiriesLoading,
  ] = useState(false);

  const [
    inquiriesError,
    setInquiriesError,
  ] = useState("");

  const [
    inquiryMutationLoading,
    setInquiryMutationLoading,
  ] = useState(false);

  const [
    inquiryMutationError,
    setInquiryMutationError,
  ] = useState("");

  const selectedInquiry =
    useMemo(
      () =>
        inquiries.items.find(
          (inquiry) =>
            inquiry.id ===
            selectedInquiryId,
        ) || null,
      [
        inquiries.items,
        selectedInquiryId,
      ],
    );

  const resetInquiries =
    useCallback(() => {
      inquiryRequestRef.current += 1;

      setInquiries(
        EMPTY_INQUIRIES,
      );

      setSelectedInquiryId(null);

      setInquiriesLoading(false);
      setInquiriesError("");

      setInquiryMutationLoading(
        false,
      );

      setInquiryMutationError("");
    }, []);

  const setInquiryFilters =
    useCallback(
      (
        nextFilters,
        {
          resetPage = true,
        } = {},
      ) => {
        setInquiryFiltersState(
          (currentFilters) => {
            const resolvedFilters =
              typeof nextFilters ===
              "function"
                ? nextFilters(
                    currentFilters,
                  )
                : nextFilters;

            const merged = {
              ...currentFilters,
              ...resolvedFilters,
            };

            if (
              resetPage &&
              resolvedFilters?.page ===
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

              assignedTo:
                normalizeFilterValue(
                  merged.assignedTo,
                ),
            };
          },
        );
      },
      [],
    );

  const resetInquiryFilters =
    useCallback(() => {
      setInquiryFiltersState({
        ...DEFAULT_INQUIRY_FILTERS,
      });
    }, []);

  const refreshInquiries =
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
          resetInquiries();
          return EMPTY_INQUIRIES;
        }

        const safeOverrides =
          filterOverrides &&
          typeof filterOverrides ===
            "object" &&
          !Array.isArray(
            filterOverrides,
          ) &&
          !("nativeEvent" in
            filterOverrides)
            ? filterOverrides
            : {};

        const resolvedFilters = {
          ...inquiryFilters,
          ...safeOverrides,

          admissionCycleId:
            selectedAdmissionCycleId,
        };

        const requestId =
          ++inquiryRequestRef.current;

        setInquiriesLoading(true);
        setInquiriesError("");

        try {
          const result =
            await service.getInquiries({
              admissionCycleId:
                selectedAdmissionCycleId,

              search:
                resolvedFilters.search ||
                undefined,

              status:
                resolvedFilters.status ||
                undefined,

              assignedTo:
                resolvedFilters
                  .assignedTo ||
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
            !mountedRef.current ||
            requestId !==
              inquiryRequestRef.current
          ) {
            return EMPTY_INQUIRIES;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters,
            );

          setInquiries(
            normalizedResult,
          );

          setSelectedInquiryId(
            (currentInquiryId) => {
              if (
                !currentInquiryId
              ) {
                return null;
              }

              const stillVisible =
                normalizedResult
                  .items
                  .some(
                    (inquiry) =>
                      inquiry.id ===
                      currentInquiryId,
                  );

              return stillVisible
                ? currentInquiryId
                : null;
            },
          );

          return normalizedResult;
        } catch (loadError) {
          if (
            !mountedRef.current ||
            requestId !==
              inquiryRequestRef.current
          ) {
            return EMPTY_INQUIRIES;
          }

          setInquiries(
            EMPTY_INQUIRIES,
          );

          setSelectedInquiryId(null);

          setInquiriesError(
            getErrorMessage(
              loadError,
              "Unable to load admission inquiries.",
            ),
          );

          return EMPTY_INQUIRIES;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              inquiryRequestRef.current
          ) {
            setInquiriesLoading(
              false,
            );
          }
        }
      },
      [
        service,
        mountedRef,
        workspaceReady,
        authorizationReady,
        canViewAdmissions,
        selectedAdmissionCycleId,
        inquiryFilters,
        resetInquiries,
      ],
    );

  const createInquiry =
    useCallback(
      async (payload = {}) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canCreateAdmissions) {
          throw new Error(
            "You do not have permission to create admission inquiries.",
          );
        }

        if (
          !selectedAdmissionCycleId
        ) {
          throw new Error(
            "Select an admission cycle before creating an inquiry.",
          );
        }

        setInquiryMutationLoading(
          true,
        );

        setInquiryMutationError("");

        try {
          const createdInquiry =
            await service
              .createInquiry({
                ...payload,

                admission_cycle_id:
                  selectedAdmissionCycleId,
              });

          await Promise.all([
            refreshInquiries(),
            refreshDashboard(
              selectedAdmissionCycleId,
            ),
          ]);

          if (
            createdInquiry?.id
          ) {
            setSelectedInquiryId(
              createdInquiry.id,
            );
          }

          return createdInquiry;
        } catch (mutationError) {
          setInquiryMutationError(
            getErrorMessage(
              mutationError,
              "Unable to create the admission inquiry.",
            ),
          );

          throw mutationError;
        } finally {
          if (
            mountedRef.current
          ) {
            setInquiryMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        mountedRef,
        canCreateAdmissions,
        selectedAdmissionCycleId,
        refreshInquiries,
        refreshDashboard,
      ],
    );

  const updateInquiry =
    useCallback(
      async (
        inquiryId,
        updates = {},
      ) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canEditAdmissions) {
          throw new Error(
            "You do not have permission to edit admission inquiries.",
          );
        }

        if (!inquiryId) {
          throw new Error(
            "Inquiry id is required.",
          );
        }

        setInquiryMutationLoading(
          true,
        );

        setInquiryMutationError("");

        try {
          const updatedInquiry =
            await service
              .updateInquiry(
                inquiryId,
                updates,
              );

          await Promise.all([
            refreshInquiries(),
            refreshDashboard(
              selectedAdmissionCycleId,
            ),
          ]);

          setSelectedInquiryId(
            updatedInquiry?.id ||
              inquiryId,
          );

          return updatedInquiry;
        } catch (mutationError) {
          setInquiryMutationError(
            getErrorMessage(
              mutationError,
              "Unable to update the admission inquiry.",
            ),
          );

          throw mutationError;
        } finally {
          if (
            mountedRef.current
          ) {
            setInquiryMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        mountedRef,
        canEditAdmissions,
        selectedAdmissionCycleId,
        refreshInquiries,
        refreshDashboard,
      ],
    );
  
  const convertInquiryToApplicant =
    useCallback(
      async (
        inquiryId,
        options = {},
      ) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!canEditAdmissions) {
          throw new Error(
            "You do not have permission to convert admission inquiries.",
          );
        }

        if (!inquiryId) {
          throw new Error(
            "Inquiry id is required.",
          );
        }

        setInquiryMutationLoading(true);
        setInquiryMutationError("");

        try {
          const result =
            await service.convertInquiryToApplicant(
              inquiryId,
              options,
            );

            await Promise.all([
              refreshInquiries(),
              refreshDashboard(
                selectedAdmissionCycleId,
            ),
          ]);

          setSelectedInquiryId(
            result?.inquiry?.id ??
              inquiryId,
          );

          return result;
        } catch (mutationError) {
          setInquiryMutationError(
            getErrorMessage(
              mutationError,
                "Unable to convert inquiry to applicant.",
            ),
          );

          throw mutationError;
        } finally {
          if (
            mountedRef.current
          ) {
            setInquiryMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        mountedRef,

        canEditAdmissions,

        selectedAdmissionCycleId,

        refreshInquiries,
        refreshDashboard,
      ],
    );  

  const selectInquiry =
    useCallback(
      (inquiryOrId) => {
        if (!inquiryOrId) {
          setSelectedInquiryId(
            null,
          );
          return;
        }

        if (
          typeof inquiryOrId ===
          "string"
        ) {
          setSelectedInquiryId(
            inquiryOrId,
          );
          return;
        }

        setSelectedInquiryId(
          inquiryOrId.id || null,
        );
      },
      [],
    );

  const clearInquiriesError =
    useCallback(() => {
      setInquiriesError("");
    }, []);

  const clearInquiryMutationError =
    useCallback(() => {
      setInquiryMutationError("");
    }, []);

  /*
   * Clear inquiry selection and return to page
   * one whenever the active admission cycle
   * changes.
   */
  useEffect(() => {
    setSelectedInquiryId(null);

    setInquiryFiltersState(
      (currentFilters) => ({
        ...currentFilters,
        page: 1,
      }),
    );
  }, [
    selectedAdmissionCycleId,
  ]);

  /*
   * Automatically load the inquiry queue when
   * scope, cycle, or filters change.
   */
  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAdmissions ||
      !selectedAdmissionCycleId
    ) {
      resetInquiries();
      return;
    }

    refreshInquiries();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,
    selectedAdmissionCycleId,
    refreshInquiries,
    resetInquiries,
  ]);

  const inquiryState =
    useMemo(
      () => ({
        inquiries,
        inquiryFilters,

        selectedInquiryId,
        selectedInquiry,

        inquiriesLoading,
        inquiriesError,

        inquiryMutationLoading,
        inquiryMutationError,

        canCreateInquiries:
          canCreateAdmissions,

        canEditInquiries:
          canEditAdmissions,

        refreshInquiries,

        createInquiry,
        updateInquiry,
        convertInquiryToApplicant,

        selectInquiry,
        setInquiryFilters,
        resetInquiryFilters,

        clearInquiriesError,
        clearInquiryMutationError,
      }),
      [
        inquiries,
        inquiryFilters,

        selectedInquiryId,
        selectedInquiry,

        inquiriesLoading,
        inquiriesError,

        inquiryMutationLoading,
        inquiryMutationError,

        canCreateAdmissions,
        canEditAdmissions,

        refreshInquiries,

        createInquiry,
        updateInquiry,

        selectInquiry,
        setInquiryFilters,
        resetInquiryFilters,

        clearInquiriesError,
        clearInquiryMutationError,
      ],
    );

  return inquiryState;
}