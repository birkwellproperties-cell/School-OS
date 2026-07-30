import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const EMPTY_PAGED_RESULT =
  Object.freeze({
    data: [],
    count: 0,
    page: 1,
    pageSize: 100,
    totalPages: 0,
  });

const ACTIVE_ATTEMPT_STATUSES =
  new Set([
    "not_started",
    "in_progress",
    "paused",
  ]);

const FINISHED_ATTEMPT_STATUSES =
  new Set([
    "submitted",
    "grading",
    "completed",
  ]);

const TERMINAL_RECIPIENT_STATUSES =
  new Set([
    "completed",
    "expired",
    "cancelled",
  ]);

function normalizeIdentifier(
  value,
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function normalizeErrorMessage(
  error,
  fallbackMessage,
) {
  if (
    typeof error ===
      "string" &&
    error.trim()
  ) {
    return error.trim();
  }

  if (
    error?.message &&
    typeof error.message ===
      "string"
  ) {
    return error.message;
  }

  return fallbackMessage;
}

function normalizePagedResult(
  result,
) {
  if (
    Array.isArray(result)
  ) {
    return {
      data: result,
      count: result.length,
      page: 1,
      pageSize:
        Math.max(
          result.length,
          1,
        ),
      totalPages:
        result.length
          ? 1
          : 0,
    };
  }

  const data =
    Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result?.items)
        ? result.items
        : [];

  const count =
    Number.isFinite(
      Number(result?.count),
    )
      ? Number(result.count)
      : Number.isFinite(
          Number(result?.total),
        )
        ? Number(result.total)
        : data.length;

  const page =
    Number.isFinite(
      Number(result?.page),
    )
      ? Number(result.page)
      : 1;

  const pageSize =
    Number.isFinite(
      Number(result?.pageSize),
    )
      ? Number(result.pageSize)
      : Math.max(
          data.length,
          1,
        );

  const totalPages =
    Number.isFinite(
      Number(
        result?.totalPages,
      ),
    )
      ? Number(
          result.totalPages,
        )
      : Number.isFinite(
          Number(
            result?.pageCount,
          ),
        )
        ? Number(
            result.pageCount,
          )
        : count
          ? Math.ceil(
              count /
                pageSize,
            )
          : 0;

  return {
    data,
    count,
    page,
    pageSize,
    totalPages,
  };
}

function toTimestamp(
  value,
) {
  if (!value) {
    return null;
  }

  const timestamp =
    new Date(
      value,
    ).getTime();

  return Number.isFinite(
    timestamp,
  )
    ? timestamp
    : null;
}

function sortAttempts(
  attempts,
) {
  return [
    ...(attempts || []),
  ].sort(
    (
      first,
      second,
    ) => {
      const firstNumber =
        Number(
          first?.attempt_number,
        ) || 0;

      const secondNumber =
        Number(
          second?.attempt_number,
        ) || 0;

      if (
        firstNumber !==
        secondNumber
      ) {
        return (
          secondNumber -
          firstNumber
        );
      }

      return (
        (toTimestamp(
          second?.created_at,
        ) || 0) -
        (toTimestamp(
          first?.created_at,
        ) || 0)
      );
    },
  );
}

function getActiveAttempt(
  attempts,
) {
  return (
    sortAttempts(
      attempts,
    ).find(
      (attempt) =>
        ACTIVE_ATTEMPT_STATUSES.has(
          attempt?.status,
        ),
    ) ||
    null
  );
}

function getLatestAttempt(
  attempts,
) {
  return (
    sortAttempts(
      attempts,
    )[0] ||
    null
  );
}

function getMaximumAttempts(
  recipient,
  assignment,
) {
  const override =
    Number(
      recipient
        ?.maximum_attempts_override,
    );

  if (
    Number.isInteger(
      override,
    ) &&
    override > 0
  ) {
    return override;
  }

  const assignmentLimit =
    Number(
      assignment
        ?.maximum_attempts,
    );

  if (
    Number.isInteger(
      assignmentLimit,
    ) &&
    assignmentLimit > 0
  ) {
    return assignmentLimit;
  }

  return 1;
}

function getDurationMinutes(
  recipient,
  assignment,
) {
  const override =
    Number(
      recipient
        ?.duration_minutes_override,
    );

  if (
    Number.isFinite(
      override,
    ) &&
    override > 0
  ) {
    return override;
  }

  const assignmentDuration =
    Number(
      assignment
        ?.duration_minutes,
    );

  if (
    Number.isFinite(
      assignmentDuration,
    ) &&
    assignmentDuration > 0
  ) {
    return assignmentDuration;
  }

  return null;
}

