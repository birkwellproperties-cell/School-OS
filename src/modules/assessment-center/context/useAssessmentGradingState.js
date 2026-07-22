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

const DEFAULT_GRADING_FILTERS = Object.freeze({
  search: "",
  assignmentId: "",
  recipientId: "",
  status: "",
  gradingStatus: "",
  page: 1,
  pageSize: 25,
  sortBy: "submitted_at",
  sortDirection: "desc",
});

const EMPTY_PAGED_RESULT = Object.freeze({
  data: [],
  count: 0,
  page: 1,
  pageSize: 25,
  totalPages: 0,
});

function normalizeIdentifier(value) {
  const normalized =
    String(value ?? "").trim();

  return normalized || null;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizePositiveInteger(
  value,
  fallback,
) {
  const parsed =
    Number.parseInt(value, 10);

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : fallback;
}

function normalizeNumber(
  value,
  fallback = 0,
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function normalizeFilters(
  filters = {},
) {
  return {
    search:
      normalizeText(
        filters.search,
      ),

    assignmentId:
      normalizeText(
        filters.assignmentId,
      ),

    recipientId:
      normalizeText(
        filters.recipientId,
      ),

    status:
      normalizeText(
        filters.status,
      ),

    gradingStatus:
      normalizeText(
        filters.gradingStatus,
      ),

    page:
      normalizePositiveInteger(
        filters.page,
        DEFAULT_GRADING_FILTERS.page,
      ),

    pageSize:
      normalizePositiveInteger(
        filters.pageSize,
        DEFAULT_GRADING_FILTERS.pageSize,
      ),

    sortBy:
      normalizeText(
        filters.sortBy ||
          DEFAULT_GRADING_FILTERS.sortBy,
      ),

    sortDirection:
      normalizeText(
        filters.sortDirection ||
          DEFAULT_GRADING_FILTERS.sortDirection,
      ).toLowerCase() === "asc"
        ? "asc"
        : "desc",
  };
}

function removeEmptyFilters(
  filters = {},
) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== "",
    ),
  );
}

function createAttemptServiceFilters(
  filters,
) {
  return removeEmptyFilters({
    search:
      normalizeIdentifier(
        filters.search,
      ),

    assignmentId:
      normalizeIdentifier(
        filters.assignmentId,
      ),

    recipientId:
      normalizeIdentifier(
        filters.recipientId,
      ),

    status:
      normalizeIdentifier(
        filters.status,
      ),

    gradingStatus:
      normalizeIdentifier(
        filters.gradingStatus,
      ),

    page:
      filters.page,

    pageSize:
      filters.pageSize,

    sortBy:
      filters.sortBy,

    sortDirection:
      filters.sortDirection,
  });
}

function normalizeCollection(
  result,
) {
  if (
    Array.isArray(result?.data)
  ) {
    return result.data;
  }

  if (Array.isArray(result)) {
    return result;
  }

  return [];
}

