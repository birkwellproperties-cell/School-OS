import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getAssessmentErrorMessage,
} from "../utils";

const DEFAULT_ASSIGNMENT_FILTERS = {
  search: "",
  status: "",
  templateId: "",
  deliveryMode: "",
  sourceType: "",
  sourceId: "",

  page: 1,
  pageSize: 20,

  sortBy: "created_at",
  sortDirection: "desc",
};

const EMPTY_ASSIGNMENT_RESULT = {
  data: [],
  count: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
};

function normalizeText(
  value,
) {
  return String(
    value ?? "",
  ).trim();
}

function normalizeIdentifier(
  value,
) {
  const normalized =
    normalizeText(
      value,
    );

  return normalized ||
    null;
}

function normalizePositiveInteger(
  value,
  fallback,
) {
  const number =
    Number(
      value,
    );

  if (
    !Number.isInteger(
      number,
    ) ||
    number < 1
  ) {
    return fallback;
  }

  return number;
}

function normalizeSortDirection(
  value,
) {
  return value === "asc"
    ? "asc"
    : "desc";
}

function normalizeAssignmentFilters(
  filters = {},
) {
  return {
    search:
      normalizeText(
        filters.search,
      ),

    status:
      normalizeText(
        filters.status,
      ),

    templateId:
      normalizeIdentifier(
        filters.templateId,
      ),

    deliveryMode:
      normalizeText(
        filters.deliveryMode,
      ),

    sourceType:
      normalizeText(
        filters.sourceType,
      ),

    sourceId:
      normalizeIdentifier(
        filters.sourceId,
      ),

    page:
      normalizePositiveInteger(
        filters.page,
        1,
      ),

    pageSize:
      normalizePositiveInteger(
        filters.pageSize,
        20,
      ),

    sortBy:
      normalizeText(
        filters.sortBy,
      ) ||
      "created_at",

    sortDirection:
      normalizeSortDirection(
        filters.sortDirection,
      ),
  };
}

