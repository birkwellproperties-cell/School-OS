import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_PAGE_SIZE = 25;

const DEFAULT_QUESTION_FILTERS =
  Object.freeze({
    search: "",
    bankId: "",
    categoryId: "",
    subjectId: "",
    topicId: "",
    ownerId: "",
    questionType: "",
    difficulty: "",
    status: "",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: "updated_at",
    sortDirection: "desc",
  });

const DEFAULT_OPTION_FILTERS =
  Object.freeze({
    questionId: "",
    isCorrect: null,
    hasMatchingKey: false,
    page: 1,
    pageSize: 100,
    sortBy: "display_order",
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

function normalizePositiveInteger(
  value,
  fallback,
) {
  return Number.isInteger(value) &&
    value > 0
    ? value
    : fallback;
}

function normalizeQuestionFilters(
  filters = {},
) {
  return {
    search:
      typeof filters.search ===
      "string"
        ? filters.search
        : "",

    bankId:
      typeof filters.bankId ===
      "string"
        ? filters.bankId
        : "",

    categoryId:
      typeof filters.categoryId ===
      "string"
        ? filters.categoryId
        : "",

    subjectId:
      typeof filters.subjectId ===
      "string"
        ? filters.subjectId
        : "",

    topicId:
      typeof filters.topicId ===
      "string"
        ? filters.topicId
        : "",

    ownerId:
      typeof filters.ownerId ===
      "string"
        ? filters.ownerId
        : "",

    questionType:
      typeof filters.questionType ===
      "string"
        ? filters.questionType
        : "",

    difficulty:
      typeof filters.difficulty ===
      "string"
        ? filters.difficulty
        : "",

    status:
      typeof filters.status ===
      "string"
        ? filters.status
        : "",

    page:
      normalizePositiveInteger(
        filters.page,
        1,
      ),

    pageSize:
      normalizePositiveInteger(
        filters.pageSize,
        DEFAULT_PAGE_SIZE,
      ),

    sortBy:
      typeof filters.sortBy ===
        "string" &&
      filters.sortBy.trim()
        ? filters.sortBy.trim()
        : "updated_at",

    sortDirection:
      filters.sortDirection ===
      "asc"
        ? "asc"
        : "desc",
  };
}

function normalizeOptionFilters(
  filters = {},
) {
  return {
    questionId:
      typeof filters.questionId ===
      "string"
        ? filters.questionId
        : "",

    isCorrect:
      typeof filters.isCorrect ===
      "boolean"
        ? filters.isCorrect
        : null,

    hasMatchingKey:
      filters.hasMatchingKey ===
      true,

    page:
      normalizePositiveInteger(
        filters.page,
        1,
      ),

    pageSize:
      normalizePositiveInteger(
        filters.pageSize,
        100,
      ),

    sortBy:
      typeof filters.sortBy ===
        "string" &&
      filters.sortBy.trim()
        ? filters.sortBy.trim()
        : "display_order",

    sortDirection:
      filters.sortDirection ===
      "desc"
        ? "desc"
        : "asc",
  };
}

function normalizePagedResult(
  result,
  fallbackPage,
  fallbackPageSize,
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

  return {
    items,
    data: items,
    count: total,
    total,
    page,
    pageSize,

    totalPages:
      pageSize > 0
        ? Math.ceil(
            total / pageSize,
          )
        : 0,
  };
}

function createQuestionServiceFilters(
  filters,
) {
  const normalized =
    normalizeQuestionFilters(
      filters,
    );

  return {
    search:
      normalized.search ||
      undefined,

    bankId:
      normalized.bankId ||
      undefined,

    categoryId:
      normalized.categoryId ||
      undefined,

    subjectId:
      normalized.subjectId ||
      undefined,

    topicId:
      normalized.topicId ||
      undefined,

    ownerId:
      normalized.ownerId ||
      undefined,

    questionType:
      normalized.questionType ||
      undefined,

    difficulty:
      normalized.difficulty ||
      undefined,

    status:
      normalized.status ||
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

function createOptionServiceFilters(
  filters,
) {
  const normalized =
    normalizeOptionFilters(
      filters,
    );

  return {
    questionId:
      normalized.questionId ||
      undefined,

    isCorrect:
      normalized.isCorrect ===
      null
        ? undefined
        : normalized.isCorrect,

    hasMatchingKey:
      normalized.hasMatchingKey ||
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

export function useAssessmentQuestionState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAssessments,
  canCreateAssessments,
  canEditAssessments,
} = {}) {
  const mountedRef =
    useRef(true);

  const questionRequestRef =
    useRef(0);

  const selectedQuestionRequestRef =
    useRef(0);

  const optionRequestRef =
    useRef(0);

  const [
    questionResult,
    setQuestionResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    questionFilters,
    setQuestionFiltersState,
  ] = useState(
    DEFAULT_QUESTION_FILTERS,
  );

  const [
    questionsLoading,
    setQuestionsLoading,
  ] = useState(false);

  const [
    questionsError,
    setQuestionsError,
  ] = useState("");

  const [
    questionMutationLoading,
    setQuestionMutationLoading,
  ] = useState(false);

  const [
    questionMutationError,
    setQuestionMutationError,
  ] = useState("");

  const [
    selectedQuestionId,
    setSelectedQuestionId,
  ] = useState(null);

  const [
    selectedQuestionRecord,
    setSelectedQuestionRecord,
  ] = useState(null);

  const [
    selectedQuestionLoading,
    setSelectedQuestionLoading,
  ] = useState(false);

  const [
    selectedQuestionError,
    setSelectedQuestionError,
  ] = useState("");

  const [
    optionResult,
    setOptionResult,
  ] = useState({
    ...EMPTY_PAGED_RESULT,
    pageSize: 100,
  });

  const [
    optionFilters,
    setOptionFiltersState,
  ] = useState(
    DEFAULT_OPTION_FILTERS,
  );

  const [
    questionOptionsLoading,
    setQuestionOptionsLoading,
  ] = useState(false);

  const [
    questionOptionsError,
    setQuestionOptionsError,
  ] = useState("");

  const [
    questionOptionMutationLoading,
    setQuestionOptionMutationLoading,
  ] = useState(false);

  const [
    questionOptionMutationError,
    setQuestionOptionMutationError,
  ] = useState("");

  const [
    selectedQuestionOptionId,
    setSelectedQuestionOptionId,
  ] = useState(null);

  const questions =
    useMemo(
      () =>
        questionResult.items,
      [questionResult],
    );

  const questionOptions =
    useMemo(
      () =>
        optionResult.items,
      [optionResult],
    );

  const selectedQuestion =
    useMemo(() => {
      if (
        selectedQuestionRecord?.id ===
        selectedQuestionId
      ) {
        return selectedQuestionRecord;
      }

      return (
        questions.find(
          (question) =>
            question.id ===
            selectedQuestionId,
        ) || null
      );
    }, [
      questions,
      selectedQuestionId,
      selectedQuestionRecord,
    ]);

  const selectedQuestionOption =
    useMemo(
      () =>
        questionOptions.find(
          (option) =>
            option.id ===
            selectedQuestionOptionId,
        ) || null,
      [
        questionOptions,
        selectedQuestionOptionId,
      ],
    );

  const questionsReady =
    workspaceReady &&
    authorizationReady &&
    canViewAssessments &&
    Boolean(service) &&
    !questionsLoading &&
    !questionsError;

  const questionBuilderReady =
    questionsReady &&
    Boolean(selectedQuestionId) &&
    !selectedQuestionLoading &&
    !selectedQuestionError &&
    !questionOptionsLoading &&
    !questionOptionsError;

  const resetQuestionOptions =
    useCallback(() => {
      optionRequestRef.current += 1;

      setOptionResult({
        ...EMPTY_PAGED_RESULT,
        pageSize: 100,
      });

      setOptionFiltersState(
        DEFAULT_OPTION_FILTERS,
      );

      setQuestionOptionsLoading(
        false,
      );

      setQuestionOptionsError(
        "",
      );

      setQuestionOptionMutationLoading(
        false,
      );

      setQuestionOptionMutationError(
        "",
      );

      setSelectedQuestionOptionId(
        null,
      );
    }, []);

  const resetQuestions =
    useCallback(() => {
      questionRequestRef.current += 1;
      selectedQuestionRequestRef.current += 1;

      setQuestionResult(
        EMPTY_PAGED_RESULT,
      );

      setQuestionsLoading(
        false,
      );

      setQuestionsError(
        "",
      );

      setQuestionMutationLoading(
        false,
      );

      setQuestionMutationError(
        "",
      );

      setSelectedQuestionId(
        null,
      );

      setSelectedQuestionRecord(
        null,
      );

      setSelectedQuestionLoading(
        false,
      );

      setSelectedQuestionError(
        "",
      );

      resetQuestionOptions();
    }, [resetQuestionOptions]);

  const setQuestionFilters =
    useCallback(
      (nextFilters) => {
        setQuestionFiltersState(
          (currentFilters) => {
            const resolvedFilters =
              typeof nextFilters ===
              "function"
                ? nextFilters(
                    currentFilters,
                  )
                : nextFilters;

            return normalizeQuestionFilters({
              ...currentFilters,
              ...resolvedFilters,
            });
          },
        );
      },
      [],
    );

  const updateQuestionFilters =
    useCallback(
      (updates = {}) => {
        setQuestionFiltersState(
          (currentFilters) =>
            normalizeQuestionFilters({
              ...currentFilters,
              ...updates,

              page:
                updates.page ??
                (
                  updates.search !==
                    undefined ||
                  updates.bankId !==
                    undefined ||
                  updates.categoryId !==
                    undefined ||
                  updates.subjectId !==
                    undefined ||
                  updates.topicId !==
                    undefined ||
                  updates.ownerId !==
                    undefined ||
                  updates.questionType !==
                    undefined ||
                  updates.difficulty !==
                    undefined ||
                  updates.status !==
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

  const resetQuestionFilters =
    useCallback(() => {
      setQuestionFiltersState(
        DEFAULT_QUESTION_FILTERS,
      );
    }, []);

  const updateQuestionOptionFilters =
    useCallback(
      (updates = {}) => {
        setOptionFiltersState(
          (currentFilters) =>
            normalizeOptionFilters({
              ...currentFilters,
              ...updates,

              page:
                updates.page ??
                (
                  updates.questionId !==
                    undefined ||
                  updates.isCorrect !==
                    undefined ||
                  updates.hasMatchingKey !==
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

  const selectQuestionOption =
    useCallback(
      (optionId) => {
        setSelectedQuestionOptionId(
          optionId || null,
        );
      },
      [],
    );

  const refreshQuestions =
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
          resetQuestions();
          return EMPTY_PAGED_RESULT;
        }

        const resolvedFilters =
          normalizeQuestionFilters({
            ...questionFilters,
            ...(filtersOverride || {}),
          });

        const requestId =
          ++questionRequestRef.current;

        setQuestionsLoading(true);
        setQuestionsError("");

        try {
          const result =
            await service
              .getAssessmentQuestions(
                createQuestionServiceFilters(
                  resolvedFilters,
                ),
              );

          if (
            !mountedRef.current ||
            requestId !==
              questionRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters.page,
              resolvedFilters.pageSize,
            );

          setQuestionResult(
            normalizedResult,
          );

          return normalizedResult;
        } catch (error) {
          if (
            !mountedRef.current ||
            requestId !==
              questionRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          setQuestionResult(
            EMPTY_PAGED_RESULT,
          );

          setQuestionsError(
            getErrorMessage(
              error,
              "Unable to load assessment questions.",
            ),
          );

          return EMPTY_PAGED_RESULT;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              questionRequestRef.current
          ) {
            setQuestionsLoading(false);
          }
        }
      },
      [
        service,
        workspaceReady,
        authorizationReady,
        canViewAssessments,
        questionFilters,
        resetQuestions,
      ],
    );

  const refreshSelectedQuestion =
    useCallback(
      async (
        questionId =
          selectedQuestionId,
      ) => {
        if (
          !service ||
          !questionId ||
          !workspaceReady ||
          !authorizationReady ||
          !canViewAssessments
        ) {
          selectedQuestionRequestRef.current += 1;
          setSelectedQuestionRecord(null);
          setSelectedQuestionLoading(false);
          setSelectedQuestionError("");
          return null;
        }

        const requestId =
          ++selectedQuestionRequestRef.current;

        setSelectedQuestionLoading(true);
        setSelectedQuestionError("");

        try {
          const question =
            await service
              .getAssessmentQuestion(
                questionId,
              );

          if (
            !mountedRef.current ||
            requestId !==
              selectedQuestionRequestRef.current
          ) {
            return null;
          }

          setSelectedQuestionRecord(
            question || null,
          );

          return question || null;
        } catch (error) {
          if (
            !mountedRef.current ||
            requestId !==
              selectedQuestionRequestRef.current
          ) {
            return null;
          }

          setSelectedQuestionRecord(null);

          setSelectedQuestionError(
            getErrorMessage(
              error,
              "Unable to load the assessment question.",
            ),
          );

          return null;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              selectedQuestionRequestRef.current
          ) {
            setSelectedQuestionLoading(false);
          }
        }
      },
      [
        service,
        selectedQuestionId,
        workspaceReady,
        authorizationReady,
        canViewAssessments,
      ],
    );

  const refreshQuestionOptions =
    useCallback(
      async (
        filtersOverride = null,
      ) => {
        const resolvedQuestionId =
          filtersOverride?.questionId ||
          selectedQuestionId;

        if (
          !service ||
          !resolvedQuestionId ||
          !workspaceReady ||
          !authorizationReady ||
          !canViewAssessments
        ) {
          resetQuestionOptions();
          return {
            ...EMPTY_PAGED_RESULT,
            pageSize: 100,
          };
        }

        const resolvedFilters =
          normalizeOptionFilters({
            ...optionFilters,
            questionId:
              resolvedQuestionId,
            ...(filtersOverride || {}),
          });

        const requestId =
          ++optionRequestRef.current;

        setQuestionOptionsLoading(true);
        setQuestionOptionsError("");

        try {
          const result =
            await service
              .getAssessmentQuestionOptions(
                createOptionServiceFilters(
                  resolvedFilters,
                ),
              );

          if (
            !mountedRef.current ||
            requestId !==
              optionRequestRef.current
          ) {
            return {
              ...EMPTY_PAGED_RESULT,
              pageSize: 100,
            };
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters.page,
              resolvedFilters.pageSize,
            );

          setOptionResult(
            normalizedResult,
          );


          setSelectedQuestionOptionId(
            (currentId) =>
              currentId &&
              normalizedResult.items.some(
                (option) =>
                  option.id ===
                  currentId,
              )
                ? currentId
                : null,
          );

          return normalizedResult;
        } catch (error) {
          if (
            !mountedRef.current ||
            requestId !==
              optionRequestRef.current
          ) {
            return {
              ...EMPTY_PAGED_RESULT,
              pageSize: 100,
            };
          }

          setOptionResult({
            ...EMPTY_PAGED_RESULT,
            pageSize: 100,
          });

          setSelectedQuestionOptionId(null);

          setQuestionOptionsError(
            getErrorMessage(
              error,
              "Unable to load assessment question options.",
            ),
          );

          return {
            ...EMPTY_PAGED_RESULT,
            pageSize: 100,
          };
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              optionRequestRef.current
          ) {
            setQuestionOptionsLoading(false);
          }
        }
      },
      [
        service,
        selectedQuestionId,
        workspaceReady,
        authorizationReady,
        canViewAssessments,
        optionFilters,
        resetQuestionOptions,
      ],
    );

  const selectQuestion =
    useCallback(
      (questionId) => {
        const resolvedId =
          questionId || null;

        setSelectedQuestionId(
          resolvedId,
        );

        setSelectedQuestionRecord(
          null,
        );

        setSelectedQuestionError("");
        setSelectedQuestionOptionId(null);

        setOptionFiltersState(
          normalizeOptionFilters({
            ...DEFAULT_OPTION_FILTERS,
            questionId:
              resolvedId || "",
          }),
        );

        if (!resolvedId) {
          resetQuestionOptions();
        }
      },
      [resetQuestionOptions],
    );

  const createQuestion =
    useCallback(
      async (payload = {}) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (!canCreateAssessments) {
          throw new Error(
            "You do not have permission to create assessment questions.",
          );
        }

        setQuestionMutationLoading(true);
        setQuestionMutationError("");

        try {
          const created =
            await service
              .createAssessmentQuestion(
                payload,
              );

          await refreshQuestions();

          if (created?.id) {
            selectQuestion(created.id);
          }

          return created;
        } catch (error) {
          setQuestionMutationError(
            getErrorMessage(
              error,
              "Unable to create the assessment question.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setQuestionMutationLoading(false);
          }
        }
      },
      [
        service,
        canCreateAssessments,
        refreshQuestions,
        selectQuestion,
      ],
    );

  const importQuestions = useCallback(
    async (
      questions = [],
      defaults = {},
    ) => {
      if (!service) {
        throw new Error(
          "Assessment service is not available.",
        );
      }

      if (!canCreateAssessments) {
        throw new Error(
          "You do not have permission to import assessment questions.",
        );
      }

      if (
        !Array.isArray(questions) ||
        questions.length === 0
      ) {
        throw new Error(
          "At least one assessment question is required for import.",
        );
      }

      const result =
        await service
          .importAssessmentQuestions(
            questions,
            defaults,
          );

      await refreshQuestions();

      return result;
    },
    [
      service,
      canCreateAssessments,
      refreshQuestions,
    ],
  );
  const updateQuestion =
    useCallback(
      async (
        questionId,
        updates = {},
      ) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (!canEditAssessments) {
          throw new Error(
            "You do not have permission to edit assessment questions.",
          );
        }

        if (!questionId) {
          throw new Error(
            "Assessment question id is required.",
          );
        }

        setQuestionMutationLoading(true);
        setQuestionMutationError("");

        try {
          const updated =
            await service
              .updateAssessmentQuestion(
                questionId,
                updates,
              );

          await refreshQuestions();

          if (
            selectedQuestionId ===
            questionId
          ) {
            setSelectedQuestionRecord(
              updated || null,
            );
          }

          return updated;
        } catch (error) {
          setQuestionMutationError(
            getErrorMessage(
              error,
              "Unable to update the assessment question.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setQuestionMutationLoading(false);
          }
        }
      },
      [
        service,
        canEditAssessments,
        selectedQuestionId,
        refreshQuestions,
      ],
    );

  const deleteQuestion =
    useCallback(
      async (
        questionId,
        deletedBy = null,
      ) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (!canEditAssessments) {
          throw new Error(
            "You do not have permission to delete assessment questions.",
          );
        }

        if (!questionId) {
          throw new Error(
            "Assessment question id is required.",
          );
        }

        setQuestionMutationLoading(true);
        setQuestionMutationError("");

        try {
          const deleted =
            await service
              .deleteAssessmentQuestion(
                questionId,
                deletedBy,
              );

          if (
            selectedQuestionId ===
            questionId
          ) {
            selectQuestion(null);
          }

          await refreshQuestions();

          return deleted;
        } catch (error) {
          setQuestionMutationError(
            getErrorMessage(
              error,
              "Unable to delete the assessment question.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setQuestionMutationLoading(false);
          }
        }
      },
      [
        service,
        canEditAssessments,
        selectedQuestionId,
        selectQuestion,
        refreshQuestions,
      ],
    );

  const createQuestionOption =
    useCallback(
      async (payload = {}) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (!canCreateAssessments) {
          throw new Error(
            "You do not have permission to create assessment question options.",
          );
        }

        const questionId =
          payload.question_id ||
          selectedQuestionId;

        if (!questionId) {
          throw new Error(
            "Assessment question id is required.",
          );
        }

        setQuestionOptionMutationLoading(true);
        setQuestionOptionMutationError("");

        try {
          const created =
            await service
              .createAssessmentQuestionOption({
                ...payload,
                question_id:
                  questionId,
              });

          await refreshQuestionOptions({
            questionId,
          });

          if (created?.id) {
            setSelectedQuestionOptionId(
              created.id,
            );
          }

          return created;
        } catch (error) {
          setQuestionOptionMutationError(
            getErrorMessage(
              error,
              "Unable to create the assessment question option.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setQuestionOptionMutationLoading(false);
          }
        }
      },
      [
        service,
        canCreateAssessments,
        selectedQuestionId,
        refreshQuestionOptions,
      ],
    );

  const updateQuestionOption =
    useCallback(
      async (
        optionId,
        updates = {},
      ) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (!canEditAssessments) {
          throw new Error(
            "You do not have permission to edit assessment question options.",
          );
        }

        if (!optionId) {
          throw new Error(
            "Assessment question option id is required.",
          );
        }

        setQuestionOptionMutationLoading(true);
        setQuestionOptionMutationError("");

        try {
          const updated =
            await service
              .updateAssessmentQuestionOption(
                optionId,
                updates,
              );

          await refreshQuestionOptions();

          return updated;
        } catch (error) {
          setQuestionOptionMutationError(
            getErrorMessage(
              error,
              "Unable to update the assessment question option.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setQuestionOptionMutationLoading(false);
          }
        }
      },
      [
        service,
        canEditAssessments,
        refreshQuestionOptions,
      ],
    );

  const deleteQuestionOption =
    useCallback(
      async (
        optionId,
        deletedBy = null,
      ) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (!canEditAssessments) {
          throw new Error(
            "You do not have permission to delete assessment question options.",
          );
        }

        if (!optionId) {
          throw new Error(
            "Assessment question option id is required.",
          );
        }

        setQuestionOptionMutationLoading(true);
        setQuestionOptionMutationError("");

        try {
          const deleted =
            await service
              .deleteAssessmentQuestionOption(
                optionId,
                deletedBy,
              );

          if (
            selectedQuestionOptionId ===
            optionId
          ) {
            setSelectedQuestionOptionId(null);
          }

          await refreshQuestionOptions();

          return deleted;
        } catch (error) {
          setQuestionOptionMutationError(
            getErrorMessage(
              error,
              "Unable to delete the assessment question option.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setQuestionOptionMutationLoading(false);
          }
        }
      },
      [
        service,
        canEditAssessments,
        selectedQuestionOptionId,
        refreshQuestionOptions,
      ],
    );

  const clearQuestionsError =
    useCallback(() => {
      setQuestionsError("");
    }, []);

  const clearQuestionMutationError =
    useCallback(() => {
      setQuestionMutationError("");
    }, []);

  const clearSelectedQuestionError =
    useCallback(() => {
      setSelectedQuestionError("");
    }, []);

  const clearQuestionOptionsError =
    useCallback(() => {
      setQuestionOptionsError("");
    }, []);

  const clearQuestionOptionMutationError =
    useCallback(() => {
      setQuestionOptionMutationError("");
    }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      questionRequestRef.current += 1;
      selectedQuestionRequestRef.current += 1;
      optionRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAssessments
    ) {
      resetQuestions();
    }
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    resetQuestions,
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

    refreshQuestions();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    questionFilters,
    refreshQuestions,
  ]);

  useEffect(() => {
    if (
      !selectedQuestionId ||
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAssessments
    ) {
      return;
    }

    refreshSelectedQuestion(
      selectedQuestionId,
    );

    refreshQuestionOptions({
      questionId:
        selectedQuestionId,
    });
  }, [
    selectedQuestionId,
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    refreshSelectedQuestion,
    refreshQuestionOptions,
  ]);

  return useMemo(
    () => ({
      questions,
      questionResult,

      questionFilters,
      setQuestionFilters,
      updateQuestionFilters,
      resetQuestionFilters,

      questionsLoading,
      questionsError,
      questionsReady,

      questionMutationLoading,
      questionMutationError,

      selectedQuestionId,
      selectedQuestion,
      selectedQuestionLoading,
      selectedQuestionError,
      selectQuestion,

      refreshQuestions,
      refreshSelectedQuestion,

      createQuestion,
      importQuestions,
      updateQuestion,
      deleteQuestion,

      questionOptions,
      optionResult,
      optionFilters,
      updateQuestionOptionFilters,

      questionOptionsLoading,
      questionOptionsError,

      questionOptionMutationLoading,
      questionOptionMutationError,

      selectedQuestionOptionId,
      selectedQuestionOption,
      selectQuestionOption,

      refreshQuestionOptions,

      createQuestionOption,
      updateQuestionOption,
      deleteQuestionOption,

      questionBuilderReady,

      clearQuestionsError,
      clearQuestionMutationError,
      clearSelectedQuestionError,
      clearQuestionOptionsError,
      clearQuestionOptionMutationError,

      resetQuestions,
      resetQuestionOptions,
    }),
    [
      questions,
      questionResult,

      questionFilters,
      setQuestionFilters,
      updateQuestionFilters,
      resetQuestionFilters,

      questionsLoading,
      questionsError,
      questionsReady,

      questionMutationLoading,
      questionMutationError,

      selectedQuestionId,
      selectedQuestion,
      selectedQuestionLoading,
      selectedQuestionError,
      selectQuestion,

      refreshQuestions,
      refreshSelectedQuestion,

      createQuestion,
      importQuestions,
      updateQuestion,
      deleteQuestion,

      questionOptions,
      optionResult,
      optionFilters,
      updateQuestionOptionFilters,

      questionOptionsLoading,
      questionOptionsError,

      questionOptionMutationLoading,
      questionOptionMutationError,

      selectedQuestionOptionId,
      selectedQuestionOption,
      selectQuestionOption,

      refreshQuestionOptions,

      createQuestionOption,
      updateQuestionOption,
      deleteQuestionOption,

      questionBuilderReady,

      clearQuestionsError,
      clearQuestionMutationError,
      clearSelectedQuestionError,
      clearQuestionOptionsError,
      clearQuestionOptionMutationError,

      resetQuestions,
      resetQuestionOptions,
    ],
  );
}

export default useAssessmentQuestionState;