function resolveAvailability(
  recipient,
  assignment,
  attempts,
  nowTimestamp,
) {
  const recipientStatus =
    recipient?.status ||
    "assigned";

  const assignmentStatus =
    assignment?.status ||
    "";

  const availableFrom =
    toTimestamp(
      recipient
        ?.available_from ||
        assignment?.opens_at,
    );

  const expiresAt =
    toTimestamp(
      recipient?.expires_at ||
        assignment?.closes_at,
    );

  const dueAt =
    toTimestamp(
      recipient?.due_at ||
        assignment?.due_at,
    );

  const activeAttempt =
    getActiveAttempt(
      attempts,
    );

  const latestAttempt =
    getLatestAttempt(
      attempts,
    );

  const maximumAttempts =
    getMaximumAttempts(
      recipient,
      assignment,
    );

  const attemptCount =
    attempts.length;

  const attemptsRemaining =
    Math.max(
      maximumAttempts -
        attemptCount,
      0,
    );

  const isBeforeWindow =
    availableFrom !== null &&
    nowTimestamp <
      availableFrom;

  const isAfterWindow =
    expiresAt !== null &&
    nowTimestamp >
      expiresAt;

  const isCancelled =
    recipientStatus ===
      "cancelled" ||
    assignmentStatus ===
      "cancelled";

  const isCompleted =
    recipientStatus ===
      "completed" ||
    latestAttempt?.status ===
      "completed";

  const isSubmitted =
    recipientStatus ===
      "submitted" ||
    FINISHED_ATTEMPT_STATUSES.has(
      latestAttempt?.status,
    );

  const canResume =
    Boolean(
      activeAttempt,
    ) &&
    !isCancelled &&
    !isAfterWindow;

  const canStart =
    !activeAttempt &&
    !isCancelled &&
    !isCompleted &&
    !isSubmitted &&
    !isBeforeWindow &&
    !isAfterWindow &&
    attemptsRemaining > 0 &&
    [
      "open",
      "scheduled",
    ].includes(
      assignmentStatus,
    );

  let availabilityStatus =
    "available";

  if (isCancelled) {
    availabilityStatus =
      "cancelled";
  } else if (
    isCompleted
  ) {
    availabilityStatus =
      "completed";
  } else if (
    isSubmitted
  ) {
    availabilityStatus =
      "submitted";
  } else if (
    isAfterWindow ||
    recipientStatus ===
      "expired" ||
    assignmentStatus ===
      "closed"
  ) {
    availabilityStatus =
      "expired";
  } else if (
    canResume
  ) {
    availabilityStatus =
      "in_progress";
  } else if (
    isBeforeWindow
  ) {
    availabilityStatus =
      "upcoming";
  } else if (
    attemptsRemaining <= 0
  ) {
    availabilityStatus =
      "attempts_exhausted";
  } else if (
    canStart
  ) {
    availabilityStatus =
      "available";
  } else {
    availabilityStatus =
      "unavailable";
  }

  return {
    availabilityStatus,

    availableFrom,
    dueAt,
    expiresAt,

    activeAttempt,
    latestAttempt,

    maximumAttempts,
    attemptCount,
    attemptsRemaining,

    durationMinutes:
      getDurationMinutes(
        recipient,
        assignment,
      ),

    canStart,
    canResume,
  };
}

async function loadRecipientRuntimeRecord({
  service,
  recipient,
  nowTimestamp,
}) {
  const [
    assignment,
    attemptResult,
  ] = await Promise.all([
    service
      .getAssessmentAssignment(
        recipient.assignment_id,
      ),

    service
      .getAssessmentAttempts({
        recipientId:
          recipient.id,

        assignmentId:
          recipient.assignment_id,

        sortBy:
          "attempt_number",

        sortDirection:
          "desc",

        page: 1,
        pageSize: 100,
      }),
  ]);

  const normalizedAttempts =
    normalizePagedResult(
      attemptResult,
    );

  const attempts =
    sortAttempts(
      normalizedAttempts.data,
    );

  const availability =
    resolveAvailability(
      recipient,
      assignment,
      attempts,
      nowTimestamp,
    );

  return {
    id:
      recipient.id,

    recipient,
    assignment,
    attempts,

    ...availability,
  };
}

function groupRuntimeRecords(
  records,
) {
  const groups = {
    available: [],
    inProgress: [],
    upcoming: [],
    submitted: [],
    completed: [],
    expired: [],
    unavailable: [],
  };

  records.forEach(
    (record) => {
      switch (
        record
          .availabilityStatus
      ) {
        case "available":
          groups.available.push(
            record,
          );
          break;

        case "in_progress":
          groups.inProgress.push(
            record,
          );
          break;

        case "upcoming":
          groups.upcoming.push(
            record,
          );
          break;

        case "submitted":
          groups.submitted.push(
            record,
          );
          break;

        case "completed":
          groups.completed.push(
            record,
          );
          break;

        case "expired":
        case "cancelled":
        case "attempts_exhausted":
          groups.expired.push(
            record,
          );
          break;

        default:
          groups.unavailable.push(
            record,
          );
      }
    },
  );

  return groups;
}

