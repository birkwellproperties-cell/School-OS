import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const EMPTY_OFFERS =
  Object.freeze({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    pageCount: 0,
  });

const DEFAULT_OFFER_FILTERS =
  Object.freeze({
    search: "",
    status: "",
    applicationId: "",
    applicantId: "",
    decisionId: "",
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
      ...EMPTY_OFFERS,

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

export default function useOfferState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAdmissions,
  canCreateAdmissions,
  canEditAdmissions,

  currentUserId,
  selectedAdmissionCycleId,

  refreshApplications,
  refreshDecisions,
  refreshDashboard,
}) {
  const offerRequestRef =
    useRef(0);

  const isMountedRef =
    useRef(true);

  const offerFiltersRef =
    useRef({
      ...DEFAULT_OFFER_FILTERS,
    });

  const [
    offers,
    setOffers,
  ] = useState(
    EMPTY_OFFERS,
  );

  const [
    offerFilters,
    setOfferFiltersState,
  ] = useState({
    ...DEFAULT_OFFER_FILTERS,
  });

  const [
    selectedOfferId,
    setSelectedOfferId,
  ] = useState(null);

  const [
    offersLoading,
    setOffersLoading,
  ] = useState(false);

  const [
    offersError,
    setOffersError,
  ] = useState("");

  const [
    offerMutationLoading,
    setOfferMutationLoading,
  ] = useState(false);

  const [
    offerMutationError,
    setOfferMutationError,
  ] = useState("");

  const [
    lastOfferAction,
    setLastOfferAction,
  ] = useState("");

  useEffect(() => {
    offerFiltersRef.current =
      offerFilters;
  }, [
    offerFilters,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      offerRequestRef.current += 1;
    };
  }, []);

  const selectedOffer =
    useMemo(
      () =>
        offers.items.find(
          (offer) =>
            offer.id ===
            selectedOfferId,
        ) || null,
      [
        offers.items,
        selectedOfferId,
      ],
    );

  const resetOffers =
    useCallback(() => {
      offerRequestRef.current += 1;

      setOffers(
        EMPTY_OFFERS,
      );

      setSelectedOfferId(
        null,
      );

      setOffersLoading(
        false,
      );

      setOffersError("");

      setOfferMutationLoading(
        false,
      );

      setOfferMutationError("");

      setLastOfferAction("");
    }, []);

  const setOfferFilters =
    useCallback(
      (
        nextFiltersOrUpdater,
      ) => {
        setOfferFiltersState(
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

              decisionId:
                normalizeFilterValue(
                  nextFilters
                    .decisionId,
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

  const resetOfferFilters =
    useCallback(() => {
      setOfferFiltersState({
        ...DEFAULT_OFFER_FILTERS,
      });
    }, []);

  const refreshOffers =
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
          resetOffers();

          return EMPTY_OFFERS;
        }

        const safeOverrides =
          isSafeFilterOverrides(
            filterOverrides,
          )
            ? filterOverrides
            : {};

        const resolvedFilters = {
          ...offerFiltersRef.current,
          ...safeOverrides,

          admissionCycleId:
            selectedAdmissionCycleId,
        };

        const requestId =
          ++offerRequestRef.current;

        setOffersLoading(true);
        setOffersError("");

        try {
          const result =
            await service
              .getOffers({
                admissionCycleId:
                  selectedAdmissionCycleId,

                search:
                  resolvedFilters.search ||
                  undefined,

                status:
                  resolvedFilters.status ||
                  undefined,

                applicationId:
                  resolvedFilters
                    .applicationId ||
                  undefined,

                applicantId:
                  resolvedFilters
                    .applicantId ||
                  undefined,

                decisionId:
                  resolvedFilters
                    .decisionId ||
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
              offerRequestRef.current
          ) {
            return EMPTY_OFFERS;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters,
            );

          setOffers(
            normalizedResult,
          );

          setSelectedOfferId(
            (currentOfferId) => {
              if (!currentOfferId) {
                return null;
              }

              const stillVisible =
                normalizedResult
                  .items
                  .some(
                    (offer) =>
                      offer.id ===
                      currentOfferId,
                  );

              return stillVisible
                ? currentOfferId
                : null;
            },
          );

          return normalizedResult;
        } catch (loadError) {
          if (
            !isMountedRef.current ||
            requestId !==
              offerRequestRef.current
          ) {
            return EMPTY_OFFERS;
          }

          setOffers(
            EMPTY_OFFERS,
          );

          setSelectedOfferId(
            null,
          );

          setOffersError(
            getErrorMessage(
              loadError,
              "Unable to load admission offers.",
            ),
          );

          return EMPTY_OFFERS;
        } finally {
          if (
            isMountedRef.current &&
            requestId ===
              offerRequestRef.current
          ) {
            setOffersLoading(
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
        resetOffers,
      ],
    );

  const refreshOffer =
    useCallback(
      async (offerId) => {
        if (!service) {
          throw new Error(
            "Admissions service is not available.",
          );
        }

        if (!offerId) {
          throw new Error(
            "Offer id is required.",
          );
        }

        setOffersError("");

        try {
          const offer =
            await service
              .getOffer(
                offerId,
              );

          if (
            !isMountedRef.current
          ) {
            return offer;
          }

          setOffers(
            (currentResult) => {
              const exists =
                currentResult.items.some(
                  (item) =>
                    item.id ===
                    offerId,
                );

              return {
                ...currentResult,

                items: exists
                  ? currentResult.items.map(
                      (item) =>
                        item.id ===
                        offerId
                          ? offer
                          : item,
                    )
                  : [
                      offer,
                      ...currentResult.items,
                    ],

                total: exists
                  ? currentResult.total
                  : currentResult.total +
                    1,
              };
            },
          );

          setSelectedOfferId(
            offer?.id ||
            offerId,
          );

          return offer;
        } catch (loadError) {
          if (
            isMountedRef.current
          ) {
            setOffersError(
              getErrorMessage(
                loadError,
                "Unable to load the admission offer.",
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

  const upsertOffer =
    useCallback(
      (offer) => {
        if (
          !offer ||
          !offer.id
        ) {
          return;
        }

        setOffers(
          (currentResult) => {
            const exists =
              currentResult.items.some(
                (item) =>
                  item.id ===
                  offer.id,
              );

            return {
              ...currentResult,

              items: exists
                ? currentResult.items.map(
                    (item) =>
                      item.id ===
                      offer.id
                        ? offer
                        : item,
                  )
                : [
                    offer,
                    ...currentResult.items,
                  ],

              total: exists
                ? currentResult.total
                : currentResult.total +
                  1,
            };
          },
        );

        setSelectedOfferId(
          offer.id,
        );
      },
      [],
    );

  const refreshOfferDependencies =
    useCallback(
      async ({
        refreshOfferList = true,
        refreshApplicationList = true,
        refreshDecisionList = false,
        refreshDashboardSnapshot = true,
      } = {}) => {
        const refreshTasks = [];

        if (refreshOfferList) {
          refreshTasks.push(
            refreshOffers(),
          );
        }

        if (
          refreshApplicationList &&
          typeof refreshApplications ===
            "function"
        ) {
          refreshTasks.push(
            refreshApplications(),
          );
        }

        if (
          refreshDecisionList &&
          typeof refreshDecisions ===
            "function"
        ) {
          refreshTasks.push(
            refreshDecisions(),
          );
        }

        if (
          refreshDashboardSnapshot &&
          typeof refreshDashboard ===
            "function"
        ) {
          refreshTasks.push(
            refreshDashboard(),
          );
        }

        if (
          refreshTasks.length === 0
        ) {
          return [];
        }

        return Promise.allSettled(
          refreshTasks,
        );
      },
      [
        refreshOffers,
        refreshApplications,
        refreshDecisions,
        refreshDashboard,
      ],
    );

  const runOfferMutation =
    useCallback(
      async ({
        actionName,
        fallbackMessage,
        operation,
        refreshOfferList = true,
        refreshApplicationList = true,
        refreshDecisionList = false,
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
            "Offer operation is not available.",
          );
        }

        setOfferMutationLoading(
          true,
        );

        setOfferMutationError("");

        setLastOfferAction(
          actionName,
        );

        try {
          const result =
            await operation();

          if (
            isMountedRef.current
          ) {
            upsertOffer(
              result,
            );
          }

          await refreshOfferDependencies({
            refreshOfferList,
            refreshApplicationList,
            refreshDecisionList,
            refreshDashboardSnapshot,
          });

          return result;
        } catch (mutationError) {
          if (
            isMountedRef.current
          ) {
            setOfferMutationError(
              getErrorMessage(
                mutationError,
                fallbackMessage,
              ),
            );
          }

          throw mutationError;
        } finally {
          if (
            isMountedRef.current
          ) {
            setOfferMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        upsertOffer,
        refreshOfferDependencies,
      ],
    );

  const assertCanCreateOffer =
    useCallback(() => {
      if (!canCreateAdmissions) {
        throw new Error(
          "You do not have permission to create admission offers.",
        );
      }
    }, [
      canCreateAdmissions,
    ]);

  const assertCanEditOffer =
    useCallback(() => {
      if (!canEditAdmissions) {
        throw new Error(
          "You do not have permission to manage admission offers.",
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

  const createOffer =
    useCallback(
      async (payload = {}) => {
        assertCanCreateOffer();

        return runOfferMutation({
          actionName:
            "create",

          fallbackMessage:
            "Unable to create the admission offer.",

          operation: () =>
            service.createOffer(
              payload,
            ),

          refreshDecisionList:
            true,
        });
      },
      [
        service,
        assertCanCreateOffer,
        runOfferMutation,
      ],
    );

  const updateOffer =
    useCallback(
      async (
        offerId,
        updates = {},
      ) => {
        assertCanEditOffer();

        if (!offerId) {
          throw new Error(
            "Offer id is required.",
          );
        }

        return runOfferMutation({
          actionName:
            "update",

          fallbackMessage:
            "Unable to update the admission offer.",

          operation: () =>
            service.updateOffer(
              offerId,
              updates,
            ),
        });
      },
      [
        service,
        assertCanEditOffer,
        runOfferMutation,
      ],
    );

  const submitOfferForApproval =
    useCallback(
      async (offerId) => {
        assertCanEditOffer();

        if (!offerId) {
          throw new Error(
            "Offer id is required.",
          );
        }

        const actorId =
          requireCurrentUserId(
            "The offer submitter id is required.",
          );

        return runOfferMutation({
          actionName:
            "submit_for_approval",

          fallbackMessage:
            "Unable to submit the admission offer for approval.",

          operation: () =>
            service
              .submitOfferForApproval(
                offerId,
                {
                  actorId,
                },
              ),
        });
      },
      [
        service,
        assertCanEditOffer,
        requireCurrentUserId,
        runOfferMutation,
      ],
    );

  const approveOffer =
    useCallback(
      async (offerId) => {
        assertCanEditOffer();

        if (!offerId) {
          throw new Error(
            "Offer id is required.",
          );
        }

        const actorId =
          requireCurrentUserId(
            "The offer approver id is required.",
          );

        return runOfferMutation({
          actionName:
            "approve",

          fallbackMessage:
            "Unable to approve the admission offer.",

          operation: () =>
            service.approveOffer(
              offerId,
              {
                actorId,
              },
            ),
        });
      },
      [
        service,
        assertCanEditOffer,
        requireCurrentUserId,
        runOfferMutation,
      ],
    );

  const sendOffer =
    useCallback(
      async (
        offerId,
        {
          offeredOn,
          expiresAt,
        } = {},
      ) => {
        assertCanEditOffer();

        if (!offerId) {
          throw new Error(
            "Offer id is required.",
          );
        }

        const actorId =
          requireCurrentUserId(
            "The offer sender id is required.",
          );

        return runOfferMutation({
          actionName:
            "send",

          fallbackMessage:
            "Unable to send the admission offer.",

          operation: () =>
            service.sendOffer(
              offerId,
              {
                actorId,
                offeredOn,
                expiresAt,
              },
            ),
        });
      },
      [
        service,
        assertCanEditOffer,
        requireCurrentUserId,
        runOfferMutation,
      ],
    );

  const recordOfferViewed =
    useCallback(
      async (offerId) => {
        if (!offerId) {
          throw new Error(
            "Offer id is required.",
          );
        }

        return runOfferMutation({
          actionName:
            "record_viewed",

          fallbackMessage:
            "Unable to mark the admission offer as viewed.",

          operation: () =>
            service
              .recordOfferViewed(
                offerId,
              ),

          refreshApplicationList:
            false,

          refreshDecisionList:
            false,
        });
      },
      [
        service,
        runOfferMutation,
      ],
    );

  const acceptOffer =
    useCallback(
      async (
        offerId,
        {
          responseNotes,
          actorId:
            suppliedActorId,
        } = {},
      ) => {
        if (!offerId) {
          throw new Error(
            "Offer id is required.",
          );
        }

        const actorId =
          suppliedActorId ||
          currentUserId ||
          undefined;

        return runOfferMutation({
          actionName:
            "accept",

          fallbackMessage:
            "Unable to accept the admission offer.",

          operation: () =>
            service.acceptOffer(
              offerId,
              {
                responseNotes,
                actorId,
              },
            ),

          refreshDecisionList:
            true,
        });
      },
      [
        service,
        currentUserId,
        runOfferMutation,
      ],
    );

  const declineOffer =
    useCallback(
      async (
        offerId,
        {
          responseNotes,
          actorId:
            suppliedActorId,
        } = {},
      ) => {
        if (!offerId) {
          throw new Error(
            "Offer id is required.",
          );
        }

        const actorId =
          suppliedActorId ||
          currentUserId ||
          undefined;

        return runOfferMutation({
          actionName:
            "decline",

          fallbackMessage:
            "Unable to decline the admission offer.",

          operation: () =>
            service.declineOffer(
              offerId,
              {
                responseNotes,
                actorId,
              },
            ),

          refreshDecisionList:
            true,
        });
      },
      [
        service,
        currentUserId,
        runOfferMutation,
      ],
    );

  const withdrawOffer =
    useCallback(
      async (
        offerId,
        {
          withdrawalReason,
        } = {},
      ) => {
        assertCanEditOffer();

        if (!offerId) {
          throw new Error(
            "Offer id is required.",
          );
        }

        const actorId =
          requireCurrentUserId(
            "The offer withdrawer id is required.",
          );

        return runOfferMutation({
          actionName:
            "withdraw",

          fallbackMessage:
            "Unable to withdraw the admission offer.",

          operation: () =>
            service.withdrawOffer(
              offerId,
              {
                actorId,
                withdrawalReason,
              },
            ),

          refreshDecisionList:
            true,
        });
      },
      [
        service,
        assertCanEditOffer,
        requireCurrentUserId,
        runOfferMutation,
      ],
    );

  const clearOfferMutationError =
    useCallback(() => {
      setOfferMutationError("");
    }, []);

  const selectOffer =
    useCallback(
      (offerOrId) => {
        const nextOfferId =
          typeof offerOrId ===
          "object"
            ? offerOrId?.id
            : offerOrId;

        setSelectedOfferId(
          nextOfferId ||
          null,
        );
      },
      [],
    );

  return useMemo(
    () => ({
      offers,
      offerFilters,

      selectedOfferId,
      selectedOffer,

      offersLoading,
      offersError,

      offerMutationLoading,
      offerMutationError,

      lastOfferAction,

      canCreateOffers:
        canCreateAdmissions,

      canEditOffers:
        canEditAdmissions,

      setOfferFilters,
      resetOfferFilters,

      selectOffer,
      setSelectedOfferId,

      refreshOffers,
      refreshOffer,
      resetOffers,

      createOffer,
      updateOffer,

      submitOfferForApproval,
      approveOffer,
      sendOffer,

      recordOfferViewed,
      acceptOffer,
      declineOffer,
      withdrawOffer,

      clearOfferMutationError,
    }),
    [
      offers,
      offerFilters,

      selectedOfferId,
      selectedOffer,

      offersLoading,
      offersError,

      offerMutationLoading,
      offerMutationError,

      lastOfferAction,

      canCreateAdmissions,
      canEditAdmissions,

      setOfferFilters,
      resetOfferFilters,

      selectOffer,

      refreshOffers,
      refreshOffer,
      resetOffers,

      createOffer,
      updateOffer,

      submitOfferForApproval,
      approveOffer,
      sendOffer,

      recordOfferViewed,
      acceptOffer,
      declineOffer,
      withdrawOffer,

      clearOfferMutationError,
    ],
  );
}