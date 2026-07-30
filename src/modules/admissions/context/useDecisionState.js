import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const EMPTY_DECISIONS =
  Object.freeze({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    pageCount: 0,
  });

const DEFAULT_DECISION_FILTERS =
  Object.freeze({
    search: "",
    status: "",
    decision: "",
    applicationId: "",
    applicantId: "",
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
      ...EMPTY_DECISIONS,

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

export default function useDecisionState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAdmissions,
  canCreateAdmissions,
  canEditAdmissions,

  currentUserId,
  selectedAdmissionCycleId,

  refreshApplications,
  refreshDashboard,
}) {
  const decisionRequestRef =
    useRef(0);

  const isMountedRef =
    useRef(true);

  const decisionFiltersRef =
    useRef({
      ...DEFAULT_DECISION_FILTERS,
    });

  const [
    decisions,
    setDecisions,
  ] = useState(
    EMPTY_DECISIONS,
  );

  const [
    decisionFilters,
    setDecisionFiltersState,
  ] = useState({
    ...DEFAULT_DECISION_FILTERS,
  });

  const [
    selectedDecisionId,
    setSelectedDecisionId,
  ] = useState(null);

  const [
    decisionsLoading,
    setDecisionsLoading,
  ] = useState(false);

  const [
    decisionsError,
    setDecisionsError,
  ] = useState("");

  const [
    decisionMutationLoading,
    setDecisionMutationLoading,
  ] = useState(false);

  const [
    decisionMutationError,
    setDecisionMutationError,
  ] = useState("");

  const [
    lastDecisionAction,
    setLastDecisionAction,
  ] = useState("");

  useEffect(() => {
    decisionFiltersRef.current =
      decisionFilters;
  }, [
    decisionFilters,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      decisionRequestRef.current += 1;
    };
  }, []);

  const selectedDecision =
    useMemo(
      () =>
        decisions.items.find(
          (decision) =>
            decision.id ===
            selectedDecisionId,
        ) || null,
      [
        decisions.items,
        selectedDecisionId,
      ],
    );

  useEffect(() => {
    if (!selectedDecision) {
      return;
    }
  }, [selectedDecision]);

  const resetDecisions =
    useCallback(() => {
      decisionRequestRef.current += 1;

      setDecisions(
        EMPTY_DECISIONS,
      );

      setSelectedDecisionId(
        null,
      );

      setDecisionsLoading(
        false,
      );

      setDecisionsError("");

      setDecisionMutationLoading(
        false,
      );

      setDecisionMutationError("");

      setLastDecisionAction("");
    }, []);

  const setDecisionFilters =
    useCallback(
      (
        nextFiltersOrUpdater,
      ) => {
        setDecisionFiltersState(
          (currentFilters) => {
            const proposedFilters =
              typeof nextFiltersOrUpdater ===
              "function"
                ? nextFiltersOrUpdater(
                    currentFilters,
                  )
                : nextFiltersOrUpdater;

            if (
              !proposedFilters ||
              typeof proposedFilters !==
                "object" ||
              Array.isArray(
                proposedFilters,
              )
            ) {
              return currentFilters;
            }

            const nextFilters = {
              ...currentFilters,
              ...proposedFilters,
            };

            return {
              search:
                normalizeFilterValue(
                  nextFilters.search,
                ),

              status:
                normalizeFilterValue(
                  nextFilters.status,
                ),

              decision:
                normalizeFilterValue(
                  nextFilters.decision,
                ),

              applicationId:
                normalizeFilterValue(
                  nextFilters
                    .applicationId,
                ),

              applicantId:
                normalizeFilterValue(
                  nextFilters
                    .applicantId,
                ),

              page:
                Math.max(
                  1,
                  Number(
                    nextFilters.page,
                  ) || 1,
                ),

              pageSize:
                Math.max(
                  1,
                  Number(
                    nextFilters.pageSize,
                  ) || 25,
                ),

              sortBy:
                normalizeFilterValue(
                  nextFilters.sortBy,
                ) ||
                "created_at",

              ascending:
                Boolean(
                  nextFilters
                    .ascending,
                ),
            };
          },
        );
      },
      [],
    );

  const resetDecisionFilters =
    useCallback(() => {
      setDecisionFiltersState({
        ...DEFAULT_DECISION_FILTERS,
      });
    }, []);

  const refreshDecisions =
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
          resetDecisions();

          return EMPTY_DECISIONS;
        }

        const safeOverrides =
          isSafeFilterOverrides(
            filterOverrides,
          )
            ? filterOverrides
            : {};

        const resolvedFilters = {
          ...decisionFiltersRef.current,
          ...safeOverrides,

          admissionCycleId:
            selectedAdmissionCycleId,
        };

        const requestId =
          ++decisionRequestRef.current;

        setDecisionsLoading(true);
        setDecisionsError("");

        try {
          const result =
            await service
              .getDecisions({
                admissionCycleId:
                  selectedAdmissionCycleId,

                search:
                  resolvedFilters.search ||
                  undefined,

                status:
                  resolvedFilters.status ||
                  undefined,

                decision:
                  resolvedFilters.decision ||
                  undefined,

                applicationId:
                  resolvedFilters
                    .applicationId ||
                  undefined,

                applicantId:
                  resolvedFilters
                    .applicantId ||
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
              decisionRequestRef.current
          ) {
            return EMPTY_DECISIONS;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters,
            );

          setDecisions(
            normalizedResult,
          );

          setSelectedDecisionId(
            (currentDecisionId) => {
              if (!currentDecisionId) {
                return null;
              }

              const stillVisible =
                normalizedResult
                  .items
                  .some(
                    (decision) =>
                      decision.id ===
                      currentDecisionId,
                  );

              return stillVisible
                ? currentDecisionId
                : null;
            },
          );

          return normalizedResult;
        } catch (loadError) {
          if (
            !isMountedRef.current ||
            requestId !==
              decisionRequestRef.current
          ) {
            return EMPTY_DECISIONS;
          }

          setDecisions(
            EMPTY_DECISIONS,
          );

          setSelectedDecisionId(
            null,
          );

          setDecisionsError(
            getErrorMessage(
              loadError,
              "Unable to load admission decisions.",
            ),
          );

          return EMPTY_DECISIONS;
        } finally {
          if (
            isMountedRef.current &&
            requestId ===
              decisionRequestRef.current
          ) {
            setDecisionsLoading(
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
        resetDecisions,
      ],
    );

  const refreshDecision =
    useCallback(
      async (decisionId) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!decisionId) {
          throw new Error(
            "Decision id is required.",
          );
        }

        setDecisionsError("");

        try {
          const decision =
            await service
              .getDecision(
                decisionId,
              );

          if (
            !isMountedRef.current
          ) {
            return decision;
          }

          setDecisions(
            (currentResult) => {
              const exists =
                currentResult.items.some(
                  (item) =>
                    item.id ===
                    decisionId,
                );

              return {
                ...currentResult,

                items: exists
                  ? currentResult.items.map(
                      (item) =>
                        item.id ===
                        decisionId
                          ? decision
                          : item,
                    )
                  : [
                      decision,
                      ...currentResult.items,
                    ],

                total: exists
                  ? currentResult.total
                  : currentResult.total +
                    1,
              };
            },
          );

          setSelectedDecisionId(
            decision?.id ||
            decisionId,
          );

          return decision;
        } catch (loadError) {
          if (
            isMountedRef.current
          ) {
            setDecisionsError(
              getErrorMessage(
                loadError,
                "Unable to load the admission decision.",
              ),
            );
          }

          throw loadError;
        }
      },
      [
        service,
      ],
    );

  const runDecisionMutation =
    useCallback(
      async ({
        action,
        decisionId = null,
        payload = {},
      }) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (
          !workspaceReady ||
          !authorizationReady
        ) {
          throw new Error(
            "The Admissions workspace is not ready.",
          );
        }

        if (
          action === "create" &&
          !canCreateAdmissions
        ) {
          throw new Error(
            "You do not have permission to create admission decisions.",
          );
        }

        if (
          action !== "create" &&
          !canEditAdmissions
        ) {
          throw new Error(
            "You do not have permission to update admission decisions.",
          );
        }

        if (
          action !== "create" &&
          !decisionId
        ) {
          throw new Error(
            "Decision id is required.",
          );
        }

        if (
          [
            "submit",
            "approve",
            "publish",
          ].includes(action) &&
          !currentUserId
        ) {
          throw new Error(
            "The authenticated user could not be identified.",
          );
        }

        if (
          action === "create" &&
          !selectedAdmissionCycleId
        ) {
          throw new Error(
            "Select an admission cycle before creating a decision.",
          );
        }

        setDecisionMutationLoading(
          true,
        );

        setDecisionMutationError("");

        setLastDecisionAction(
          action,
        );

        try {
          let updatedDecision;

          switch (action) {
            case "create":
              updatedDecision =
                await service
                  .createDecision({
                    ...payload,

                    admission_cycle_id:
                      payload
                        .admission_cycle_id ||
                      selectedAdmissionCycleId,
                  });
              break;

            case "update":
              updatedDecision =
                await service
                  .updateDecision(
                    decisionId,
                    payload,
                  );
              break;

            case "submit":
              updatedDecision =
                await service
                  .submitDecisionForApproval(
                    decisionId,
                    {
                      actorId:
                        currentUserId,
                    },
                  );
              break;

            case "approve":
              updatedDecision =
                await service
                  .approveDecision(
                    decisionId,
                    {
                      actorId:
                        currentUserId,
                    },
                  );
              break;

            case "publish":
              updatedDecision =
                await service
                  .publishDecision(
                    decisionId,
                    {
                      actorId:
                        currentUserId,
                    },
                  );
              break;

            default:
              throw new Error(
                "The decision workflow action is not supported.",
              );
          }

          await Promise.all([
            refreshDecisions(),

            typeof refreshApplications ===
              "function"
              ? refreshApplications()
              : Promise.resolve(),

            typeof refreshDashboard ===
              "function"
              ? refreshDashboard(
                  selectedAdmissionCycleId,
                )
              : Promise.resolve(),
          ]);

          if (
            isMountedRef.current &&
            updatedDecision?.id
          ) {
            setSelectedDecisionId(
              updatedDecision.id,
            );
          }

          return updatedDecision;
        } catch (mutationError) {
          if (
            isMountedRef.current
          ) {
            setDecisionMutationError(
              getErrorMessage(
                mutationError,
                "Unable to update the admission decision.",
              ),
            );
          }

          throw mutationError;
        } finally {
          if (
            isMountedRef.current
          ) {
            setDecisionMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        workspaceReady,
        authorizationReady,
        canCreateAdmissions,
        canEditAdmissions,
        currentUserId,
        selectedAdmissionCycleId,
        refreshDecisions,
        refreshApplications,
        refreshDashboard,
      ],
    );

  const createDecision =
    useCallback(
      (payload = {}) =>
        runDecisionMutation({
          action: "create",
          payload,
        }),
      [
        runDecisionMutation,
      ],
    );

  const updateDecision =
    useCallback(
      (
        decisionId,
        updates = {},
      ) =>
        runDecisionMutation({
          action: "update",
          decisionId,
          payload: updates,
        }),
      [
        runDecisionMutation,
      ],
    );

  const submitDecisionForApproval =
    useCallback(
      (decisionId) =>
        runDecisionMutation({
          action: "submit",
          decisionId,
        }),
      [
        runDecisionMutation,
      ],
    );

  const approveDecision =
    useCallback(
      (decisionId) =>
        runDecisionMutation({
          action: "approve",
          decisionId,
        }),
      [
        runDecisionMutation,
      ],
    );

  const publishDecision =
    useCallback(
      (decisionId) =>
        runDecisionMutation({
          action: "publish",
          decisionId,
        }),
      [
        runDecisionMutation,
      ],
    );

  const selectDecision =
    useCallback(
      (decisionOrId) => {
        if (!decisionOrId) {
          setSelectedDecisionId(
            null,
          );

          return;
        }

        if (
          typeof decisionOrId ===
          "string"
        ) {
          setSelectedDecisionId(
            decisionOrId,
          );

          return;
        }

        setSelectedDecisionId(
          decisionOrId.id ||
          null,
        );
      },
      [],
    );

  const clearDecisionsError =
    useCallback(() => {
      setDecisionsError("");
    }, []);

  const clearDecisionMutationError =
    useCallback(() => {
      setDecisionMutationError("");
    }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAdmissions ||
      !selectedAdmissionCycleId
    ) {
      resetDecisions();

      return;
    }

    void refreshDecisions();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAdmissions,
    selectedAdmissionCycleId,
    decisionFilters,
    refreshDecisions,
    resetDecisions,
  ]);

  return useMemo(
    () => ({
      decisions,
      decisionFilters,

      selectedDecisionId,
      selectedDecision,

      decisionsLoading,
      decisionsError,

      decisionMutationLoading,
      decisionMutationError,

      lastDecisionAction,

      canCreateDecisions:
        canCreateAdmissions,

      canEditDecisions:
        canEditAdmissions,

      canSubmitDecisions:
        canEditAdmissions,

      canApproveDecisions:
        canEditAdmissions,

      canPublishDecisions:
        canEditAdmissions,

      setDecisionFilters,
      resetDecisionFilters,

      refreshDecisions,
      refreshDecision,
      resetDecisions,

      createDecision,
      updateDecision,

      submitDecisionForApproval,
      approveDecision,
      publishDecision,

      selectDecision,

      clearDecisionsError,
      clearDecisionMutationError,
    }),
    [
      decisions,
      decisionFilters,

      selectedDecisionId,
      selectedDecision,

      decisionsLoading,
      decisionsError,

      decisionMutationLoading,
      decisionMutationError,

      lastDecisionAction,

      canCreateAdmissions,
      canEditAdmissions,

      setDecisionFilters,
      resetDecisionFilters,

      refreshDecisions,
      refreshDecision,
      resetDecisions,

      createDecision,
      updateDecision,

      submitDecisionForApproval,
      approveDecision,
      publishDecision,

      selectDecision,

      clearDecisionsError,
      clearDecisionMutationError,
    ],
  );
}