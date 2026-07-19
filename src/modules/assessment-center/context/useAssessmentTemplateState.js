import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_PAGE_SIZE = 25;

const DEFAULT_TEMPLATE_FILTERS =
  Object.freeze({
    search: "",
    bankId: "",
    categoryId: "",
    subjectId: "",
    ownerId: "",
    assessmentType: "",
    deliveryMode: "",
    audienceType: "",
    status: "",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: "updated_at",
    sortDirection: "desc",
  });

const DEFAULT_SECTION_FILTERS =
  Object.freeze({
    status: "",
    sectionType: "",
    page: 1,
    pageSize: 100,
    sortBy: "display_order",
    sortDirection: "asc",
  });

const DEFAULT_TEMPLATE_QUESTION_FILTERS =
  Object.freeze({
    required: null,
    randomizationGroup: "",
    page: 1,
    pageSize: 250,
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

function normalizePositiveInteger(
  value,
  fallback,
) {
  return Number.isInteger(value) &&
    value > 0
    ? value
    : fallback;
}

function normalizeTemplateFilters(
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

    ownerId:
      typeof filters.ownerId ===
      "string"
        ? filters.ownerId
        : "",

    assessmentType:
      typeof filters.assessmentType ===
      "string"
        ? filters.assessmentType
        : "",

    deliveryMode:
      typeof filters.deliveryMode ===
      "string"
        ? filters.deliveryMode
        : "",

    audienceType:
      typeof filters.audienceType ===
      "string"
        ? filters.audienceType
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

function normalizeSectionFilters(
  filters = {},
) {
  return {
    status:
      typeof filters.status ===
      "string"
        ? filters.status
        : "",

    sectionType:
      typeof filters.sectionType ===
      "string"
        ? filters.sectionType
        : "",

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

function normalizeTemplateQuestionFilters(
  filters = {},
) {
  return {
    required:
      typeof filters.required ===
      "boolean"
        ? filters.required
        : null,

    randomizationGroup:
      typeof filters.randomizationGroup ===
      "string"
        ? filters.randomizationGroup
        : "",

    page:
      normalizePositiveInteger(
        filters.page,
        1,
      ),

    pageSize:
      normalizePositiveInteger(
        filters.pageSize,
        250,
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

function createTemplateServiceFilters(
  filters,
) {
  const normalized =
    normalizeTemplateFilters(
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

    ownerId:
      normalized.ownerId ||
      undefined,

    assessmentType:
      normalized.assessmentType ||
      undefined,

    deliveryMode:
      normalized.deliveryMode ||
      undefined,

    audienceType:
      normalized.audienceType ||
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

function createSectionServiceFilters(
  templateId,
  filters,
) {
  const normalized =
    normalizeSectionFilters(
      filters,
    );

  return {
    templateId,

    status:
      normalized.status ||
      undefined,

    sectionType:
      normalized.sectionType ||
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

function createTemplateQuestionServiceFilters(
  templateId,
  sectionId,
  filters,
) {
  const normalized =
    normalizeTemplateQuestionFilters(
      filters,
    );

  return {
    templateId,

    sectionId:
      sectionId ||
      undefined,

    required:
      normalized.required ===
      null
        ? undefined
        : normalized.required,

    randomizationGroup:
      normalized.randomizationGroup ||
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

export function useAssessmentTemplateState({
  service,

  workspaceReady,
  authorizationReady,

  canViewAssessments,
  canCreateAssessments,
  canEditAssessments,
  canPublishAssessments,
} = {}) {
  const mountedRef =
    useRef(true);

  const templateRequestRef =
    useRef(0);

  const sectionRequestRef =
    useRef(0);

  const templateQuestionRequestRef =
    useRef(0);

  const selectedTemplateRequestRef =
    useRef(0);

  const [
    templateResult,
    setTemplateResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    sectionResult,
    setSectionResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    templateQuestionResult,
    setTemplateQuestionResult,
  ] = useState(
    EMPTY_PAGED_RESULT,
  );

  const [
    templateFilters,
    setTemplateFiltersState,
  ] = useState(
    DEFAULT_TEMPLATE_FILTERS,
  );

  const [
    sectionFilters,
    setSectionFiltersState,
  ] = useState(
    DEFAULT_SECTION_FILTERS,
  );

  const [
    templateQuestionFilters,
    setTemplateQuestionFiltersState,
  ] = useState(
    DEFAULT_TEMPLATE_QUESTION_FILTERS,
  );

  const [
    templatesLoading,
    setTemplatesLoading,
  ] = useState(false);

  const [
    selectedTemplateLoading,
    setSelectedTemplateLoading,
  ] = useState(false);

  const [
    sectionsLoading,
    setSectionsLoading,
  ] = useState(false);

  const [
    templateQuestionsLoading,
    setTemplateQuestionsLoading,
  ] = useState(false);

  const [
    templatesError,
    setTemplatesError,
  ] = useState("");

  const [
    selectedTemplateError,
    setSelectedTemplateError,
  ] = useState("");

  const [
    sectionsError,
    setSectionsError,
  ] = useState("");

  const [
    templateQuestionsError,
    setTemplateQuestionsError,
  ] = useState("");

  const [
    templateMutationLoading,
    setTemplateMutationLoading,
  ] = useState(false);

  const [
    sectionMutationLoading,
    setSectionMutationLoading,
  ] = useState(false);

  const [
    templateQuestionMutationLoading,
    setTemplateQuestionMutationLoading,
  ] = useState(false);

  const [
    lifecycleLoading,
    setLifecycleLoading,
  ] = useState(false);

  const [
    templateMutationError,
    setTemplateMutationError,
  ] = useState("");

  const [
    sectionMutationError,
    setSectionMutationError,
  ] = useState("");

  const [
    templateQuestionMutationError,
    setTemplateQuestionMutationError,
  ] = useState("");

  const [
    lifecycleError,
    setLifecycleError,
  ] = useState("");

  const [
    selectedTemplateId,
    setSelectedTemplateId,
  ] = useState(null);

  const [
    selectedTemplateRecord,
    setSelectedTemplateRecord,
  ] = useState(null);

  const [
    selectedTemplateSectionId,
    setSelectedTemplateSectionId,
  ] = useState(null);

  const templates =
    useMemo(
      () =>
        templateResult.items,
      [
        templateResult,
      ],
    );

  const templateSections =
    useMemo(
      () =>
        sectionResult.items,
      [
        sectionResult,
      ],
    );

  const templateQuestions =
    useMemo(
      () =>
        templateQuestionResult.items,
      [
        templateQuestionResult,
      ],
    );

  const selectedTemplate =
    useMemo(
      () =>
        selectedTemplateRecord ||
        templates.find(
          (template) =>
            template.id ===
            selectedTemplateId,
        ) ||
        null,
      [
        selectedTemplateRecord,
        templates,
        selectedTemplateId,
      ],
    );

  const selectedTemplateSection =
    useMemo(
      () =>
        templateSections.find(
          (section) =>
            section.id ===
            selectedTemplateSectionId,
        ) || null,
      [
        templateSections,
        selectedTemplateSectionId,
      ],
    );

  const templateLoading =
    templatesLoading ||
    selectedTemplateLoading ||
    sectionsLoading ||
    templateQuestionsLoading;

  const templateError =
    templatesError ||
    selectedTemplateError ||
    sectionsError ||
    templateQuestionsError;

  const templateReady =
    workspaceReady &&
    authorizationReady &&
    canViewAssessments &&
    Boolean(service) &&
    !templateLoading &&
    !templateError;

  const templateBuilderReady =
    templateReady &&
    Boolean(selectedTemplateId);

  const resetTemplateComposition =
    useCallback(() => {
      sectionRequestRef.current += 1;
      templateQuestionRequestRef.current += 1;
      selectedTemplateRequestRef.current += 1;

      setSectionResult(
        EMPTY_PAGED_RESULT,
      );

      setTemplateQuestionResult(
        EMPTY_PAGED_RESULT,
      );

      setSelectedTemplateRecord(
        null,
      );

      setSelectedTemplateSectionId(
        null,
      );

      setSelectedTemplateLoading(
        false,
      );

      setSectionsLoading(
        false,
      );

      setTemplateQuestionsLoading(
        false,
      );

      setSelectedTemplateError(
        "",
      );

      setSectionsError(
        "",
      );

      setTemplateQuestionsError(
        "",
      );
    }, []);

  const resetTemplates =
    useCallback(() => {
      templateRequestRef.current += 1;

      setTemplateResult(
        EMPTY_PAGED_RESULT,
      );

      setTemplatesLoading(
        false,
      );

      setTemplatesError(
        "",
      );

      setTemplateMutationLoading(
        false,
      );

      setSectionMutationLoading(
        false,
      );

      setTemplateQuestionMutationLoading(
        false,
      );

      setLifecycleLoading(
        false,
      );

      setTemplateMutationError(
        "",
      );

      setSectionMutationError(
        "",
      );

      setTemplateQuestionMutationError(
        "",
      );

      setLifecycleError(
        "",
      );

      setSelectedTemplateId(
        null,
      );

      resetTemplateComposition();
    }, [
      resetTemplateComposition,
    ]);

  const updateTemplateFilters =
    useCallback(
      (
        updates = {},
      ) => {
        setTemplateFiltersState(
          (
            currentFilters,
          ) =>
            normalizeTemplateFilters({
              ...currentFilters,
              ...updates,

              page:
                updates.page ??
                1,
            }),
        );
      },
      [],
    );

  const updateSectionFilters =
    useCallback(
      (
        updates = {},
      ) => {
        setSectionFiltersState(
          (
            currentFilters,
          ) =>
            normalizeSectionFilters({
              ...currentFilters,
              ...updates,

              page:
                updates.page ??
                1,
            }),
        );
      },
      [],
    );

  const updateTemplateQuestionFilters =
    useCallback(
      (
        updates = {},
      ) => {
        setTemplateQuestionFiltersState(
          (
            currentFilters,
          ) =>
            normalizeTemplateQuestionFilters({
              ...currentFilters,
              ...updates,

              page:
                updates.page ??
                1,
            }),
        );
      },
      [],
    );

  const resetTemplateFilters =
    useCallback(() => {
      setTemplateFiltersState(
        DEFAULT_TEMPLATE_FILTERS,
      );
    }, []);

  const resetSectionFilters =
    useCallback(() => {
      setSectionFiltersState(
        DEFAULT_SECTION_FILTERS,
      );
    }, []);

  const resetTemplateQuestionFilters =
    useCallback(() => {
      setTemplateQuestionFiltersState(
        DEFAULT_TEMPLATE_QUESTION_FILTERS,
      );
    }, []);

  const selectTemplate =
    useCallback(
      (
        templateId,
      ) => {
        const resolvedId =
          templateId ||
          null;

        setSelectedTemplateId(
          resolvedId,
        );

        resetTemplateComposition();
      },
      [
        resetTemplateComposition,
      ],
    );

  const selectTemplateSection =
    useCallback(
      (
        sectionId,
      ) => {
        setSelectedTemplateSectionId(
          sectionId ||
          null,
        );
      },
      [],
    );

  const refreshTemplates =
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
          resetTemplates();
          return EMPTY_PAGED_RESULT;
        }

        const resolvedFilters =
          normalizeTemplateFilters({
            ...templateFilters,
            ...(filtersOverride ||
              {}),
          });

        const requestId =
          ++templateRequestRef.current;

        setTemplatesLoading(
          true,
        );

        setTemplatesError(
          "",
        );

        try {
          const result =
            await service
              .getAssessmentTemplates(
                createTemplateServiceFilters(
                  resolvedFilters,
                ),
              );

          if (
            !mountedRef.current ||
            requestId !==
              templateRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters.page,
              resolvedFilters.pageSize,
            );

          setTemplateResult(
            normalizedResult,
          );

          setSelectedTemplateId(
            (
              currentId,
            ) =>
              currentId &&
              normalizedResult.items.some(
                (template) =>
                  template.id ===
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
              templateRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          setTemplateResult(
            EMPTY_PAGED_RESULT,
          );

          setTemplatesError(
            getErrorMessage(
              error,
              "Unable to load assessment templates.",
            ),
          );

          return EMPTY_PAGED_RESULT;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              templateRequestRef.current
          ) {
            setTemplatesLoading(
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
        templateFilters,
        resetTemplates,
      ],
    );

  const refreshSelectedTemplate =
    useCallback(
      async (
        templateId =
          selectedTemplateId,
      ) => {
        if (
          !service ||
          !templateId ||
          !canViewAssessments
        ) {
          setSelectedTemplateRecord(
            null,
          );

          return null;
        }

        const requestId =
          ++selectedTemplateRequestRef.current;

        setSelectedTemplateLoading(
          true,
        );

        setSelectedTemplateError(
          "",
        );

        try {
          const record =
            await service
              .getAssessmentTemplate(
                templateId,
              );

          if (
            !mountedRef.current ||
            requestId !==
              selectedTemplateRequestRef.current
          ) {
            return null;
          }

          setSelectedTemplateRecord(
            record,
          );

          return record;
        } catch (error) {
          if (
            !mountedRef.current ||
            requestId !==
              selectedTemplateRequestRef.current
          ) {
            return null;
          }

          setSelectedTemplateRecord(
            null,
          );

          setSelectedTemplateError(
            getErrorMessage(
              error,
              "Unable to load the assessment template.",
            ),
          );

          return null;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              selectedTemplateRequestRef.current
          ) {
            setSelectedTemplateLoading(
              false,
            );
          }
        }
      },
      [
        service,
        selectedTemplateId,
        canViewAssessments,
      ],
    );

  const refreshTemplateSections =
    useCallback(
      async (
        filtersOverride = null,
        templateId =
          selectedTemplateId,
      ) => {
        if (
          !service ||
          !templateId ||
          !canViewAssessments
        ) {
          setSectionResult(
            EMPTY_PAGED_RESULT,
          );

          setSelectedTemplateSectionId(
            null,
          );

          return EMPTY_PAGED_RESULT;
        }

        const resolvedFilters =
          normalizeSectionFilters({
            ...sectionFilters,
            ...(filtersOverride ||
              {}),
          });

        const requestId =
          ++sectionRequestRef.current;

        setSectionsLoading(
          true,
        );

        setSectionsError(
          "",
        );

        try {
          const result =
            await service
              .getAssessmentTemplateSections(
                createSectionServiceFilters(
                  templateId,
                  resolvedFilters,
                ),
              );

          if (
            !mountedRef.current ||
            requestId !==
              sectionRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters.page,
              resolvedFilters.pageSize,
            );

          setSectionResult(
            normalizedResult,
          );

          setSelectedTemplateSectionId(
            (
              currentId,
            ) =>
              currentId &&
              normalizedResult.items.some(
                (section) =>
                  section.id ===
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
              sectionRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          setSectionResult(
            EMPTY_PAGED_RESULT,
          );

          setSelectedTemplateSectionId(
            null,
          );

          setSectionsError(
            getErrorMessage(
              error,
              "Unable to load assessment template sections.",
            ),
          );

          return EMPTY_PAGED_RESULT;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              sectionRequestRef.current
          ) {
            setSectionsLoading(
              false,
            );
          }
        }
      },
      [
        service,
        selectedTemplateId,
        canViewAssessments,
        sectionFilters,
      ],
    );

  const refreshTemplateQuestions =
    useCallback(
      async (
        filtersOverride = null,
        templateId =
          selectedTemplateId,
        sectionId =
          selectedTemplateSectionId,
      ) => {
        if (
          !service ||
          !templateId ||
          !canViewAssessments
        ) {
          setTemplateQuestionResult(
            EMPTY_PAGED_RESULT,
          );

          return EMPTY_PAGED_RESULT;
        }

        const resolvedFilters =
          normalizeTemplateQuestionFilters({
            ...templateQuestionFilters,
            ...(filtersOverride ||
              {}),
          });

        const requestId =
          ++templateQuestionRequestRef.current;

        setTemplateQuestionsLoading(
          true,
        );

        setTemplateQuestionsError(
          "",
        );

        try {
          const result =
            await service
              .getAssessmentTemplateQuestions(
                createTemplateQuestionServiceFilters(
                  templateId,
                  sectionId,
                  resolvedFilters,
                ),
              );

          if (
            !mountedRef.current ||
            requestId !==
              templateQuestionRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          const normalizedResult =
            normalizePagedResult(
              result,
              resolvedFilters.page,
              resolvedFilters.pageSize,
            );

          setTemplateQuestionResult(
            normalizedResult,
          );

          return normalizedResult;
        } catch (error) {
          if (
            !mountedRef.current ||
            requestId !==
              templateQuestionRequestRef.current
          ) {
            return EMPTY_PAGED_RESULT;
          }

          setTemplateQuestionResult(
            EMPTY_PAGED_RESULT,
          );

          setTemplateQuestionsError(
            getErrorMessage(
              error,
              "Unable to load assessment template questions.",
            ),
          );

          return EMPTY_PAGED_RESULT;
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              templateQuestionRequestRef.current
          ) {
            setTemplateQuestionsLoading(
              false,
            );
          }
        }
      },
      [
        service,
        selectedTemplateId,
        selectedTemplateSectionId,
        canViewAssessments,
        templateQuestionFilters,
      ],
    );

  const refreshTemplateBuilder =
    useCallback(
      async (
        templateId =
          selectedTemplateId,
      ) => {
        if (!templateId) {
          resetTemplateComposition();

          return {
            template: null,
            sections:
              EMPTY_PAGED_RESULT,
            questions:
              EMPTY_PAGED_RESULT,
          };
        }

        const [
          template,
          sections,
          questions,
        ] = await Promise.all([
          refreshSelectedTemplate(
            templateId,
          ),

          refreshTemplateSections(
            null,
            templateId,
          ),

          refreshTemplateQuestions(
            null,
            templateId,
            null,
          ),
        ]);

        return {
          template,
          sections,
          questions,
        };
      },
      [
        selectedTemplateId,
        refreshSelectedTemplate,
        refreshTemplateSections,
        refreshTemplateQuestions,
        resetTemplateComposition,
      ],
    );

  const createTemplate =
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
            "You do not have permission to create assessment templates.",
          );
        }

        setTemplateMutationLoading(
          true,
        );

        setTemplateMutationError(
          "",
        );

        try {
          const created =
            await service
              .createAssessmentTemplate(
                payload,
              );

          await refreshTemplates();

          if (created?.id) {
            setSelectedTemplateId(
              created.id,
            );

            await refreshTemplateBuilder(
              created.id,
            );
          }

          return created;
        } catch (error) {
          setTemplateMutationError(
            getErrorMessage(
              error,
              "Unable to create the assessment template.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setTemplateMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAssessments,
        refreshTemplates,
        refreshTemplateBuilder,
      ],
    );

  const updateTemplate =
    useCallback(
      async (
        templateId,
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
            "You do not have permission to edit assessment templates.",
          );
        }

        if (!templateId) {
          throw new Error(
            "Assessment template id is required.",
          );
        }

        setTemplateMutationLoading(
          true,
        );

        setTemplateMutationError(
          "",
        );

        try {
          const updated =
            await service
              .updateAssessmentTemplate(
                templateId,
                updates,
              );

          await Promise.all([
            refreshTemplates(),

            refreshSelectedTemplate(
              templateId,
            ),
          ]);

          return updated;
        } catch (error) {
          setTemplateMutationError(
            getErrorMessage(
              error,
              "Unable to update the assessment template.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setTemplateMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        refreshTemplates,
        refreshSelectedTemplate,
      ],
    );

  const deleteTemplate =
    useCallback(
      async (
        templateId,
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
            "You do not have permission to delete assessment templates.",
          );
        }

        if (!templateId) {
          throw new Error(
            "Assessment template id is required.",
          );
        }

        setTemplateMutationLoading(
          true,
        );

        setTemplateMutationError(
          "",
        );

        try {
          const deleted =
            await service
              .deleteAssessmentTemplate(
                templateId,
                deletedBy,
              );

          if (
            selectedTemplateId ===
            templateId
          ) {
            setSelectedTemplateId(
              null,
            );

            resetTemplateComposition();
          }

          await refreshTemplates();

          return deleted;
        } catch (error) {
          setTemplateMutationError(
            getErrorMessage(
              error,
              "Unable to delete the assessment template.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setTemplateMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        selectedTemplateId,
        refreshTemplates,
        resetTemplateComposition,
      ],
    );

  const createTemplateSection =
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
          !canCreateAssessments &&
          !canEditAssessments
        ) {
          throw new Error(
            "You do not have permission to create assessment template sections.",
          );
        }

        if (
          !payload.template_id &&
          !selectedTemplateId
        ) {
          throw new Error(
            "Assessment template id is required.",
          );
        }

        setSectionMutationLoading(
          true,
        );

        setSectionMutationError(
          "",
        );

        try {
          const created =
            await service
              .createAssessmentTemplateSection({
                ...payload,

                template_id:
                  payload.template_id ||
                  selectedTemplateId,
              });

          await refreshTemplateSections();

          if (created?.id) {
            setSelectedTemplateSectionId(
              created.id,
            );
          }

          return created;
        } catch (error) {
          setSectionMutationError(
            getErrorMessage(
              error,
              "Unable to create the assessment template section.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setSectionMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAssessments,
        canEditAssessments,
        selectedTemplateId,
        refreshTemplateSections,
      ],
    );

  const updateTemplateSection =
    useCallback(
      async (
        sectionId,
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
            "You do not have permission to edit assessment template sections.",
          );
        }

        if (!sectionId) {
          throw new Error(
            "Assessment template section id is required.",
          );
        }

        setSectionMutationLoading(
          true,
        );

        setSectionMutationError(
          "",
        );

        try {
          const updated =
            await service
              .updateAssessmentTemplateSection(
                sectionId,
                updates,
              );

          await refreshTemplateSections();

          return updated;
        } catch (error) {
          setSectionMutationError(
            getErrorMessage(
              error,
              "Unable to update the assessment template section.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setSectionMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        refreshTemplateSections,
      ],
    );

  const deleteTemplateSection =
    useCallback(
      async (
        sectionId,
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
            "You do not have permission to delete assessment template sections.",
          );
        }

        if (!sectionId) {
          throw new Error(
            "Assessment template section id is required.",
          );
        }

        setSectionMutationLoading(
          true,
        );

        setSectionMutationError(
          "",
        );

        try {
          const deleted =
            await service
              .deleteAssessmentTemplateSection(
                sectionId,
                deletedBy,
              );

          if (
            selectedTemplateSectionId ===
            sectionId
          ) {
            setSelectedTemplateSectionId(
              null,
            );
          }

          await Promise.all([
            refreshTemplateSections(),

            refreshTemplateQuestions(
              null,
              selectedTemplateId,
              null,
            ),
          ]);

          return deleted;
        } catch (error) {
          setSectionMutationError(
            getErrorMessage(
              error,
              "Unable to delete the assessment template section.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setSectionMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        selectedTemplateSectionId,
        selectedTemplateId,
        refreshTemplateSections,
        refreshTemplateQuestions,
      ],
    );

  const addTemplateQuestion =
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
          !canCreateAssessments &&
          !canEditAssessments
        ) {
          throw new Error(
            "You do not have permission to add assessment template questions.",
          );
        }

        if (
          !payload.template_id &&
          !selectedTemplateId
        ) {
          throw new Error(
            "Assessment template id is required.",
          );
        }

        setTemplateQuestionMutationLoading(
          true,
        );

        setTemplateQuestionMutationError(
          "",
        );

        try {
          const created =
            await service
              .createAssessmentTemplateQuestion({
                ...payload,

                template_id:
                  payload.template_id ||
                  selectedTemplateId,

                section_id:
                  payload.section_id ??
                  selectedTemplateSectionId ??
                  null,
              });

          await refreshTemplateQuestions();

          return created;
        } catch (error) {
          setTemplateQuestionMutationError(
            getErrorMessage(
              error,
              "Unable to add the question to the assessment template.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setTemplateQuestionMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canCreateAssessments,
        canEditAssessments,
        selectedTemplateId,
        selectedTemplateSectionId,
        refreshTemplateQuestions,
      ],
    );

  const updateTemplateQuestion =
    useCallback(
      async (
        templateQuestionId,
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
            "You do not have permission to edit assessment template questions.",
          );
        }

        if (!templateQuestionId) {
          throw new Error(
            "Assessment template question id is required.",
          );
        }

        setTemplateQuestionMutationLoading(
          true,
        );

        setTemplateQuestionMutationError(
          "",
        );

        try {
          const updated =
            await service
              .updateAssessmentTemplateQuestion(
                templateQuestionId,
                updates,
              );

          await refreshTemplateQuestions();

          return updated;
        } catch (error) {
          setTemplateQuestionMutationError(
            getErrorMessage(
              error,
              "Unable to update the assessment template question.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setTemplateQuestionMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        refreshTemplateQuestions,
      ],
    );

  const deleteTemplateQuestion =
    useCallback(
      async (
        templateQuestionId,
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
            "You do not have permission to remove assessment template questions.",
          );
        }

        if (!templateQuestionId) {
          throw new Error(
            "Assessment template question id is required.",
          );
        }

        setTemplateQuestionMutationLoading(
          true,
        );

        setTemplateQuestionMutationError(
          "",
        );

        try {
          const deleted =
            await service
              .deleteAssessmentTemplateQuestion(
                templateQuestionId,
                deletedBy,
              );

          await refreshTemplateQuestions();

          return deleted;
        } catch (error) {
          setTemplateQuestionMutationError(
            getErrorMessage(
              error,
              "Unable to remove the question from the assessment template.",
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setTemplateQuestionMutationLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canEditAssessments,
        refreshTemplateQuestions,
      ],
    );

  const runLifecycleAction =
    useCallback(
      async (
        action,
        templateId,
        fallbackMessage,
      ) => {
        if (!service) {
          throw new Error(
            "Assessment service is not available.",
          );
        }

        if (
          !canPublishAssessments
        ) {
          throw new Error(
            "You do not have permission to manage assessment template lifecycle.",
          );
        }

        if (!templateId) {
          throw new Error(
            "Assessment template id is required.",
          );
        }

        setLifecycleLoading(
          true,
        );

        setLifecycleError(
          "",
        );

        try {
          const result =
            await action(
              templateId,
            );

          await Promise.all([
            refreshTemplates(),

            refreshSelectedTemplate(
              templateId,
            ),
          ]);

          return result;
        } catch (error) {
          setLifecycleError(
            getErrorMessage(
              error,
              fallbackMessage,
            ),
          );

          throw error;
        } finally {
          if (mountedRef.current) {
            setLifecycleLoading(
              false,
            );
          }
        }
      },
      [
        service,
        canPublishAssessments,
        refreshTemplates,
        refreshSelectedTemplate,
      ],
    );

  const publishTemplate =
    useCallback(
      (
        templateId =
          selectedTemplateId,
      ) =>
        runLifecycleAction(
          (
            currentTemplateId,
          ) =>
            service
              .publishAssessmentTemplate(
                currentTemplateId,
              ),

          templateId,

          "Unable to publish the assessment template.",
        ),
      [
        service,
        selectedTemplateId,
        runLifecycleAction,
      ],
    );

  const pauseTemplate =
    useCallback(
      (
        templateId =
          selectedTemplateId,
      ) =>
        runLifecycleAction(
          (
            currentTemplateId,
          ) =>
            service
              .pauseAssessmentTemplate(
                currentTemplateId,
              ),

          templateId,

          "Unable to pause the assessment template.",
        ),
      [
        service,
        selectedTemplateId,
        runLifecycleAction,
      ],
    );

  const retireTemplate =
    useCallback(
      (
        templateId =
          selectedTemplateId,
      ) =>
        runLifecycleAction(
          (
            currentTemplateId,
          ) =>
            service
              .retireAssessmentTemplate(
                currentTemplateId,
              ),

          templateId,

          "Unable to retire the assessment template.",
        ),
      [
        service,
        selectedTemplateId,
        runLifecycleAction,
      ],
    );

  const clearTemplatesError =
    useCallback(() => {
      setTemplatesError("");
    }, []);

  const clearSelectedTemplateError =
    useCallback(() => {
      setSelectedTemplateError("");
    }, []);

  const clearSectionsError =
    useCallback(() => {
      setSectionsError("");
    }, []);

  const clearTemplateQuestionsError =
    useCallback(() => {
      setTemplateQuestionsError("");
    }, []);

  const clearTemplateMutationError =
    useCallback(() => {
      setTemplateMutationError("");
    }, []);

  const clearSectionMutationError =
    useCallback(() => {
      setSectionMutationError("");
    }, []);

  const clearTemplateQuestionMutationError =
    useCallback(() => {
      setTemplateQuestionMutationError("");
    }, []);

  const clearLifecycleError =
    useCallback(() => {
      setLifecycleError("");
    }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      templateRequestRef.current += 1;
      sectionRequestRef.current += 1;
      templateQuestionRequestRef.current += 1;
      selectedTemplateRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (
      !service ||
      !workspaceReady ||
      !authorizationReady ||
      !canViewAssessments
    ) {
      resetTemplates();
    }
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    resetTemplates,
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

    refreshTemplates();
  }, [
    service,
    workspaceReady,
    authorizationReady,
    canViewAssessments,
    templateFilters,
    refreshTemplates,
  ]);

  useEffect(() => {
    if (
      !service ||
      !selectedTemplateId ||
      !canViewAssessments
    ) {
      resetTemplateComposition();
      return;
    }

    refreshTemplateBuilder(
      selectedTemplateId,
    );
  }, [
    service,
    selectedTemplateId,
    canViewAssessments,
    refreshTemplateBuilder,
    resetTemplateComposition,
  ]);

  useEffect(() => {
    if (
      !service ||
      !selectedTemplateId ||
      !canViewAssessments
    ) {
      return;
    }

    refreshTemplateSections();
  }, [
    service,
    selectedTemplateId,
    canViewAssessments,
    sectionFilters,
    refreshTemplateSections,
  ]);

  useEffect(() => {
    if (
      !service ||
      !selectedTemplateId ||
      !canViewAssessments
    ) {
      return;
    }

    refreshTemplateQuestions();
  }, [
    service,
    selectedTemplateId,
    selectedTemplateSectionId,
    canViewAssessments,
    templateQuestionFilters,
    refreshTemplateQuestions,
  ]);

  return useMemo(
    () => ({
      templates,
      templateResult,
      templateFilters,
      updateTemplateFilters,
      resetTemplateFilters,

      templatesLoading,
      templatesError,

      selectedTemplateId,
      selectedTemplate,
      selectedTemplateLoading,
      selectedTemplateError,
      selectTemplate,

      templateSections,
      sectionResult,
      sectionFilters,
      updateSectionFilters,
      resetSectionFilters,
      sectionsLoading,
      sectionsError,

      selectedTemplateSectionId,
      selectedTemplateSection,
      selectTemplateSection,

      templateQuestions,
      templateQuestionResult,
      templateQuestionFilters,
      updateTemplateQuestionFilters,
      resetTemplateQuestionFilters,
      templateQuestionsLoading,
      templateQuestionsError,

      templateMutationLoading,
      sectionMutationLoading,
      templateQuestionMutationLoading,
      lifecycleLoading,

      templateMutationError,
      sectionMutationError,
      templateQuestionMutationError,
      lifecycleError,

      templateLoading,
      templateError,
      templateReady,
      templateBuilderReady,

      refreshTemplates,
      refreshSelectedTemplate,
      refreshTemplateSections,
      refreshTemplateQuestions,
      refreshTemplateBuilder,

      createTemplate,
      updateTemplate,
      deleteTemplate,

      createTemplateSection,
      updateTemplateSection,
      deleteTemplateSection,

      addTemplateQuestion,
      updateTemplateQuestion,
      deleteTemplateQuestion,

      publishTemplate,
      pauseTemplate,
      retireTemplate,

      clearTemplatesError,
      clearSelectedTemplateError,
      clearSectionsError,
      clearTemplateQuestionsError,
      clearTemplateMutationError,
      clearSectionMutationError,
      clearTemplateQuestionMutationError,
      clearLifecycleError,

      resetTemplates,
      resetTemplateComposition,
    }),
    [
      templates,
      templateResult,
      templateFilters,
      updateTemplateFilters,
      resetTemplateFilters,

      templatesLoading,
      templatesError,

      selectedTemplateId,
      selectedTemplate,
      selectedTemplateLoading,
      selectedTemplateError,
      selectTemplate,

      templateSections,
      sectionResult,
      sectionFilters,
      updateSectionFilters,
      resetSectionFilters,
      sectionsLoading,
      sectionsError,

      selectedTemplateSectionId,
      selectedTemplateSection,
      selectTemplateSection,

      templateQuestions,
      templateQuestionResult,
      templateQuestionFilters,
      updateTemplateQuestionFilters,
      resetTemplateQuestionFilters,
      templateQuestionsLoading,
      templateQuestionsError,

      templateMutationLoading,
      sectionMutationLoading,
      templateQuestionMutationLoading,
      lifecycleLoading,

      templateMutationError,
      sectionMutationError,
      templateQuestionMutationError,
      lifecycleError,

      templateLoading,
      templateError,
      templateReady,
      templateBuilderReady,

      refreshTemplates,
      refreshSelectedTemplate,
      refreshTemplateSections,
      refreshTemplateQuestions,
      refreshTemplateBuilder,

      createTemplate,
      updateTemplate,
      deleteTemplate,

      createTemplateSection,
      updateTemplateSection,
      deleteTemplateSection,

      addTemplateQuestion,
      updateTemplateQuestion,
      deleteTemplateQuestion,

      publishTemplate,
      pauseTemplate,
      retireTemplate,

      clearTemplatesError,
      clearSelectedTemplateError,
      clearSectionsError,
      clearTemplateQuestionsError,
      clearTemplateMutationError,
      clearSectionMutationError,
      clearTemplateQuestionMutationError,
      clearLifecycleError,

      resetTemplates,
      resetTemplateComposition,
    ],
  );
}

export default useAssessmentTemplateState;
