import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_PAGE_SIZE = 50;

const DEFAULT_CATEGORY_FILTERS =
  Object.freeze({
    search: "",
    status: "",
    parentCategoryId: "",
    rootOnly: false,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: "display_order",
    sortDirection: "asc",
  });

const DEFAULT_SUBJECT_FILTERS =
  Object.freeze({
    search: "",
    status: "",
    categoryId: "",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: "display_order",
    sortDirection: "asc",
  });

const DEFAULT_TOPIC_FILTERS =
  Object.freeze({
    search: "",
    status: "",
    subjectId: "",
    parentTopicId: "",
    rootOnly: false,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
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

function normalizePageValue(
  value,
  fallback = 1,
) {
  return Number.isInteger(value) &&
    value > 0
    ? value
    : fallback;
}

function normalizeSortDirection(
  value,
) {
  return value === "desc"
    ? "desc"
    : "asc";
}

function normalizeCategoryFilters(
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

    parentCategoryId:
      typeof filters.parentCategoryId ===
      "string"
        ? filters.parentCategoryId
        : "",

    rootOnly:
      filters.rootOnly === true,

    page:
      normalizePageValue(
        filters.page,
      ),

    pageSize:
      normalizePageValue(
        filters.pageSize,
        DEFAULT_PAGE_SIZE,
      ),

    sortBy:
      typeof filters.sortBy ===
        "string" &&
      filters.sortBy.trim()
        ? filters.sortBy.trim()
        : "display_order",

    sortDirection:
      normalizeSortDirection(
        filters.sortDirection,
      ),
  };
}

function normalizeSubjectFilters(
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

    categoryId:
      typeof filters.categoryId ===
      "string"
        ? filters.categoryId
        : "",

    page:
      normalizePageValue(
        filters.page,
      ),

    pageSize:
      normalizePageValue(
        filters.pageSize,
        DEFAULT_PAGE_SIZE,
      ),

    sortBy:
      typeof filters.sortBy ===
        "string" &&
      filters.sortBy.trim()
        ? filters.sortBy.trim()
        : "display_order",

    sortDirection:
      normalizeSortDirection(
        filters.sortDirection,
      ),
  };
}

function normalizeTopicFilters(
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

    subjectId:
      typeof filters.subjectId ===
      "string"
        ? filters.subjectId
        : "",

    parentTopicId:
      typeof filters.parentTopicId ===
      "string"
        ? filters.parentTopicId
        : "",

    rootOnly:
      filters.rootOnly === true,

    page:
      normalizePageValue(
        filters.page,
      ),

    pageSize:
      normalizePageValue(
        filters.pageSize,
        DEFAULT_PAGE_SIZE,
      ),

    sortBy:
      typeof filters.sortBy ===
        "string" &&
      filters.sortBy.trim()
        ? filters.sortBy.trim()
        : "display_order",

    sortDirection:
      normalizeSortDirection(
        filters.sortDirection,
      ),
  };
}