function createAssignmentServiceFilters(
  filters,
) {
  const normalized =
    normalizeAssignmentFilters(
      filters,
    );

  const serviceFilters = {
    search:
      normalized.search ||
      undefined,

    templateId:
      normalized.templateId ||
      undefined,

    deliveryMode:
      normalized.deliveryMode ||
      undefined,

    sourceType:
      normalized.sourceType ||
      undefined,

    sourceId:
      normalized.sourceId ||
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

  if (
    normalized.status
  ) {
    serviceFilters.status =
      normalized.status;
  }

  return serviceFilters;
}

function normalizePagedResult(
  result,
  fallbackFilters =
    DEFAULT_ASSIGNMENT_FILTERS,
) {
  const filters =
    normalizeAssignmentFilters(
      fallbackFilters,
    );

  if (
    Array.isArray(
      result,
    )
  ) {
    return {
      data: result,
      count:
        result.length,
      page:
        filters.page,
      pageSize:
        filters.pageSize,
      totalPages:
        result.length
          ? 1
          : 0,
    };
  }

  const data =
    Array.isArray(
      result?.data,
    )
      ? result.data
      : Array.isArray(
            result?.items,
          )
        ? result.items
        : Array.isArray(
              result?.records,
            )
          ? result.records
          : [];

  const count =
    Number.isFinite(
      Number(
        result?.count,
      ),
    )
      ? Number(
          result.count,
        )
      : Number.isFinite(
            Number(
              result?.total,
            ),
          )
        ? Number(
            result.total,
          )
        : data.length;

  const page =
    normalizePositiveInteger(
      result?.page,
      filters.page,
    );

  const pageSize =
    normalizePositiveInteger(
      result?.pageSize,
      filters.pageSize,
    );

  const calculatedTotalPages =
    count > 0
      ? Math.ceil(
          count /
            pageSize,
        )
      : 0;

  const totalPages =
    Number.isFinite(
      Number(
        result?.totalPages ??
        result?.pageCount,
      ),
    )
      ? Number(
          result.totalPages ??
          result.pageCount,
        )
      : calculatedTotalPages;

  return {
    data,
    count,
    page,
    pageSize,
    totalPages,
  };
}

function replaceRecord(
  records,
  updatedRecord,
) {
  if (
    !updatedRecord?.id
  ) {
    return records;
  }

  return records.map(
    (
      record,
    ) =>
      record.id ===
      updatedRecord.id
        ? {
            ...record,
            ...updatedRecord,
          }
        : record,
  );
}

function removeRecord(
  records,
  recordId,
) {
  return records.filter(
    (
      record,
    ) =>
      record.id !==
      recordId,
  );
}

export function useAssessmentAssignmentState({
  service,

  workspaceReady,
  authorizationReady,
  canViewAssessments,

  canCreateAssessments,
  canEditAssessments,
  canAssignAssessments,
  canManageAssessments,
}) {
  const mountedRef =
    useRef(
      true,
    );

  const assignmentRequestRef =
    useRef(
      0,
    );

  const selectedAssignmentRequestRef =
    useRef(
      0,
    );

  const [
    assignmentResult,
    setAssignmentResult,
  ] = useState(
    EMPTY_ASSIGNMENT_RESULT,
  );

  const [
    assignmentFilters,
    setAssignmentFilters,
  ] = useState(
    DEFAULT_ASSIGNMENT_FILTERS,
  );

  const [
    assignmentsLoading,
    setAssignmentsLoading,
  ] = useState(
    false,
  );

  const [
    assignmentsError,
    setAssignmentsError,
  ] = useState(
    "",
  );

  const [
    assignmentMutationLoading,
    setAssignmentMutationLoading,
  ] = useState(
    false,
  );

  const [
    assignmentMutationError,
    setAssignmentMutationError,
  ] = useState(
    "",
  );

  const [
    selectedAssignmentId,
    setSelectedAssignmentId,
  ] = useState(
    null,
  );

  const [
    selectedAssignment,
    setSelectedAssignment,
  ] = useState(
    null,
  );

  const [
    selectedAssignmentLoading,
    setSelectedAssignmentLoading,
  ] = useState(
    false,
  );

  const [
    selectedAssignmentError,
    setSelectedAssignmentError,
  ] = useState(
    "",
  );

  const assignments =
    assignmentResult.data;

  const canCreateAssignments =
    Boolean(
      canAssignAssessments ||
      canManageAssessments ||
      canCreateAssessments,
    );

  const canUpdateAssignments =
    Boolean(
      canAssignAssessments ||
      canManageAssessments ||
      canEditAssessments,
    );

  const canDeleteAssignments =
    Boolean(
      canManageAssessments,
    );

  const assignmentsReady =
    workspaceReady &&
    authorizationReady &&
    canViewAssessments &&
    Boolean(
      service,
    ) &&
    !assignmentsLoading &&
    !assignmentsError;

  const updateAssignmentFilters =
    useCallback(
      (
        updates = {},
      ) => {
        setAssignmentFilters(
          (
            current,
          ) => {
            const next =
              normalizeAssignmentFilters({
                ...current,
                ...updates,
              });

            const changedQuery =
              updates.search !==
                undefined ||
              updates.status !==
                undefined ||
              updates.templateId !==
                undefined ||
              updates.deliveryMode !==
                undefined ||
              updates.sourceType !==
                undefined ||
              updates.sourceId !==
                undefined ||
              updates.pageSize !==
                undefined ||
              updates.sortBy !==
                undefined ||
              updates.sortDirection !==
                undefined;

            if (
              changedQuery &&
              updates.page ===
                undefined
            ) {
              next.page = 1;
            }

            return next;
          },
        );
      },
      [],
    );

  const resetAssignmentFilters =
    useCallback(() => {
      setAssignmentFilters(
        DEFAULT_ASSIGNMENT_FILTERS,
      );
    }, []);

  const clearAssignmentsError =
    useCallback(() => {
      setAssignmentsError(
        "",
      );
    }, []);

  const clearAssignmentMutationError =
    useCallback(() => {
      setAssignmentMutationError(
        "",
      );
    }, []);

  const clearSelectedAssignmentError =
    useCallback(() => {
      setSelectedAssignmentError(
        "",
      );
    }, []);

  const selectAssignment =
    useCallback(
      (
        assignmentOrId,
      ) => {
        const id =
          typeof assignmentOrId ===
          "object"
            ? normalizeIdentifier(
                assignmentOrId?.id,
              )
            : normalizeIdentifier(
                assignmentOrId,
              );

        setSelectedAssignmentId(
          id,
        );

        if (
          typeof assignmentOrId ===
            "object" &&
          assignmentOrId?.id
        ) {
          setSelectedAssignment(
            assignmentOrId,
          );
        } else if (
          !id
        ) {
          setSelectedAssignment(
            null,
          );
        }
      },
      [],
    );

  const resetAssignments =
    useCallback(() => {
      assignmentRequestRef.current +=
        1;

      selectedAssignmentRequestRef.current +=
        1;

      setAssignmentResult(
        EMPTY_ASSIGNMENT_RESULT,
      );

      setAssignmentsLoading(
        false,
      );

      setAssignmentsError(
        "",
      );

      setAssignmentMutationLoading(
        false,
      );

      setAssignmentMutationError(
        "",
      );

      setSelectedAssignmentId(
        null,
      );

      setSelectedAssignment(
        null,
      );

      setSelectedAssignmentLoading(
        false,
      );

      setSelectedAssignmentError(
        "",
      );
    }, []);

  const refreshAssignments =
    useCallback(
      async (
        filters =
          assignmentFilters,
      ) => {
        if (
          !service ||
          !workspaceReady ||
          !authorizationReady ||
          !canViewAssessments
        ) {
          return EMPTY_ASSIGNMENT_RESULT;
        }

        const resolvedFilters =
          normalizeAssignmentFilters(
            filters,
          );

        const requestId =
          assignmentRequestRef.current +
          1;

        assignmentRequestRef.current =
          requestId;

        setAssignmentsLoading(
          true,
        );

        setAssignmentsError(
          "",
        );

        try {
          const result =
            await service
              .getAssessmentAssignments(
                createAssignmentServiceFilters(
                  resolvedFilters,
                ),
              );

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters,
            );

          if (
            mountedRef.current &&
            requestId ===
              assignmentRequestRef.current
          ) {
            setAssignmentResult(
              normalizedResult,
            );

            setSelectedAssignment(
              (
                current,
              ) => {
                if (
                  !current?.id
                ) {
                  return current;
                }

                const refreshed =
                  normalizedResult.data.find(
                    (
                      record,
                    ) =>
                      record.id ===
                      current.id,
                  );

                return refreshed ||
                  current;
              },
            );
          }

          return normalizedResult;
        } catch (
          error
        ) {
          const message =
            getAssessmentErrorMessage(
              error,
              "Unable to load assessment assignments.",
            );

          if (
            mountedRef.current &&
            requestId ===
              assignmentRequestRef.current
          ) {
            setAssignmentsError(
              message,
            );
          }

          return EMPTY_ASSIGNMENT_RESULT;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              assignmentRequestRef.current
          ) {
            setAssignmentsLoading(
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
        assignmentFilters,
      ],
    );

  const refreshSelectedAssignment =
    useCallback(
      async (
        assignmentId =
          selectedAssignmentId,
      ) => {
        const normalizedId =
          normalizeIdentifier(
            assignmentId,
          );

        if (
          !service ||
          !normalizedId ||
          !workspaceReady ||
          !authorizationReady ||
          !canViewAssessments
        ) {
          return null;
        }

        const requestId =
          selectedAssignmentRequestRef.current +
          1;

        selectedAssignmentRequestRef.current =
          requestId;

        setSelectedAssignmentLoading(
          true,
        );

        setSelectedAssignmentError(
          "",
        );

        try {
          const assignment =
            await service
              .getAssessmentAssignment(
                normalizedId,
              );

          if (
            mountedRef.current &&
            requestId ===
              selectedAssignmentRequestRef.current
          ) {
            setSelectedAssignment(
              assignment ||
              null,
            );
          }

          return assignment ||
            null;
        } catch (
          error
        ) {
          const message =
            getAssessmentErrorMessage(
              error,
              "Unable to load the selected assessment assignment.",
            );

          if (
            mountedRef.current &&
            requestId ===
              selectedAssignmentRequestRef.current
          ) {
            setSelectedAssignmentError(
              message,
            );
          }

          return null;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              selectedAssignmentRequestRef.current
          ) {
            setSelectedAssignmentLoading(
              false,
            );
          }
        }
      },
      [
        service,
        selectedAssignmentId,
        workspaceReady,
        authorizationReady,
        canViewAssessments,
      ],
    );

  const createAssignment =
    useCallback(
      async (
        payload = {},
      ) => {
        if (
          !service
        ) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (
          !canCreateAssignments
        ) {
          throw new Error(
            "You do not have permission to create assessment assignments.",
          );
        }

        setAssignmentMutationLoading(
          true,
        );

        setAssignmentMutationError(
          "",
        );

        try {
          const created =
            await service
              .createAssessmentAssignment(
                payload,
              );

          await refreshAssignments();

          if (
            created?.id
          ) {
            selectAssignment(
              created,
            );
          }

          return created;
        } catch (
          error
        ) {
          const message =
            getAssessmentErrorMessage(
              error,
              "Unable to create the assessment assignment.",
            );

          if (
            mountedRef.current
          ) {
            setAssignmentMutationError(
              message,
            );
          }

          throw error;
        } finally {
          if (
            mountedRef.current
          ) {
            setAssignmentMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAssignments,
        refreshAssignments,
        selectAssignment,
      ],
    );

  const updateAssignment =
    useCallback(
      async (
        assignmentId,
        updates = {},
      ) => {
        if (
          !service
        ) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (
          !canUpdateAssignments
        ) {
          throw new Error(
            "You do not have permission to update assessment assignments.",
          );
        }

        const normalizedId =
          normalizeIdentifier(
            assignmentId,
          );

        if (
          !normalizedId
        ) {
          throw new Error(
            "Assessment assignment id is required.",
          );
        }

        setAssignmentMutationLoading(
          true,
        );

        setAssignmentMutationError(
          "",
        );

        try {
          const updated =
            await service
              .updateAssessmentAssignment(
                normalizedId,
                updates,
              );

          if (
            mountedRef.current
          ) {
            setAssignmentResult(
              (
                current,
              ) => ({
                ...current,
                data:
                  replaceRecord(
                    current.data,
                    updated,
                  ),
              }),
            );

            setSelectedAssignment(
              (
                current,
              ) =>
                current?.id ===
                normalizedId
                  ? {
                      ...current,
                      ...updated,
                    }
                  : current,
            );
          }

          return updated;
        } catch (
          error
        ) {
          const message =
            getAssessmentErrorMessage(
              error,
              "Unable to update the assessment assignment.",
            );

          if (
            mountedRef.current
          ) {
            setAssignmentMutationError(
              message,
            );
          }

          throw error;
        } finally {
          if (
            mountedRef.current
          ) {
            setAssignmentMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canUpdateAssignments,
      ],
    );

  const deleteAssignment =
    useCallback(
      async (
        assignmentId,
        deletedBy = null,
      ) => {
        if (
          !service
        ) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (
          !canDeleteAssignments
        ) {
          throw new Error(
            "You do not have permission to delete assessment assignments.",
          );
        }

        const normalizedId =
          normalizeIdentifier(
            assignmentId,
          );

        if (
          !normalizedId
        ) {
          throw new Error(
            "Assessment assignment id is required.",
          );
        }

        setAssignmentMutationLoading(
          true,
        );

        setAssignmentMutationError(
          "",
        );

        try {
          const deleted =
            await service
              .deleteAssessmentAssignment(
                normalizedId,
                deletedBy,
              );

          if (
            mountedRef.current
          ) {
            setAssignmentResult(
              (
                current,
              ) => ({
                ...current,
                data:
                  removeRecord(
                    current.data,
                    normalizedId,
                  ),
                count:
                  Math.max(
                    0,
                    current.count -
                      1,
                  ),
              }),
            );

            if (
              selectedAssignmentId ===
              normalizedId
            ) {
              setSelectedAssignmentId(
                null,
              );

              setSelectedAssignment(
                null,
              );
            }
          }

          return deleted;
        } catch (
          error
        ) {
          const message =
            getAssessmentErrorMessage(
              error,
              "Unable to delete the assessment assignment.",
            );

          if (
            mountedRef.current
          ) {
            setAssignmentMutationError(
              message,
            );
          }

          throw error;
        } finally {
          if (
            mountedRef.current
          ) {
            setAssignmentMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canDeleteAssignments,
        selectedAssignmentId,
      ],
    );

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      assignmentRequestRef.current +=
        1;

      selectedAssignmentRequestRef.current +=
        1;
    };
  }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAssessments
    ) {
      resetAssignments();
    }
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    resetAssignments,
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

    refreshAssignments(
      assignmentFilters,
    );
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    assignmentFilters,
    refreshAssignments,
  ]);

  useEffect(() => {
    if (
      !selectedAssignmentId ||
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAssessments
    ) {
      return;
    }

    refreshSelectedAssignment(
      selectedAssignmentId,
    );
  }, [
    selectedAssignmentId,
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    refreshSelectedAssignment,
  ]);

  return useMemo(
    () => ({
      assignments,
      assignmentResult,

      assignmentFilters,
      setAssignmentFilters,
      updateAssignmentFilters,
      resetAssignmentFilters,

      assignmentsLoading,
      assignmentsError,
      assignmentsReady,

      assignmentMutationLoading,
      assignmentMutationError,

      selectedAssignmentId,
      selectedAssignment,
      selectedAssignmentLoading,
      selectedAssignmentError,

      canCreateAssignments,
      canUpdateAssignments,
      canDeleteAssignments,

      selectAssignment,

      refreshAssignments,
      refreshSelectedAssignment,

      createAssignment,
      updateAssignment,
      deleteAssignment,

      clearAssignmentsError,
      clearAssignmentMutationError,
      clearSelectedAssignmentError,

      resetAssignments,
    }),
    [
      assignments,
      assignmentResult,

      assignmentFilters,
      updateAssignmentFilters,
      resetAssignmentFilters,

      assignmentsLoading,
      assignmentsError,
      assignmentsReady,

      assignmentMutationLoading,
      assignmentMutationError,

      selectedAssignmentId,
      selectedAssignment,
      selectedAssignmentLoading,
      selectedAssignmentError,

      canCreateAssignments,
      canUpdateAssignments,
      canDeleteAssignments,

      selectAssignment,

      refreshAssignments,
      refreshSelectedAssignment,

      createAssignment,
      updateAssignment,
      deleteAssignment,

      clearAssignmentsError,
      clearAssignmentMutationError,
      clearSelectedAssignmentError,

      resetAssignments,
    ],
  );
}

export default useAssessmentAssignmentState;