function normalizePagedResult(
  result,
  filters,
) {
  const data =
    normalizeCollection(result);

  const countValue =
    Number(result?.count);

  const count =
    Number.isFinite(countValue)
      ? countValue
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

  const totalPagesValue =
    Number(result?.totalPages);

  const totalPages =
    Number.isFinite(
      totalPagesValue,
    )
      ? totalPagesValue
      : count > 0
        ? Math.ceil(
            count / pageSize,
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

function replaceRecord(
  records,
  updated,
) {
  if (
    !updated?.id ||
    !Array.isArray(records)
  ) {
    return records;
  }

  return records.map(
    (record) =>
      record?.id === updated.id
        ? {
            ...record,
            ...updated,
          }
        : record,
  );
}

function findLatestResult(
  results,
) {
  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {
    return null;
  }

  return results[0] ?? null;
}

function getResponseScore(
  response,
) {
  return normalizeNumber(
    response?.marks_awarded ??
      response?.score_awarded ??
      response?.awarded_score ??
      response?.raw_score,
    0,
  );
}

function getQuestionMaximumScore(
  question,
) {
  return normalizeNumber(
    question?.maximum_score ??
      question?.marks_available ??
      question?.marks ??
      question?.points ??
      question?.score,
    0,
  );
}

function calculateSubmissionScore(
  attemptQuestions,
  responses,
) {
  const responseList =
    Array.isArray(responses)
      ? responses
      : [];

  const questionList =
    Array.isArray(
      attemptQuestions,
    )
      ? attemptQuestions
      : [];

  const rawScore =
    responseList.reduce(
      (total, response) =>
        total +
        getResponseScore(
          response,
        ),
      0,
    );

  const maximumFromQuestions =
    questionList.reduce(
      (total, question) =>
        total +
        getQuestionMaximumScore(
          question,
        ),
      0,
    );

  const maximumFromResponses =
    responseList.reduce(
      (total, response) =>
        total +
        normalizeNumber(
          response?.maximum_score ??
            response?.marks_available,
          0,
        ),
      0,
    );

  const maximumScore =
    maximumFromQuestions > 0
      ? maximumFromQuestions
      : maximumFromResponses;

  const percentageScore =
    maximumScore > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Number(
              (
                (
                  rawScore /
                  maximumScore
                ) *
                100
              ).toFixed(2),
            ),
          ),
        )
      : null;

  return {
    maximumScore,
    rawScore,
    percentageScore,
  };
}

