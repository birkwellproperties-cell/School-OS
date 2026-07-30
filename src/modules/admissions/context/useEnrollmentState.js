import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const EMPTY_ENROLLMENT_CONVERSIONS =
  Object.freeze({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    pageCount: 0,
  });

const DEFAULT_ENROLLMENT_FILTERS =
  Object.freeze({
    search: "",
    status: "",
    applicationId: "",
    applicantId: "",
    decisionId: "",
    offerId: "",
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
      ...EMPTY_ENROLLMENT_CONVERSIONS,

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

function isSafeFilterOverrides(
  value,
) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !("nativeEvent" in value),
  );
}

export default function useEnrollmentState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAdmissions,
  canCreateAdmissions,
  canEditAdmissions,

  currentUserId,
  selectedAdmissionCycleId,

  refreshApplications,
  refreshApplicants,
  refreshOffers,
  refreshDashboard,
}) {
  const enrollmentRequestRef =
    useRef(0);

  const isMountedRef =
    useRef(true);

  const enrollmentFiltersRef =
    useRef({
      ...DEFAULT_ENROLLMENT_FILTERS,
    });

  const [
    enrollmentConversions,
    setEnrollmentConversions,
  ] = useState(
    EMPTY_ENROLLMENT_CONVERSIONS,
  );

  const [
    enrollmentFilters,
    setEnrollmentFiltersState,
  ] = useState({
    ...DEFAULT_ENROLLMENT_FILTERS,
  });

  const [
    selectedEnrollmentConversionId,
    setSelectedEnrollmentConversionId,
  ] = useState(null);

  const [
    enrollmentConversionsLoading,
    setEnrollmentConversionsLoading,
  ] = useState(false);

  const [
    enrollmentConversionsError,
    setEnrollmentConversionsError,
  ] = useState("");

  const [
    enrollmentMutationLoading,
    setEnrollmentMutationLoading,
  ] = useState(false);

  const [
    enrollmentMutationError,
    setEnrollmentMutationError,
  ] = useState("");

  const [
    lastEnrollmentAction,
    setLastEnrollmentAction,
  ] = useState(null);

  const selectedEnrollmentConversion =
    useMemo(
      () =>
        enrollmentConversions.items.find(
          (conversion) =>
            conversion.id ===
            selectedEnrollmentConversionId,
        ) || null,
      [
        enrollmentConversions.items,
        selectedEnrollmentConversionId,
      ],
    );

  const resetEnrollmentConversions =
    useCallback(() => {
      enrollmentRequestRef.current +=
        1;

      enrollmentFiltersRef.current = {
        ...DEFAULT_ENROLLMENT_FILTERS,
      };

      setEnrollmentConversions(
        EMPTY_ENROLLMENT_CONVERSIONS,
      );

      setEnrollmentFiltersState({
        ...DEFAULT_ENROLLMENT_FILTERS,
      });

      setSelectedEnrollmentConversionId(
        null,
      );

      setEnrollmentConversionsLoading(
        false,
      );

      setEnrollmentConversionsError("");

      setEnrollmentMutationLoading(
        false,
      );

      setEnrollmentMutationError("");

      setLastEnrollmentAction(null);
    }, []);

  const setEnrollmentFilters =
    useCallback(
      (overrides = {}) => {
        if (
          !isSafeFilterOverrides(
            overrides,
          )
        ) {
          return;
        }

        setEnrollmentFiltersState(
          (currentFilters) => {
            const nextFilters = {
              ...currentFilters,
            };

            Object.entries(
              overrides,
            ).forEach(
              ([
                key,
                value,
              ]) => {
                nextFilters[key] =
                  normalizeFilterValue(
                    value,
                  );
              },
            );

            if (
              !Object.prototype
                .hasOwnProperty.call(
                  overrides,
                  "page",
                )
            ) {
              nextFilters.page = 1;
            }

            enrollmentFiltersRef.current =
              nextFilters;

            return nextFilters;
          },
        );
      },
      [],
    );

  const resetEnrollmentFilters =
    useCallback(() => {
      const nextFilters = {
        ...DEFAULT_ENROLLMENT_FILTERS,
      };

      enrollmentFiltersRef.current =
        nextFilters;

      setEnrollmentFiltersState(
        nextFilters,
      );
    }, []);

  const refreshEnrollmentConversions =
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
          resetEnrollmentConversions();

          return (
            EMPTY_ENROLLMENT_CONVERSIONS
          );
        }

        const safeOverrides =
          isSafeFilterOverrides(
            filterOverrides,
          )
            ? filterOverrides
            : {};

        const nextFilters = {
          ...enrollmentFiltersRef.current,
          ...safeOverrides,

          admissionCycleId:
            safeOverrides
              .admissionCycleId ??
            selectedAdmissionCycleId ??
            undefined,
        };

        enrollmentFiltersRef.current =
          nextFilters;

        setEnrollmentFiltersState(
          (currentFilters) => ({
            ...currentFilters,
            ...safeOverrides,
          }),
        );

        const requestId =
          enrollmentRequestRef.current +
          1;

        enrollmentRequestRef.current =
          requestId;

        setEnrollmentConversionsLoading(
          true,
        );

        setEnrollmentConversionsError("");

        try {
          const result =
            await service
              .getEnrollmentConversions(
                nextFilters,
              );

          if (
            !isMountedRef.current ||
            enrollmentRequestRef.current !==
              requestId
          ) {
            return result;
          }

          const normalized =
            normalizePagedResult(
              result,
              nextFilters,
            );

          setEnrollmentConversions(
            normalized,
          );

          setSelectedEnrollmentConversionId(
            (currentId) => {
              if (
                currentId &&
                normalized.items.some(
                  (item) =>
                    item.id ===
                    currentId,
                )
              ) {
                return currentId;
              }

              return (
                normalized.items[0]
                  ?.id ||
                null
              );
            },
          );

          return normalized;
        } catch (error) {
          if (
            isMountedRef.current &&
            enrollmentRequestRef.current ===
              requestId
          ) {
            setEnrollmentConversionsError(
              getErrorMessage(
                error,
                "Unable to load enrollment conversions.",
              ),
            );
          }

          throw error;
        } finally {
          if (
            isMountedRef.current &&
            enrollmentRequestRef.current ===
              requestId
          ) {
            setEnrollmentConversionsLoading(
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
        resetEnrollmentConversions,
      ],
    );

  const refreshEnrollmentConversion =
    useCallback(
      async (conversionId) => {
        if (
          !service ||
          !conversionId
        ) {
          return null;
        }

        const conversion =
          await service
            .getEnrollmentConversion(
              conversionId,
            );

        if (
          !conversion ||
          !isMountedRef.current
        ) {
          return conversion;
        }

        setEnrollmentConversions(
          (currentResult) => {
            const exists =
              currentResult.items.some(
                (item) =>
                  item.id ===
                  conversion.id,
              );

            return {
              ...currentResult,

              items: exists
                ? currentResult.items.map(
                    (item) =>
                      item.id ===
                      conversion.id
                        ? conversion
                        : item,
                  )
                : [
                    conversion,
                    ...currentResult.items,
                  ],

              total: exists
                ? currentResult.total
                : currentResult.total +
                  1,
            };
          },
        );

        setSelectedEnrollmentConversionId(
          conversion.id,
        );

        return conversion;
      },
      [
        service,
      ],
    );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current =
        false;

      enrollmentRequestRef.current +=
        1;
    };
  }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAdmissions
    ) {
      resetEnrollmentConversions();

      return;
    }

    refreshEnrollmentConversions()
      .catch(() => {
        // Error state is maintained
        // by the refresh method.
      });
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,
    selectedAdmissionCycleId,
    refreshEnrollmentConversions,
    resetEnrollmentConversions,
  ]);

  const upsertEnrollmentConversion =
    useCallback(
      (conversion) => {
        if (
          !conversion ||
          !conversion.id
        ) {
          return;
        }

        setEnrollmentConversions(
          (currentResult) => {
            const exists =
              currentResult.items.some(
                (item) =>
                  item.id ===
                  conversion.id,
              );

            return {
              ...currentResult,

              items: exists
                ? currentResult.items.map(
                    (item) =>
                      item.id ===
                      conversion.id
                        ? conversion
                        : item,
                  )
                : [
                    conversion,
                    ...currentResult.items,
                  ],

              total: exists
                ? currentResult.total
                : currentResult.total +
                  1,
            };
          },
        );

        setSelectedEnrollmentConversionId(
          conversion.id,
        );
      },
      [],
    );

  const refreshEnrollmentDependencies =
    useCallback(
      async ({
        refreshEnrollmentList = true,
        refreshApplicationList = true,
        refreshApplicantList = true,
        refreshOfferList = true,
        refreshDashboardSnapshot = true,
      } = {}) => {
        const tasks = [];

        if (refreshEnrollmentList) {
          tasks.push(
            refreshEnrollmentConversions(),
          );
        }

        if (
          refreshApplicationList &&
          typeof refreshApplications ===
            "function"
        ) {
          tasks.push(
            refreshApplications(),
          );
        }

        if (
          refreshApplicantList &&
          typeof refreshApplicants ===
            "function"
        ) {
          tasks.push(
            refreshApplicants(),
          );
        }

        if (
          refreshOfferList &&
          typeof refreshOffers ===
            "function"
        ) {
          tasks.push(
            refreshOffers(),
          );
        }

        if (
          refreshDashboardSnapshot &&
          typeof refreshDashboard ===
            "function"
        ) {
          tasks.push(
            refreshDashboard(),
          );
        }

        if (tasks.length === 0) {
          return [];
        }

        return Promise.allSettled(
          tasks,
        );
      },
      [
        refreshEnrollmentConversions,
        refreshApplications,
        refreshApplicants,
        refreshOffers,
        refreshDashboard,
      ],
    );

  const runEnrollmentMutation =
    useCallback(
      async ({
        actionName,
        fallbackMessage,
        operation,

        refreshEnrollmentList = true,
        refreshApplicationList = true,
        refreshApplicantList = true,
        refreshOfferList = true,
        refreshDashboardSnapshot = true,
      }) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (
          typeof operation !==
          "function"
        ) {
          throw new Error(
            "Enrollment operation is not available.",
          );
        }

        setEnrollmentMutationLoading(
          true,
        );

        setEnrollmentMutationError("");

        setLastEnrollmentAction(
          actionName,
        );

        try {
          const result =
            await operation();

          if (
            isMountedRef.current
          ) {
            upsertEnrollmentConversion(
              result,
            );
          }

          await refreshEnrollmentDependencies({
            refreshEnrollmentList,
            refreshApplicationList,
            refreshApplicantList,
            refreshOfferList,
            refreshDashboardSnapshot,
          });

          return result;
        } catch (error) {
          if (
            isMountedRef.current
          ) {
            setEnrollmentMutationError(
              getErrorMessage(
                error,
                fallbackMessage,
              ),
            );
          }

          throw error;
        } finally {
          if (
            isMountedRef.current
          ) {
            setEnrollmentMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        upsertEnrollmentConversion,
        refreshEnrollmentDependencies,
      ],
    );

  const assertCanCreateEnrollment =
    useCallback(() => {
      if (!canCreateAdmissions) {
        throw new Error(
          "You do not have permission to create enrollment conversions.",
        );
      }
    }, [
      canCreateAdmissions,
    ]);

  const assertCanEditEnrollment =
    useCallback(() => {
      if (!canEditAdmissions) {
        throw new Error(
          "You do not have permission to manage enrollment conversions.",
        );
      }
    }, [
      canEditAdmissions,
    ]);

  const requireCurrentUserId =
    useCallback(
      (
        fallbackMessage =
          "The authenticated user id is required.",
      ) => {
        if (!currentUserId) {
          throw new Error(
            fallbackMessage,
          );
        }

        return currentUserId;
      },
      [
        currentUserId,
      ],
    );

  const createEnrollmentConversion =
    useCallback(
      async (payload = {}) => {
        assertCanCreateEnrollment();

        const actorId =
          payload.requested_by ||
          requireCurrentUserId(
            "The enrollment requester id is required.",
          );

        return runEnrollmentMutation({
          actionName:
            "create",

          fallbackMessage:
            "Unable to create the enrollment conversion.",

          operation: () =>
            service
              .createEnrollmentConversion({
                ...payload,

                requested_by:
                  actorId,
              }),
        });
      },
      [
        service,
        assertCanCreateEnrollment,
        requireCurrentUserId,
        runEnrollmentMutation,
      ],
    );

  const updateEnrollmentConversion =
    useCallback(
      async (
        conversionId,
        updates = {},
      ) => {
        assertCanEditEnrollment();

        if (!conversionId) {
          throw new Error(
            "Enrollment conversion id is required.",
          );
        }

        const actorId =
          updates.actorId ||
          requireCurrentUserId();

        return runEnrollmentMutation({
          actionName:
            "update",

          fallbackMessage:
            "Unable to update the enrollment conversion.",

          operation: () =>
            service
              .updateEnrollmentConversion(
                conversionId,
                {
                  ...updates,
                  actorId,
                },
              ),
        });
      },
      [
        service,
        assertCanEditEnrollment,
        requireCurrentUserId,
        runEnrollmentMutation,
      ],
    );

  const validateEnrollmentConversion =
    useCallback(
      async (conversionId) => {
        assertCanEditEnrollment();

        if (!conversionId) {
          throw new Error(
            "Enrollment conversion id is required.",
          );
        }

        const actorId =
          requireCurrentUserId(
            "The enrollment validator id is required.",
          );

        return runEnrollmentMutation({
          actionName:
            "validate",

          fallbackMessage:
            "Unable to validate the enrollment conversion.",

          operation: () =>
            service
              .validateEnrollmentConversion(
                conversionId,
                {
                  actorId,
                },
              ),
        });
      },
      [
        service,
        assertCanEditEnrollment,
        requireCurrentUserId,
        runEnrollmentMutation,
      ],
    );

  const markEnrollmentReady =
    useCallback(
      async (conversionId) => {
        assertCanEditEnrollment();

        if (!conversionId) {
          throw new Error(
            "Enrollment conversion id is required.",
          );
        }

        const actorId =
          requireCurrentUserId();

        return runEnrollmentMutation({
          actionName:
            "mark_ready",

          fallbackMessage:
            "Unable to mark the enrollment conversion ready.",

          operation: () =>
            service
              .markEnrollmentReady(
                conversionId,
                {
                  actorId,
                },
              ),
        });
      },
      [
        service,
        assertCanEditEnrollment,
        requireCurrentUserId,
        runEnrollmentMutation,
      ],
    );

  const startEnrollmentProcessing =
    useCallback(
      async (conversionId) => {
        assertCanEditEnrollment();

        if (!conversionId) {
          throw new Error(
            "Enrollment conversion id is required.",
          );
        }

        const actorId =
          requireCurrentUserId();

        return runEnrollmentMutation({
          actionName:
            "start_processing",

          fallbackMessage:
            "Unable to start enrollment processing.",

          operation: () =>
            service
              .startEnrollmentProcessing(
                conversionId,
                {
                  actorId,
                },
              ),
        });
      },
      [
        service,
        assertCanEditEnrollment,
        requireCurrentUserId,
        runEnrollmentMutation,
      ],
    );

  const completeEnrollmentConversion =
    useCallback(
      async (
        conversionId,
        {
          studentId,
          enrollmentId,
        } = {},
      ) => {
        assertCanEditEnrollment();

        if (!conversionId) {
          throw new Error(
            "Enrollment conversion id is required.",
          );
        }

        const actorId =
          requireCurrentUserId();

        return runEnrollmentMutation({
          actionName:
            "complete",

          fallbackMessage:
            "Unable to complete the enrollment conversion.",

          operation: () =>
            service
              .completeEnrollmentConversion(
                conversionId,
                {
                  actorId,
                  studentId,
                  enrollmentId,
                },
              ),
        });
      },
      [
        service,
        assertCanEditEnrollment,
        requireCurrentUserId,
        runEnrollmentMutation,
      ],
    );

  const failEnrollmentConversion =
    useCallback(
      async (
        conversionId,
        {
          failureReason,
          validationErrors = [],
        } = {},
      ) => {
        assertCanEditEnrollment();

        if (!conversionId) {
          throw new Error(
            "Enrollment conversion id is required.",
          );
        }

        const actorId =
          requireCurrentUserId();

        return runEnrollmentMutation({
          actionName:
            "fail",

          fallbackMessage:
            "Unable to mark the enrollment conversion failed.",

          operation: () =>
            service
              .failEnrollmentConversion(
                conversionId,
                {
                  actorId,
                  failureReason,
                  validationErrors,
                },
              ),
        });
      },
      [
        service,
        assertCanEditEnrollment,
        requireCurrentUserId,
        runEnrollmentMutation,
      ],
    );

  const cancelEnrollmentConversion =
    useCallback(
      async (
        conversionId,
        {
          cancellationReason,
        } = {},
      ) => {
        assertCanEditEnrollment();

        if (!conversionId) {
          throw new Error(
            "Enrollment conversion id is required.",
          );
        }

        const actorId =
          requireCurrentUserId();

        return runEnrollmentMutation({
          actionName:
            "cancel",

          fallbackMessage:
            "Unable to cancel the enrollment conversion.",

          operation: () =>
            service
              .cancelEnrollmentConversion(
                conversionId,
                {
                  actorId,
                  cancellationReason,
                },
              ),
        });
      },
      [
        service,
        assertCanEditEnrollment,
        requireCurrentUserId,
        runEnrollmentMutation,
      ],
    );

  const reverseEnrollmentConversion =
    useCallback(
      async (
        conversionId,
        {
          reversalReason,
        } = {},
      ) => {
        assertCanEditEnrollment();

        if (!conversionId) {
          throw new Error(
            "Enrollment conversion id is required.",
          );
        }

        const actorId =
          requireCurrentUserId();

        return runEnrollmentMutation({
          actionName:
            "reverse",

          fallbackMessage:
            "Unable to reverse the enrollment conversion.",

          operation: () =>
            service
              .reverseEnrollmentConversion(
                conversionId,
                {
                  actorId,
                  reversalReason,
                },
              ),
        });
      },
      [
        service,
        assertCanEditEnrollment,
        requireCurrentUserId,
        runEnrollmentMutation,
      ],
    );

  const clearEnrollmentMutationError =
    useCallback(() => {
      setEnrollmentMutationError("");
    }, []);

  const selectEnrollmentConversion =
    useCallback(
      (conversionOrId) => {
        const nextId =
          typeof conversionOrId ===
            "object"
            ? conversionOrId?.id
            : conversionOrId;

        setSelectedEnrollmentConversionId(
          nextId ||
          null,
        );
      },
      [],
    );

  return useMemo(
    () => ({
      enrollmentConversions,
      enrollmentFilters,

      selectedEnrollmentConversionId,
      selectedEnrollmentConversion,

      enrollmentConversionsLoading,
      enrollmentConversionsError,

      enrollmentMutationLoading,
      enrollmentMutationError,

      lastEnrollmentAction,

      canCreateEnrollments:
        canCreateAdmissions,

      canEditEnrollments:
        canEditAdmissions,

      setEnrollmentFilters,
      resetEnrollmentFilters,

      selectEnrollmentConversion,
      setSelectedEnrollmentConversionId,

      refreshEnrollmentConversions,
      refreshEnrollmentConversion,
      resetEnrollmentConversions,

      createEnrollmentConversion,
      updateEnrollmentConversion,

      validateEnrollmentConversion,
      markEnrollmentReady,
      startEnrollmentProcessing,
      completeEnrollmentConversion,
      failEnrollmentConversion,
      cancelEnrollmentConversion,
      reverseEnrollmentConversion,

      clearEnrollmentMutationError,
    }),
    [
      enrollmentConversions,
      enrollmentFilters,

      selectedEnrollmentConversionId,
      selectedEnrollmentConversion,

      enrollmentConversionsLoading,
      enrollmentConversionsError,

      enrollmentMutationLoading,
      enrollmentMutationError,

      lastEnrollmentAction,

      canCreateAdmissions,
      canEditAdmissions,

      setEnrollmentFilters,
      resetEnrollmentFilters,

      selectEnrollmentConversion,

      refreshEnrollmentConversions,
      refreshEnrollmentConversion,
      resetEnrollmentConversions,

      createEnrollmentConversion,
      updateEnrollmentConversion,

      validateEnrollmentConversion,
      markEnrollmentReady,
      startEnrollmentProcessing,
      completeEnrollmentConversion,
      failEnrollmentConversion,
      cancelEnrollmentConversion,
      reverseEnrollmentConversion,

      clearEnrollmentMutationError,
    ],
  );
}