function createCategoryServiceFilters(
  filters,
) {
  const normalized =
    normalizeCategoryFilters(
      filters,
    );

  return {
    search:
      normalized.search ||
      undefined,

    status:
      normalized.status ||
      undefined,

    parentCategoryId:
      normalized.parentCategoryId ||
      undefined,

    rootOnly:
      normalized.rootOnly ||
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

function createSubjectServiceFilters(
  filters,
) {
  const normalized =
    normalizeSubjectFilters(
      filters,
    );

  return {
    search:
      normalized.search ||
      undefined,

    status:
      normalized.status ||
      undefined,

    categoryId:
      normalized.categoryId ||
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

function createTopicServiceFilters(
  filters,
) {
  const normalized =
    normalizeTopicFilters(
      filters,
    );

  return {
    search:
      normalized.search ||
      undefined,

    status:
      normalized.status ||
      undefined,

    subjectId:
      normalized.subjectId ||
      undefined,

    parentTopicId:
      normalized.parentTopicId ||
      undefined,

    rootOnly:
      normalized.rootOnly ||
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

export function useAssessmentTaxonomyState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAssessments,
  canCreateAssessments,
  canEditAssessments,
} = {}) {
  const mountedRef =
    useRef(true);

  const categoryRequestRef =
    useRef(0);

  const subjectRequestRef =
    useRef(0);

  const topicRequestRef =
    useRef(0);

  const [
    categoryResult,
    setCategoryResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    subjectResult,
    setSubjectResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    topicResult,
    setTopicResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    categoryFilters,
    setCategoryFiltersState,
  ] = useState(
    DEFAULT_CATEGORY_FILTERS,
  );

  const [
    subjectFilters,
    setSubjectFiltersState,
  ] = useState(
    DEFAULT_SUBJECT_FILTERS,
  );

  const [
    topicFilters,
    setTopicFiltersState,
  ] = useState(
    DEFAULT_TOPIC_FILTERS,
  );

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(false);

  const [
    subjectsLoading,
    setSubjectsLoading,
  ] = useState(false);

  const [
    topicsLoading,
    setTopicsLoading,
  ] = useState(false);

  const [
    categoriesError,
    setCategoriesError,
  ] = useState("");

  const [
    subjectsError,
    setSubjectsError,
  ] = useState("");

  const [
    topicsError,
    setTopicsError,
  ] = useState("");

  const [
    categoryMutationLoading,
    setCategoryMutationLoading,
  ] = useState(false);

  const [
    subjectMutationLoading,
    setSubjectMutationLoading,
  ] = useState(false);

  const [
    topicMutationLoading,
    setTopicMutationLoading,
  ] = useState(false);

  const [
    categoryMutationError,
    setCategoryMutationError,
  ] = useState("");

  const [
    subjectMutationError,
    setSubjectMutationError,
  ] = useState("");

  const [
    topicMutationError,
    setTopicMutationError,
  ] = useState("");

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState(null);

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] = useState(null);

  const [
    selectedTopicId,
    setSelectedTopicId,
  ] = useState(null);

  const categories =
    useMemo(
      () =>
        categoryResult.items,
      [
        categoryResult,
      ],
    );

  const subjects =
    useMemo(
      () =>
        subjectResult.items,
      [
        subjectResult,
      ],
    );

  const topics =
    useMemo(
      () =>
        topicResult.items,
      [
        topicResult,
      ],
    );

  const selectedCategory =
    useMemo(
      () =>
        categories.find(
          (category) =>
            category.id ===
            selectedCategoryId,
        ) || null,
      [
        categories,
        selectedCategoryId,
      ],
    );

  const selectedSubject =
    useMemo(
      () =>
        subjects.find(
          (subject) =>
            subject.id ===
            selectedSubjectId,
        ) || null,
      [
        subjects,
        selectedSubjectId,
      ],
    );

  const selectedTopic =
    useMemo(
      () =>
        topics.find(
          (topic) =>
            topic.id ===
            selectedTopicId,
        ) || null,
      [
        topics,
        selectedTopicId,
      ],
    );

  const taxonomyLoading =
    categoriesLoading ||
    subjectsLoading ||
    topicsLoading;

  const taxonomyError =
    categoriesError ||
    subjectsError ||
    topicsError;

  const taxonomyReady =
    workspaceReady &&
    authorizationReady &&
    canViewAssessments &&
    Boolean(service) &&
    !taxonomyLoading &&
    !taxonomyError;

  const resetCategories =
    useCallback(() => {
      categoryRequestRef.current += 1;

      setCategoryResult(
        EMPTY_PAGED_RESULT,
      );

      setCategoriesLoading(
        false,
      );

      setCategoriesError(
        "",
      );

      setCategoryMutationLoading(
        false,
      );

      setCategoryMutationError(
        "",
      );

      setSelectedCategoryId(
        null,
      );
    }, []);

  const resetSubjects =
    useCallback(() => {
      subjectRequestRef.current += 1;

      setSubjectResult(
        EMPTY_PAGED_RESULT,
      );

      setSubjectsLoading(
        false,
      );

      setSubjectsError(
        "",
      );

      setSubjectMutationLoading(
        false,
      );

      setSubjectMutationError(
        "",
      );

      setSelectedSubjectId(
        null,
      );
    }, []);

  const resetTopics =
    useCallback(() => {
      topicRequestRef.current += 1;

      setTopicResult(
        EMPTY_PAGED_RESULT,
      );

      setTopicsLoading(
        false,
      );

      setTopicsError(
        "",
      );

      setTopicMutationLoading(
        false,
      );

      setTopicMutationError(
        "",
      );

      setSelectedTopicId(
        null,
      );
    }, []);

  const resetTaxonomy =
    useCallback(() => {
      resetCategories();
      resetSubjects();
      resetTopics();
    }, [
      resetCategories,
      resetSubjects,
      resetTopics,
    ]);

  const updateCategoryFilters =
    useCallback(
      (
        updates = {},
      ) => {
        setCategoryFiltersState(
          (
            currentFilters,
          ) =>
            normalizeCategoryFilters({
              ...currentFilters,
              ...updates,

              page:
                updates.page ??
                (
                  updates.search !==
                    undefined ||
                  updates.status !==
                    undefined ||
                  updates.parentCategoryId !==
                    undefined ||
                  updates.rootOnly !==
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

  const updateSubjectFilters =
    useCallback(
      (
        updates = {},
      ) => {
        setSubjectFiltersState(
          (
            currentFilters,
          ) =>
            normalizeSubjectFilters({
              ...currentFilters,
              ...updates,

              page:
                updates.page ??
                (
                  updates.search !==
                    undefined ||
                  updates.status !==
                    undefined ||
                  updates.categoryId !==
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

  const updateTopicFilters =
    useCallback(
      (
        updates = {},
      ) => {
        setTopicFiltersState(
          (
            currentFilters,
          ) =>
            normalizeTopicFilters({
              ...currentFilters,
              ...updates,

              page:
                updates.page ??
                (
                  updates.search !==
                    undefined ||
                  updates.status !==
                    undefined ||
                  updates.subjectId !==
                    undefined ||
                  updates.parentTopicId !==
                    undefined ||
                  updates.rootOnly !==
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

  const resetCategoryFilters =
    useCallback(() => {
      setCategoryFiltersState(
        DEFAULT_CATEGORY_FILTERS,
      );
    }, []);

  const resetSubjectFilters =
    useCallback(() => {
      setSubjectFiltersState(
        DEFAULT_SUBJECT_FILTERS,
      );
    }, []);

  const resetTopicFilters =
    useCallback(() => {
      setTopicFiltersState(
        DEFAULT_TOPIC_FILTERS,
      );
    }, []);

  const selectCategory =
    useCallback(
      (
        categoryId,
      ) => {
        const resolvedId =
          categoryId ||
          null;

        setSelectedCategoryId(
          resolvedId,
        );

        setSelectedSubjectId(
          null,
        );

        setSelectedTopicId(
          null,
        );

        setSubjectFiltersState(
          (
            currentFilters,
          ) =>
            normalizeSubjectFilters({
              ...currentFilters,

              categoryId:
                resolvedId ||
                "",

              page: 1,
            }),
        );

        setTopicFiltersState(
          (
            currentFilters,
          ) =>
            normalizeTopicFilters({
              ...currentFilters,
              subjectId: "",
              page: 1,
            }),
        );
      },
      [],
    );

  const selectSubject =
    useCallback(
      (
        subjectId,
      ) => {
        const resolvedId =
          subjectId ||
          null;

        setSelectedSubjectId(
          resolvedId,
        );

        setSelectedTopicId(
          null,
        );

        setTopicFiltersState(
          (
            currentFilters,
          ) =>
            normalizeTopicFilters({
              ...currentFilters,

              subjectId:
                resolvedId ||
                "",

              page: 1,
            }),
        );
      },
      [],
    );

  const selectTopic =
    useCallback(
      (
        topicId,
      ) => {
        setSelectedTopicId(
          topicId ||
          null,
        );
      },
      [],
    );

  const refreshCategories =
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
          resetCategories();
          return EMPTY_PAGED_RESULT;
        }

        const resolvedFilters =
          normalizeCategoryFilters({
            ...categoryFilters,
            ...(filtersOverride ||
              {}),
          });

        const requestId =
          ++categoryRequestRef.current;

        setCategoriesLoading(
          true,
        );

        setCategoriesError(
          "",
        );

        try {
          const result =
            await service
              .getAssessmentCategories(
                createCategoryServiceFilters(
                  resolvedFilters,
                ),
              );

          if (
            !mountedRef.current ||
            requestId !==
              categoryRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters.page,
              resolvedFilters.pageSize,
            );

          setCategoryResult(
            normalizedResult,
          );

          setSelectedCategoryId(
            (
              currentId,
            ) =>
              currentId &&
              normalizedResult.items.some(
                (category) =>
                  category.id ===
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
              categoryRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          setCategoryResult(
            EMPTY_PAGED_RESULT,
          );

          setSelectedCategoryId(
            null,
          );

          setCategoriesError(
            getErrorMessage(
              error,
              "Unable to load assessment categories.",
            ),
          );

          return EMPTY_PAGED_RESULT;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              categoryRequestRef.current
          ) {
            setCategoriesLoading(
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
        categoryFilters,
        resetCategories,
      ],
    );

  const refreshSubjects =
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
          resetSubjects();
          return EMPTY_PAGED_RESULT;
        }

        const resolvedFilters =
          normalizeSubjectFilters({
            ...subjectFilters,
            ...(filtersOverride ||
              {}),
          });

        const requestId =
          ++subjectRequestRef.current;

        setSubjectsLoading(
          true,
        );

        setSubjectsError(
          "",
        );

        try {
          const result =
            await service
              .getAssessmentSubjects(
                createSubjectServiceFilters(
                  resolvedFilters,
                ),
              );

          if (
            !mountedRef.current ||
            requestId !==
              subjectRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters.page,
              resolvedFilters.pageSize,
            );

          setSubjectResult(
            normalizedResult,
          );

          setSelectedSubjectId(
            (
              currentId,
            ) =>
              currentId &&
              normalizedResult.items.some(
                (subject) =>
                  subject.id ===
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
              subjectRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          setSubjectResult(
            EMPTY_PAGED_RESULT,
          );

          setSelectedSubjectId(
            null,
          );

          setSubjectsError(
            getErrorMessage(
              error,
              "Unable to load assessment subjects.",
            ),
          );

          return EMPTY_PAGED_RESULT;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              subjectRequestRef.current
          ) {
            setSubjectsLoading(
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
        subjectFilters,
        resetSubjects,
      ],
    );

  const refreshTopics =
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
          resetTopics();
          return EMPTY_PAGED_RESULT;
        }

        const resolvedFilters =
          normalizeTopicFilters({
            ...topicFilters,
            ...(filtersOverride ||
              {}),
          });

        const requestId =
          ++topicRequestRef.current;

        setTopicsLoading(
          true,
        );

        setTopicsError(
          "",
        );

        try {
          const result =
            await service
              .getAssessmentTopics(
                createTopicServiceFilters(
                  resolvedFilters,
                ),
              );

          if (
            !mountedRef.current ||
            requestId !==
              topicRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters.page,
              resolvedFilters.pageSize,
            );

          setTopicResult(
            normalizedResult,
          );

          setSelectedTopicId(
            (
              currentId,
            ) =>
              currentId &&
              normalizedResult.items.some(
                (topic) =>
                  topic.id ===
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
              topicRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          setTopicResult(
            EMPTY_PAGED_RESULT,
          );

          setSelectedTopicId(
            null,
          );

          setTopicsError(
            getErrorMessage(
              error,
              "Unable to load assessment topics.",
            ),
          );

          return EMPTY_PAGED_RESULT;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              topicRequestRef.current
          ) {
            setTopicsLoading(
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
        topicFilters,
        resetTopics,
      ],
    );

  const createCategory =
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
            "You do not have permission to create assessment categories.",
          );
        }

        setCategoryMutationLoading(
          true,
        );

        setCategoryMutationError(
          "",
        );

        try {
          const created =
            await service
              .createAssessmentCategory(
                payload,
              );

          await refreshCategories();

          if (created?.id) {
            setSelectedCategoryId(
              created.id,
            );
          }

          return created;
        } catch (error) {
          setCategoryMutationError(
            getErrorMessage(
              error,
              "Unable to create the assessment category.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setCategoryMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAssessments,
        refreshCategories,
      ],
    );

  const updateCategory =
    useCallback(
      async (
        categoryId,
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
            "You do not have permission to edit assessment categories.",
          );
        }

        if (!categoryId) {
          throw new Error(
            "Assessment category id is required.",
          );
        }

        setCategoryMutationLoading(
          true,
        );

        setCategoryMutationError(
          "",
        );

        try {
          const updated =
            await service
              .updateAssessmentCategory(
                categoryId,
                updates,
              );

          await refreshCategories();

          return updated;
        } catch (error) {
          setCategoryMutationError(
            getErrorMessage(
              error,
              "Unable to update the assessment category.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setCategoryMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        refreshCategories,
      ],
    );

  const deleteCategory =
    useCallback(
      async (
        categoryId,
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
            "You do not have permission to delete assessment categories.",
          );
        }

        if (!categoryId) {
          throw new Error(
            "Assessment category id is required.",
          );
        }

        setCategoryMutationLoading(
          true,
        );

        setCategoryMutationError(
          "",
        );

        try {
          const deleted =
            await service
              .deleteAssessmentCategory(
                categoryId,
                deletedBy,
              );

          if (
            selectedCategoryId ===
            categoryId
          ) {
            selectCategory(null);
          }

          await refreshCategories();

          return deleted;
        } catch (error) {
          setCategoryMutationError(
            getErrorMessage(
              error,
              "Unable to delete the assessment category.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setCategoryMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        selectedCategoryId,
        selectCategory,
        refreshCategories,
      ],
    );

  const createSubject =
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
            "You do not have permission to create assessment subjects.",
          );
        }

        setSubjectMutationLoading(
          true,
        );

        setSubjectMutationError(
          "",
        );

        try {
          const created =
            await service
              .createAssessmentSubject(
                payload,
              );

          await refreshSubjects();

          if (created?.id) {
            setSelectedSubjectId(
              created.id,
            );
          }

          return created;
        } catch (error) {
          setSubjectMutationError(
            getErrorMessage(
              error,
              "Unable to create the assessment subject.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setSubjectMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAssessments,
        refreshSubjects,
      ],
    );

  const updateSubject =
    useCallback(
      async (
        subjectId,
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
            "You do not have permission to edit assessment subjects.",
          );
        }

        if (!subjectId) {
          throw new Error(
            "Assessment subject id is required.",
          );
        }

        setSubjectMutationLoading(
          true,
        );

        setSubjectMutationError(
          "",
        );

        try {
          const updated =
            await service
              .updateAssessmentSubject(
                subjectId,
                updates,
              );

          await refreshSubjects();

          return updated;
        } catch (error) {
          setSubjectMutationError(
            getErrorMessage(
              error,
              "Unable to update the assessment subject.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setSubjectMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        refreshSubjects,
      ],
    );

  const deleteSubject =
    useCallback(
      async (
        subjectId,
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
            "You do not have permission to delete assessment subjects.",
          );
        }

        if (!subjectId) {
          throw new Error(
            "Assessment subject id is required.",
          );
        }

        setSubjectMutationLoading(
          true,
        );

        setSubjectMutationError(
          "",
        );

        try {
          const deleted =
            await service
              .deleteAssessmentSubject(
                subjectId,
                deletedBy,
              );

          if (
            selectedSubjectId ===
            subjectId
          ) {
            selectSubject(null);
          }

          await refreshSubjects();

          return deleted;
        } catch (error) {
          setSubjectMutationError(
            getErrorMessage(
              error,
              "Unable to delete the assessment subject.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setSubjectMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        selectedSubjectId,
        selectSubject,
        refreshSubjects,
      ],
    );

  const createTopic =
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
            "You do not have permission to create assessment topics.",
          );
        }

        setTopicMutationLoading(
          true,
        );

        setTopicMutationError(
          "",
        );

        try {
          const created =
            await service
              .createAssessmentTopic(
                payload,
              );

          await refreshTopics();

          if (created?.id) {
            setSelectedTopicId(
              created.id,
            );
          }

          return created;
        } catch (error) {
          setTopicMutationError(
            getErrorMessage(
              error,
              "Unable to create the assessment topic.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setTopicMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAssessments,
        refreshTopics,
      ],
    );

  const updateTopic =
    useCallback(
      async (
        topicId,
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
            "You do not have permission to edit assessment topics.",
          );
        }

        if (!topicId) {
          throw new Error(
            "Assessment topic id is required.",
          );
        }

        setTopicMutationLoading(
          true,
        );

        setTopicMutationError(
          "",
        );

        try {
          const updated =
            await service
              .updateAssessmentTopic(
                topicId,
                updates,
              );

          await refreshTopics();

          return updated;
        } catch (error) {
          setTopicMutationError(
            getErrorMessage(
              error,
              "Unable to update the assessment topic.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setTopicMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        refreshTopics,
      ],
    );

  const deleteTopic =
    useCallback(
      async (
        topicId,
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
            "You do not have permission to delete assessment topics.",
          );
        }

        if (!topicId) {
          throw new Error(
            "Assessment topic id is required.",
          );
        }

        setTopicMutationLoading(
          true,
        );

        setTopicMutationError(
          "",
        );

        try {
          const deleted =
            await service
              .deleteAssessmentTopic(
                topicId,
                deletedBy,
              );

          if (
            selectedTopicId ===
            topicId
          ) {
            setSelectedTopicId(
              null,
            );
          }

          await refreshTopics();

          return deleted;
        } catch (error) {
          setTopicMutationError(
            getErrorMessage(
              error,
              "Unable to delete the assessment topic.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setTopicMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        selectedTopicId,
        refreshTopics,
      ],
    );

  const refreshTaxonomy =
    useCallback(
      async () => {
        const [
          nextCategories,
          nextSubjects,
          nextTopics,
        ] = await Promise.all([
          refreshCategories(),
          refreshSubjects(),
          refreshTopics(),
        ]);

        return {
          categories:
            nextCategories,

          subjects:
            nextSubjects,

          topics:
            nextTopics,
        };
      },
      [
        refreshCategories,
        refreshSubjects,
        refreshTopics,
      ],
    );

  const clearCategoriesError =
    useCallback(() => {
      setCategoriesError("");
    }, []);

  const clearSubjectsError =
    useCallback(() => {
      setSubjectsError("");
    }, []);

  const clearTopicsError =
    useCallback(() => {
      setTopicsError("");
    }, []);

  const clearCategoryMutationError =
    useCallback(() => {
      setCategoryMutationError("");
    }, []);

  const clearSubjectMutationError =
    useCallback(() => {
      setSubjectMutationError("");
    }, []);

  const clearTopicMutationError =
    useCallback(() => {
      setTopicMutationError("");
    }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      categoryRequestRef.current += 1;
      subjectRequestRef.current += 1;
      topicRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAssessments
    ) {
      resetTaxonomy();
    }
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    resetTaxonomy,
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

    refreshCategories();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    categoryFilters,
    refreshCategories,
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

    refreshSubjects();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    subjectFilters,
    refreshSubjects,
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

    refreshTopics();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    topicFilters,
    refreshTopics,
  ]);

  return useMemo(
    () => ({
      categories,
      categoryResult,
      categoryFilters,
      updateCategoryFilters,
      resetCategoryFilters,
      categoriesLoading,
      categoriesError,
      categoryMutationLoading,
      categoryMutationError,
      selectedCategoryId,
      selectedCategory,
      selectCategory,
      refreshCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      clearCategoriesError,
      clearCategoryMutationError,

      subjects,
      subjectResult,
      subjectFilters,
      updateSubjectFilters,
      resetSubjectFilters,
      subjectsLoading,
      subjectsError,
      subjectMutationLoading,
      subjectMutationError,
      selectedSubjectId,
      selectedSubject,
      selectSubject,
      refreshSubjects,
      createSubject,
      updateSubject,
      deleteSubject,
      clearSubjectsError,
      clearSubjectMutationError,

      topics,
      topicResult,
      topicFilters,
      updateTopicFilters,
      resetTopicFilters,
      topicsLoading,
      topicsError,
      topicMutationLoading,
      topicMutationError,
      selectedTopicId,
      selectedTopic,
      selectTopic,
      refreshTopics,
      createTopic,
      updateTopic,
      deleteTopic,
      clearTopicsError,
      clearTopicMutationError,

      taxonomyLoading,
      taxonomyError,
      taxonomyReady,
      refreshTaxonomy,
      resetTaxonomy,
    }),
    [
      categories,
      categoryResult,
      categoryFilters,
      updateCategoryFilters,
      resetCategoryFilters,
      categoriesLoading,
      categoriesError,
      categoryMutationLoading,
      categoryMutationError,
      selectedCategoryId,
      selectedCategory,
      selectCategory,
      refreshCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      clearCategoriesError,
      clearCategoryMutationError,

      subjects,
      subjectResult,
      subjectFilters,
      updateSubjectFilters,
      resetSubjectFilters,
      subjectsLoading,
      subjectsError,
      subjectMutationLoading,
      subjectMutationError,
      selectedSubjectId,
      selectedSubject,
      selectSubject,
      refreshSubjects,
      createSubject,
      updateSubject,
      deleteSubject,
      clearSubjectsError,
      clearSubjectMutationError,

      topics,
      topicResult,
      topicFilters,
      updateTopicFilters,
      resetTopicFilters,
      topicsLoading,
      topicsError,
      topicMutationLoading,
      topicMutationError,
      selectedTopicId,
      selectedTopic,
      selectTopic,
      refreshTopics,
      createTopic,
      updateTopic,
      deleteTopic,
      clearTopicsError,
      clearTopicMutationError,

      taxonomyLoading,
      taxonomyError,
      taxonomyReady,
      refreshTaxonomy,
      resetTaxonomy,
    ],
  );
}

export default useAssessmentTaxonomyState;