export function useAssessmentGradingState({
  service,

  workspaceReady,
  authorizationReady,
  canViewAssessments,

  canGradeAssessments,
  canReviewAssessments,
  canManageAssessments,

  currentUserId = null,
}) {
  const mountedRef =
    useRef(true);

  const attemptsRequestRef =
    useRef(0);

  const selectedRequestRef =
    useRef(0);

  const mutationRequestRef =
    useRef(0);

  const [
    gradingFilters,
    setGradingFilters,
  ] = useState(
    DEFAULT_GRADING_FILTERS,
  );

  const [
    attemptResult,
    setAttemptResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    gradingQueueLoading,
    setGradingQueueLoading,
  ] = useState(false);

  const [
    gradingQueueError,
    setGradingQueueError,
  ] = useState("");

  const [
    gradingMutationLoading,
    setGradingMutationLoading,
  ] = useState(false);

  const [
    gradingMutationError,
    setGradingMutationError,
  ] = useState("");

  const [
    selectedAttemptId,
    setSelectedAttemptId,
  ] = useState(null);

  const [
    selectedAttempt,
    setSelectedAttempt,
  ] = useState(null);

  const [
    selectedAttemptQuestions,
    setSelectedAttemptQuestions,
  ] = useState([]);

  const [
    selectedResponses,
    setSelectedResponses,
  ] = useState([]);

  const [
    selectedResult,
    setSelectedResult,
  ] = useState(null);

  const [
    selectedSubmissionLoading,
    setSelectedSubmissionLoading,
  ] = useState(false);

  const [
    selectedSubmissionError,
    setSelectedSubmissionError,
  ] = useState("");

  const canAccessGrading =
    Boolean(
      canViewAssessments &&
        (
          canGradeAssessments ||
          canReviewAssessments ||
          canManageAssessments
        ),
    );

  const canGradeSubmissions =
    Boolean(
      canGradeAssessments ||
        canManageAssessments,
    );

  const canReviewGrades =
    Boolean(
      canReviewAssessments ||
        canManageAssessments,
    );

  const canReleaseResults =
    Boolean(
      canReviewAssessments ||
        canManageAssessments,
    );

  const attempts =
    attemptResult.data;

  const updateGradingFilters =
    useCallback(
      (updates = {}) => {
        setGradingFilters(
          (current) => {
            const next =
              normalizeFilters({
                ...current,
                ...updates,
              });

            const queryChanged =
              updates.search !==
                undefined ||
              updates.assignmentId !==
                undefined ||
              updates.recipientId !==
                undefined ||
              updates.status !==
                undefined ||
              updates.gradingStatus !==
                undefined ||
              updates.pageSize !==
                undefined ||
              updates.sortBy !==
                undefined ||
              updates.sortDirection !==
                undefined;

            if (
              queryChanged &&
              updates.page ===
                undefined
            ) {
              return {
                ...next,
                page: 1,
              };
            }

            return next;
          },
        );
      },
      [],
    );

  const resetGradingFilters =
    useCallback(() => {
      setGradingFilters(
        DEFAULT_GRADING_FILTERS,
      );
    }, []);

  const clearGradingQueueError =
    useCallback(() => {
      setGradingQueueError("");
    }, []);

  const clearGradingMutationError =
    useCallback(() => {
      setGradingMutationError("");
    }, []);

  const clearSelectedSubmissionError =
    useCallback(() => {
      setSelectedSubmissionError("");
    }, []);

  const resetSelectedSubmission =
    useCallback(() => {
      selectedRequestRef.current += 1;

      setSelectedAttemptId(null);
      setSelectedAttempt(null);
      setSelectedAttemptQuestions([]);
      setSelectedResponses([]);
      setSelectedResult(null);

      setSelectedSubmissionLoading(
        false,
      );

      setSelectedSubmissionError("");
    }, []);

  const resetGrading =
    useCallback(() => {
      attemptsRequestRef.current += 1;
      selectedRequestRef.current += 1;
      mutationRequestRef.current += 1;

      setAttemptResult(
        EMPTY_PAGED_RESULT,
      );

      setGradingQueueLoading(false);
      setGradingQueueError("");

      setGradingMutationLoading(
        false,
      );

      setGradingMutationError("");

      setSelectedAttemptId(null);
      setSelectedAttempt(null);
      setSelectedAttemptQuestions([]);
      setSelectedResponses([]);
      setSelectedResult(null);

      setSelectedSubmissionLoading(
        false,
      );

      setSelectedSubmissionError("");
    }, []);

  const loadGradingQueue =
    useCallback(
      async ({
        filters =
          gradingFilters,

        preserveSelection =
          true,
      } = {}) => {
        if (
          !service ||
          !workspaceReady ||
          !authorizationReady ||
          !canAccessGrading
        ) {
          attemptsRequestRef.current +=
            1;

          if (mountedRef.current) {
            setAttemptResult(
              EMPTY_PAGED_RESULT,
            );

            setGradingQueueLoading(
              false,
            );

            setGradingQueueError("");
          }

          return EMPTY_PAGED_RESULT;
        }

        const normalizedFilters =
          normalizeFilters(
            filters,
          );

        const requestId =
          ++attemptsRequestRef.current;

        if (mountedRef.current) {
          setGradingQueueLoading(true);
          setGradingQueueError("");
        }

        try {
          const result =
            await service
              .getAssessmentAttempts(
                createAttemptServiceFilters(
                  normalizedFilters,
                ),
              );

          const normalizedResult =
            normalizePagedResult(
              result,
              normalizedFilters,
            );

          if (
            !mountedRef.current ||
            requestId !==
              attemptsRequestRef.current
          ) {
            return normalizedResult;
          }

          setAttemptResult(
            normalizedResult,
          );

          setSelectedAttempt(
            (current) => {
              if (!current?.id) {
                return current;
              }

              const refreshed =
                normalizedResult.data.find(
                  (attempt) =>
                    attempt?.id ===
                    current.id,
                );

              return refreshed
                ? {
                    ...current,
                    ...refreshed,
                  }
                : current;
            },
          );

          if (
            !preserveSelection &&
            selectedAttemptId
          ) {
            resetSelectedSubmission();
          }

          return normalizedResult;
        } catch (error) {
          const message =
            getAssessmentErrorMessage(
              error,
              "Unable to load the grading queue.",
            );

          if (
            mountedRef.current &&
            requestId ===
              attemptsRequestRef.current
          ) {
            setGradingQueueError(
              message,
            );
          }

          throw error;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              attemptsRequestRef.current
          ) {
            setGradingQueueLoading(
              false,
            );
          }
        }
      },
      [
        service,
        workspaceReady,
        authorizationReady,
        canAccessGrading,
        gradingFilters,
        selectedAttemptId,
        resetSelectedSubmission,
      ],
    );

  const refreshGradingQueue =
    useCallback(
      async () =>
        loadGradingQueue({
          filters:
            gradingFilters,

          preserveSelection:
            true,
        }),
      [
        loadGradingQueue,
        gradingFilters,
      ],
    );

  const loadSelectedSubmission =
    useCallback(
      async (
        attemptId,
        {
          preserveCurrent =
            false,
        } = {},
      ) => {
        const normalizedAttemptId =
          normalizeIdentifier(
            attemptId,
          );

        if (!normalizedAttemptId) {
          resetSelectedSubmission();

          return {
            attempt: null,
            questions: [],
            responses: [],
            result: null,
          };
        }

        if (
          !service ||
          !workspaceReady ||
          !authorizationReady ||
          !canAccessGrading
        ) {
          resetSelectedSubmission();

          return {
            attempt: null,
            questions: [],
            responses: [],
            result: null,
          };
        }

        const requestId =
          ++selectedRequestRef.current;

        if (mountedRef.current) {
          setSelectedAttemptId(
            normalizedAttemptId,
          );

          setSelectedSubmissionLoading(
            true,
          );

          setSelectedSubmissionError(
            "",
          );

          if (!preserveCurrent) {
            setSelectedAttempt(null);
            setSelectedAttemptQuestions(
              [],
            );
            setSelectedResponses([]);
            setSelectedResult(null);
          }
        }

        try {
          const [
            attempt,
            questionResult,
            responseResult,
            resultResult,
          ] = await Promise.all([
            service
              .getAssessmentAttempt(
                normalizedAttemptId,
              ),

            service
              .getAssessmentAttemptQuestions({
                attemptId:
                  normalizedAttemptId,

                page: 1,
                pageSize: 500,

                sortBy:
                  "display_order",

                sortDirection:
                  "asc",
              }),

            service
              .getAssessmentResponses({
                attemptId:
                  normalizedAttemptId,

                page: 1,
                pageSize: 500,

                sortBy:
                  "created_at",

                sortDirection:
                  "asc",
              }),

            service
              .getAssessmentResults({
                attemptId:
                  normalizedAttemptId,

                page: 1,
                pageSize: 25,

                sortBy:
                  "created_at",

                sortDirection:
                  "desc",
              }),
          ]);

          const questions =
            normalizeCollection(
              questionResult,
            );

          const responses =
            normalizeCollection(
              responseResult,
            );

          const results =
            normalizeCollection(
              resultResult,
            );

          const submission = {
            attempt:
              attempt ?? null,

            questions,

            responses,

            result:
              findLatestResult(
                results,
              ),
          };

          if (
            !mountedRef.current ||
            requestId !==
              selectedRequestRef.current
          ) {
            return submission;
          }

          setSelectedAttempt(
            submission.attempt,
          );

          setSelectedAttemptQuestions(
            submission.questions,
          );

          setSelectedResponses(
            submission.responses,
          );

          setSelectedResult(
            submission.result,
          );

          return submission;
        } catch (error) {
          const message =
            getAssessmentErrorMessage(
              error,
              "Unable to load the selected assessment submission.",
            );

          if (
            mountedRef.current &&
            requestId ===
              selectedRequestRef.current
          ) {
            setSelectedSubmissionError(
              message,
            );

            if (!preserveCurrent) {
              setSelectedAttempt(null);
              setSelectedAttemptQuestions(
                [],
              );
              setSelectedResponses([]);
              setSelectedResult(null);
            }
          }

          throw error;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              selectedRequestRef.current
          ) {
            setSelectedSubmissionLoading(
              false,
            );
          }
        }
      },
      [
        service,
        workspaceReady,
        authorizationReady,
        canAccessGrading,
        resetSelectedSubmission,
      ],
    );

  const selectSubmission =
    useCallback(
      async (
        attemptOrId,
      ) => {
        const suppliedAttempt =
          typeof attemptOrId ===
            "object" &&
          attemptOrId !== null
            ? attemptOrId
            : null;

        const attemptId =
          normalizeIdentifier(
            suppliedAttempt?.id ||
              attemptOrId,
          );

        if (!attemptId) {
          resetSelectedSubmission();
          return null;
        }

        if (suppliedAttempt) {
          setSelectedAttempt(
            suppliedAttempt,
          );
        }

        return loadSelectedSubmission(
          attemptId,
          {
            preserveCurrent:
              Boolean(
                suppliedAttempt,
              ),
          },
        );
      },
      [
        loadSelectedSubmission,
        resetSelectedSubmission,
      ],
    );

  const refreshSelectedSubmission =
    useCallback(
      async () => {
        if (!selectedAttemptId) {
          return null;
        }

        return loadSelectedSubmission(
          selectedAttemptId,
          {
            preserveCurrent:
              true,
          },
        );
      },
      [
        selectedAttemptId,
        loadSelectedSubmission,
      ],
    );

  const executeGradingMutation =
    useCallback(
      async (
        operation,
        fallbackMessage,
      ) => {
        if (
          typeof operation !==
          "function"
        ) {
          throw new TypeError(
            "A grading mutation operation is required.",
          );
        }

        const requestId =
          ++mutationRequestRef.current;

        if (mountedRef.current) {
          setGradingMutationLoading(
            true,
          );

          setGradingMutationError("");
        }

        try {
          return await operation();
        } catch (error) {
          const message =
            getAssessmentErrorMessage(
              error,
              fallbackMessage,
            );

          if (
            mountedRef.current &&
            requestId ===
              mutationRequestRef.current
          ) {
            setGradingMutationError(
              message,
            );
          }

          throw error;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              mutationRequestRef.current
          ) {
            setGradingMutationLoading(
              false,
            );
          }
        }
      },
      [],
    );

  const saveResponseGrade =
    useCallback(
      async (
        responseOrId,
        updates = {},
      ) => {
        if (!canGradeSubmissions) {
          throw new Error(
            "You do not have permission to grade assessment responses.",
          );
        }

        const response =
          typeof responseOrId ===
            "object" &&
          responseOrId !== null
            ? responseOrId
            : null;

        const responseId =
          normalizeIdentifier(
            response?.id ||
              responseOrId,
          );

        if (!responseId) {
          throw new Error(
            "Assessment response id is required.",
          );
        }

        return executeGradingMutation(
          async () => {
            const updated =
              await service
                .updateAssessmentResponse(
                  responseId,
                  updates,
                );

            if (mountedRef.current) {
              setSelectedResponses(
                (current) =>
                  replaceRecord(
                    current,
                    updated,
                  ),
              );
            }

            return updated;
          },
          "Unable to save the assessment response grade.",
        );
      },
      [
        service,
        canGradeSubmissions,
        executeGradingMutation,
      ],
    );

  const saveResponseFeedback =
    useCallback(
      async (
        responseOrId,
        feedback,
        additionalUpdates = {},
      ) =>
        saveResponseGrade(
          responseOrId,
          {
            ...additionalUpdates,
            feedback:
              feedback ?? null,
          },
        ),
      [saveResponseGrade],
    );

  const saveResult =
    useCallback(
      async (
        updates = {},
        {
          refreshQueue =
            true,
        } = {},
      ) => {
        if (!canGradeSubmissions) {
          throw new Error(
            "You do not have permission to save assessment results.",
          );
        }

        if (
          !selectedAttempt?.id
        ) {
          throw new Error(
            "Select an assessment submission before saving a result.",
          );
        }

        return executeGradingMutation(
          async () => {
            const existingResultId =
              normalizeIdentifier(
                selectedResult?.id,
              );

            let savedResult;

            if (existingResultId) {
              savedResult =
                await service
                  .updateAssessmentResult(
                    existingResultId,
                    updates,
                  );
            } else {
              const assignmentId =
                normalizeIdentifier(
                  updates.assignment_id ??
                    selectedAttempt
                      .assignment_id,
                );

              const recipientId =
                normalizeIdentifier(
                  updates.recipient_id ??
                    selectedAttempt
                      .recipient_id,
                );

              const templateId =
                normalizeIdentifier(
                  updates.template_id ??
                    selectedAttempt
                      .template_id,
                );

              if (
                !assignmentId ||
                !recipientId ||
                !templateId
              ) {
                throw new Error(
                  "The selected attempt is missing assignment, recipient, or template information.",
                );
              }

              savedResult =
                await service
                  .createAssessmentResult({
                    assignment_id:
                      assignmentId,

                    recipient_id:
                      recipientId,

                    attempt_id:
                      selectedAttempt.id,

                    template_id:
                      templateId,

                    ...updates,
                  });
            }

            if (mountedRef.current) {
              setSelectedResult(
                savedResult,
              );
            }

            if (refreshQueue) {
              await loadGradingQueue({
                filters:
                  gradingFilters,

                preserveSelection:
                  true,
              });
            }

            return savedResult;
          },
          "Unable to save the assessment result.",
        );
      },
      [
        service,
        canGradeSubmissions,
        selectedAttempt,
        selectedResult,
        executeGradingMutation,
        loadGradingQueue,
        gradingFilters,
      ],
    );

  const calculateResult =
    useCallback(
      (
        overrides = {},
      ) => {
        const score =
          calculateSubmissionScore(
            selectedAttemptQuestions,
            selectedResponses,
          );

        return {
          maximum_score:
            score.maximumScore,

          raw_score:
            score.rawScore,

          percentage_score:
            score.percentageScore,

          ...overrides,
        };
      },
      [
        selectedAttemptQuestions,
        selectedResponses,
      ],
    );

  const finalizeGrading =
    useCallback(
      async ({
        status = "finalized",
        resultUpdates = {},
      } = {}) => {
        if (!canGradeSubmissions) {
          throw new Error(
            "You do not have permission to finalize assessment grading.",
          );
        }

        const calculated =
          calculateResult();

        return saveResult({
          ...calculated,
          ...resultUpdates,

          status,

          graded_by:
            resultUpdates
              .graded_by ??
            currentUserId ??
            null,

          graded_at:
            resultUpdates
              .graded_at ??
            new Date().toISOString(),
        });
      },
      [
        canGradeSubmissions,
        calculateResult,
        saveResult,
        currentUserId,
      ],
    );

  const reviewResult =
    useCallback(
      async ({
        status = "reviewed",
        resultUpdates = {},
      } = {}) => {
        if (!canReviewGrades) {
          throw new Error(
            "You do not have permission to review assessment results.",
          );
        }

        return saveResult({
          ...resultUpdates,

          status,

          reviewed_by:
            resultUpdates
              .reviewed_by ??
            currentUserId ??
            null,

          reviewed_at:
            resultUpdates
              .reviewed_at ??
            new Date().toISOString(),
        });
      },
      [
        canReviewGrades,
        saveResult,
        currentUserId,
      ],
    );

  const releaseResult =
    useCallback(
      async ({
        status = "released",
        resultUpdates = {},
      } = {}) => {
        if (!canReleaseResults) {
          throw new Error(
            "You do not have permission to release assessment results.",
          );
        }

        return saveResult({
          ...resultUpdates,

          status,

          released_by:
            resultUpdates
              .released_by ??
            currentUserId ??
            null,

          released_at:
            resultUpdates
              .released_at ??
            new Date().toISOString(),
        });
      },
      [
        canReleaseResults,
        saveResult,
        currentUserId,
      ],
    );

  const refreshGrading =
    useCallback(
      async () => {
        const queuePromise =
          refreshGradingQueue();

        const submissionPromise =
          selectedAttemptId
            ? refreshSelectedSubmission()
            : Promise.resolve(null);

        const [
          queue,
          submission,
        ] = await Promise.all([
          queuePromise,
          submissionPromise,
        ]);

        return {
          queue,
          submission,
        };
      },
      [
        refreshGradingQueue,
        selectedAttemptId,
        refreshSelectedSubmission,
      ],
    );

  const getAttemptQuestionForResponse =
    useCallback(
      (response) => {
        if (!response) {
          return null;
        }

        return (
          selectedAttemptQuestions.find(
            (attemptQuestion) =>
              attemptQuestion?.id ===
                response
                  .attempt_question_id ||
              (
                attemptQuestion
                  ?.question_id &&
                attemptQuestion
                  .question_id ===
                  response.question_id
              ),
          ) || null
        );
      },
      [
        selectedAttemptQuestions,
      ],
    );

  const getResponseForAttemptQuestion =
    useCallback(
      (attemptQuestion) => {
        if (!attemptQuestion) {
          return null;
        }

        return (
          selectedResponses.find(
            (response) =>
              response
                ?.attempt_question_id ===
                attemptQuestion.id ||
              (
                attemptQuestion
                  ?.question_id &&
                response?.question_id ===
                  attemptQuestion
                    .question_id
              ),
          ) || null
        );
      },
      [
        selectedResponses,
      ],
    );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      attemptsRequestRef.current +=
        1;

      selectedRequestRef.current +=
        1;

      mutationRequestRef.current +=
        1;
    };
  }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canAccessGrading
    ) {
      resetGrading();
      return;
    }

    loadGradingQueue({
      filters:
        gradingFilters,

      preserveSelection:
        true,
    }).catch(() => {});
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canAccessGrading,
    gradingFilters,
    loadGradingQueue,
    resetGrading,
  ]);

  const selectedSubmission =
    useMemo(
      () => ({
        attempt:
          selectedAttempt,

        attemptQuestions:
          selectedAttemptQuestions,

        questions:
          selectedAttemptQuestions,

        responses:
          selectedResponses,

        result:
          selectedResult,
      }),
      [
        selectedAttempt,
        selectedAttemptQuestions,
        selectedResponses,
        selectedResult,
      ],
    );

  const calculatedResult =
    useMemo(
      () =>
        calculateSubmissionScore(
          selectedAttemptQuestions,
          selectedResponses,
        ),
      [
        selectedAttemptQuestions,
        selectedResponses,
      ],
    );

  const gradingQueueReady =
    Boolean(
      service &&
        workspaceReady &&
        authorizationReady &&
        canAccessGrading &&
        !gradingQueueLoading &&
        !gradingQueueError,
    );

  const selectedSubmissionReady =
    Boolean(
      selectedAttemptId &&
        selectedAttempt &&
        !selectedSubmissionLoading &&
        !selectedSubmissionError,
    );

  const gradingBusy =
    Boolean(
      gradingQueueLoading ||
        selectedSubmissionLoading ||
        gradingMutationLoading,
    );

  return {
    gradingFilters,
    setGradingFilters:
      updateGradingFilters,
    updateGradingFilters,
    resetGradingFilters,

    attemptResult,
    attempts,
    gradingAttempts:
      attempts,

    gradingQueueCount:
      attemptResult.count,

    gradingQueuePage:
      attemptResult.page,

    gradingQueuePageSize:
      attemptResult.pageSize,

    gradingQueueTotalPages:
      attemptResult.totalPages,

    gradingQueueLoading,
    gradingQueueError,
    gradingQueueReady,

    gradingMutationLoading,
    gradingMutationError,

    selectedAttemptId,
    selectedAttempt,
    selectedAttemptQuestions,
    selectedResponses,
    selectedResult,
    selectedSubmission,

    selectedSubmissionLoading,
    selectedSubmissionError,
    selectedSubmissionReady,

    calculatedResult,

    gradingBusy,

    canAccessGrading,
    canGradeSubmissions,
    canReviewGrades,
    canReleaseResults,

    clearGradingQueueError,
    clearGradingMutationError,
    clearSelectedSubmissionError,

    loadGradingQueue,
    refreshGradingQueue,

    loadSelectedSubmission,
    selectSubmission,
    refreshSelectedSubmission,
    resetSelectedSubmission,

    saveResponseGrade,
    saveQuestionGrade:
      saveResponseGrade,
    saveResponseFeedback,

    calculateResult,
    saveResult,
    finalizeGrading,
    reviewResult,
    releaseResult,

    refreshGrading,
    resetGrading,

    getAttemptQuestionForResponse,
    getResponseForAttemptQuestion,
  };
}

export default useAssessmentGradingState;