function sortRuntimeRecords(
  records,
) {
  return [
    ...records,
  ].sort(
    (
      first,
      second,
    ) => {
      const firstDue =
        first.dueAt ??
        first.expiresAt ??
        Number.MAX_SAFE_INTEGER;

      const secondDue =
        second.dueAt ??
        second.expiresAt ??
        Number.MAX_SAFE_INTEGER;

      if (
        firstDue !==
        secondDue
      ) {
        return (
          firstDue -
          secondDue
        );
      }

      const firstAssigned =
        toTimestamp(
          first.recipient
            ?.assigned_at,
        ) || 0;

      const secondAssigned =
        toTimestamp(
          second.recipient
            ?.assigned_at,
        ) || 0;

      return (
        secondAssigned -
        firstAssigned
      );
    },
  );
}

export function useStudentAssessmentState({
  service,

  currentUserId,

  workspaceReady,
  authorizationReady,
  canTakeAssessments,
}) {
  const mountedRef =
    useRef(
      true,
    );

  const requestRef =
    useRef(
      0,
    );

  const [
    studentAssessmentResult,
    setStudentAssessmentResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    studentAssessmentsLoading,
    setStudentAssessmentsLoading,
  ] = useState(
    false,
  );

  const [
    studentAssessmentsError,
    setStudentAssessmentsError,
  ] = useState(
    "",
  );

  const [
    studentAssessmentsReady,
    setStudentAssessmentsReady,
  ] = useState(
    false,
  );

  const [
    selectedStudentAssessmentId,
    setSelectedStudentAssessmentId,
  ] = useState(
    null,
  );

  const studentAssessments =
    studentAssessmentResult.data;

  const selectedStudentAssessment =
    useMemo(
      () =>
        studentAssessments.find(
          (record) =>
            record.id ===
            selectedStudentAssessmentId,
        ) ||
        null,
      [
        studentAssessments,
        selectedStudentAssessmentId,
      ],
    );

  const studentAssessmentGroups =
    useMemo(
      () =>
        groupRuntimeRecords(
          studentAssessments,
        ),
      [
        studentAssessments,
      ],
    );

  const canLoadStudentAssessments =
    Boolean(
      service &&
      currentUserId &&
      workspaceReady &&
      authorizationReady &&
      canTakeAssessments,
    );

  const clearStudentAssessmentsError =
    useCallback(() => {
      setStudentAssessmentsError(
        "",
      );
    }, []);

  const selectStudentAssessment =
    useCallback(
      (
        recipientId,
      ) => {
        const normalizedId =
          normalizeIdentifier(
            recipientId,
          );

        setSelectedStudentAssessmentId(
          normalizedId ||
            null,
        );
      },
      [],
    );

  const resetStudentAssessments =
    useCallback(() => {
      requestRef.current +=
        1;

      setStudentAssessmentResult(
        EMPTY_PAGED_RESULT,
      );

      setStudentAssessmentsLoading(
        false,
      );

      setStudentAssessmentsError(
        "",
      );

      setStudentAssessmentsReady(
        false,
      );

      setSelectedStudentAssessmentId(
        null,
      );
    }, []);

  const refreshStudentAssessments =
    useCallback(
      async () => {
        if (
          !canLoadStudentAssessments
        ) {
          resetStudentAssessments();
          return EMPTY_PAGED_RESULT;
        }

        const requestId =
          requestRef.current +
          1;

        requestRef.current =
          requestId;

        setStudentAssessmentsLoading(
          true,
        );

        setStudentAssessmentsError(
          "",
        );

        try {
          const recipientResult =
            await service
              .getAssessmentAssignmentRecipients({
                recipientProfileId:
                  currentUserId,

                statuses: [
                  "assigned",
                  "not_started",
                  "in_progress",
                  "submitted",
                  "completed",
                  "expired",
                  "cancelled",
                ],

                sortBy:
                  "assigned_at",

                sortDirection:
                  "desc",

                page: 1,
                pageSize: 100,
              });

          const normalizedRecipients =
            normalizePagedResult(
              recipientResult,
            );

          const nowTimestamp =
            Date.now();

          const records =
            await Promise.all(
              normalizedRecipients
                .data
                .filter(
                  (recipient) =>
                    recipient?.id &&
                    recipient
                      ?.assignment_id &&
                    !TERMINAL_RECIPIENT_STATUSES.has(
                      recipient
                        ?.status,
                    ) ||
                    recipient
                      ?.status ===
                      "completed" ||
                    recipient
                      ?.status ===
                      "expired" ||
                    recipient
                      ?.status ===
                      "cancelled",
                )
                .map(
                  (recipient) =>
                    loadRecipientRuntimeRecord({
                      service,
                      recipient,
                      nowTimestamp,
                    }),
                ),
            );

          const sortedRecords =
            sortRuntimeRecords(
              records,
            );

          const nextResult = {
            data:
              sortedRecords,

            count:
              sortedRecords.length,

            page: 1,
            pageSize: 100,

            totalPages:
              sortedRecords.length
                ? 1
                : 0,
          };

          if (
            !mountedRef.current ||
            requestRef.current !==
              requestId
          ) {
            return nextResult;
          }

          setStudentAssessmentResult(
            nextResult,
          );

          setStudentAssessmentsReady(
            true,
          );

          setSelectedStudentAssessmentId(
            (
              currentId,
            ) => {
              if (
                currentId &&
                sortedRecords.some(
                  (record) =>
                    record.id ===
                    currentId,
                )
              ) {
                return currentId;
              }

              return (
                sortedRecords[0]
                  ?.id ||
                null
              );
            },
          );

          return nextResult;
        } catch (error) {
          if (
            !mountedRef.current ||
            requestRef.current !==
              requestId
          ) {
            return EMPTY_PAGED_RESULT;
          }

          const message =
            normalizeErrorMessage(
              error,
              "Unable to load your assigned assessments.",
            );

          setStudentAssessmentResult(
            EMPTY_PAGED_RESULT,
          );

          setStudentAssessmentsError(
            message,
          );

          setStudentAssessmentsReady(
            false,
          );

          throw error;
        } finally {
          if (
            mountedRef.current &&
            requestRef.current ===
              requestId
          ) {
            setStudentAssessmentsLoading(
              false,
            );
          }
        }
      },
      [
        service,
        currentUserId,
        canLoadStudentAssessments,
        resetStudentAssessments,
      ],
    );

  const getStudentAssessment =
    useCallback(
      (
        recipientId,
      ) => {
        const normalizedId =
          normalizeIdentifier(
            recipientId,
          );

        if (
          !normalizedId
        ) {
          return null;
        }

        return (
          studentAssessments.find(
            (record) =>
              record.id ===
              normalizedId,
          ) ||
          null
        );
      },
      [
        studentAssessments,
      ],
    );

  const getStudentAssessmentLaunch =
    useCallback(
      (
        recipientId,
      ) => {
        const record =
          getStudentAssessment(
            recipientId,
          );

        if (!record) {
          return {
            action:
              "unavailable",

            attemptId:
              null,

            recipientId:
              null,
          };
        }

        if (
          record.canResume &&
          record.activeAttempt
        ) {
          return {
            action:
              "resume",

            attemptId:
              record
                .activeAttempt
                .id,

            recipientId:
              record.id,
          };
        }

        if (
          record.canStart
        ) {
          return {
            action:
              "start",

            attemptId:
              null,

            recipientId:
              record.id,
          };
        }

        return {
          action:
            "unavailable",

          attemptId:
            record
              .latestAttempt
              ?.id ||
            null,

          recipientId:
            record.id,
        };
      },
      [
        getStudentAssessment,
      ],
    );

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      requestRef.current +=
        1;
    };
  }, []);

  useEffect(() => {
    if (
      !canLoadStudentAssessments
    ) {
      resetStudentAssessments();
      return;
    }

    refreshStudentAssessments()
      .catch(
        () => {
          // Error state is handled by the hook.
        },
      );
  }, [
    canLoadStudentAssessments,
    refreshStudentAssessments,
    resetStudentAssessments,
  ]);

  return useMemo(
    () => ({
      studentAssessments,
      studentAssessmentResult,
      studentAssessmentGroups,

      studentAssessmentsLoading,
      studentAssessmentsError,
      studentAssessmentsReady,

      selectedStudentAssessmentId,
      selectedStudentAssessment,

      canLoadStudentAssessments,

      selectStudentAssessment,
      getStudentAssessment,
      getStudentAssessmentLaunch,

      refreshStudentAssessments,
      resetStudentAssessments,
      clearStudentAssessmentsError,
    }),
    [
      studentAssessments,
      studentAssessmentResult,
      studentAssessmentGroups,

      studentAssessmentsLoading,
      studentAssessmentsError,
      studentAssessmentsReady,

      selectedStudentAssessmentId,
      selectedStudentAssessment,

      canLoadStudentAssessments,

      selectStudentAssessment,
      getStudentAssessment,
      getStudentAssessmentLaunch,

      refreshStudentAssessments,
      resetStudentAssessments,
      clearStudentAssessmentsError,
    ],
  );
}

export default useStudentAssessmentState;