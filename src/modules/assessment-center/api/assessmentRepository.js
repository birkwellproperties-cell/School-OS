import {
  supabase,
} from "../../../services/supabase";

import {
  AssessmentTable,
} from "../constants";

import {
  createAssessmentRepositoryError,
} from "../utils";

import {
  applyArrayFilter,
  applyExactFilter,
  applyOrdering,
  applyPagination,
  applySearch,
  createPagedResult,
  normalizePagination,
} from "./assessmentQuery";

const DEFAULT_SELECT = "*";

function throwRepositoryError({
  error,
  operation,
  table,
  fallbackMessage,
}) {
  throw createAssessmentRepositoryError({
    error,
    operation,
    table,
    fallbackMessage,
  });
}

function normalizeIdentifier(
  value,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  return normalized || null;
}

function requireIdentifier(
  value,
  label = "Record id",
) {
  const normalized =
    normalizeIdentifier(
      value,
    );

  if (!normalized) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return normalized;
}

function normalizePayload(
  payload,
) {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return {};
  }

  return {
    ...payload,
  };
}

async function getSingleRecord({
  table,
  id,
  select = DEFAULT_SELECT,
  includeDeleted = false,
  operation,
  fallbackMessage,
}) {
  const recordId =
    requireIdentifier(
      id,
    );

  let query = supabase
    .from(table)
    .select(select)
    .eq(
      "id",
      recordId,
    );

  if (!includeDeleted) {
    query = query.is(
      "deleted_at",
      null,
    );
  }

  const {
    data,
    error,
  } = await query.maybeSingle();

  if (error) {
    throwRepositoryError({
      error,
      operation,
      table,
      fallbackMessage,
    });
  }

  return data || null;
}

async function getPagedRecords({
  table,
  select = DEFAULT_SELECT,
  filters = {},
  searchColumns = [],

  allowedSortColumns = [
    "created_at",
    "updated_at",
  ],

  supportedFilters = {
    organizationId: true,
    schoolId: true,
    campusId: false,
    bankId: false,
    categoryId: false,
    subjectId: false,
    topicId: false,
    templateId: false,
    sectionId: false,
    questionId: false,
    ownerId: false,
    questionType: false,
    difficulty: false,
    assessmentType: false,
    deliveryMode: false,
    audienceType: false,
    status: true,
    statuses: true,
  },

  includeDeletedFilter = true,

  configureQuery,

  operation,
  fallbackMessage,
}) {
  const pagination =
    normalizePagination(
      filters,
    );

  let query = supabase
    .from(table)
    .select(
      select,
      {
        count: "exact",
      },
    );

  if (includeDeletedFilter) {
    query = query.is(
      "deleted_at",
      null,
    );
  }

  if (
    supportedFilters.organizationId
  ) {
    query = applyExactFilter(
      query,
      "organization_id",
      filters.organizationId,
    );
  }

  if (
    supportedFilters.schoolId
  ) {
    query = applyExactFilter(
      query,
      "school_id",
      filters.schoolId,
    );
  }

  if (
    supportedFilters.campusId
  ) {
    query = applyExactFilter(
      query,
      "campus_id",
      filters.campusId,
    );
  }

  if (
    supportedFilters.bankId
  ) {
    query = applyExactFilter(
      query,
      "bank_id",
      filters.bankId,
    );
  }

  if (
    supportedFilters.categoryId
  ) {
    query = applyExactFilter(
      query,
      "category_id",
      filters.categoryId,
    );
  }

  if (
    supportedFilters.subjectId
  ) {
    query = applyExactFilter(
      query,
      "subject_id",
      filters.subjectId,
    );
  }

  if (
    supportedFilters.topicId
  ) {
    query = applyExactFilter(
      query,
      "topic_id",
      filters.topicId,
    );
  }

  if (
    supportedFilters.templateId
  ) {
    query = applyExactFilter(
      query,
      "template_id",
      filters.templateId,
    );
  }

  if (
    supportedFilters.sectionId
  ) {
    query = applyExactFilter(
      query,
      "section_id",
      filters.sectionId,
    );
  }

  if (
    supportedFilters.questionId
  ) {
    query = applyExactFilter(
      query,
      "question_id",
      filters.questionId,
    );
  }

  if (
    supportedFilters.ownerId
  ) {
    query = applyExactFilter(
      query,
      "owner_id",
      filters.ownerId,
    );
  }

  if (
    supportedFilters.questionType
  ) {
    query = applyExactFilter(
      query,
      "question_type",
      filters.questionType,
    );
  }

  if (
    supportedFilters.difficulty
  ) {
    query = applyExactFilter(
      query,
      "difficulty",
      filters.difficulty,
    );
  }

  if (
    supportedFilters.assessmentType
  ) {
    query = applyExactFilter(
      query,
      "assessment_type",
      filters.assessmentType,
    );
  }

  if (
    supportedFilters.deliveryMode
  ) {
    query = applyExactFilter(
      query,
      "delivery_mode",
      filters.deliveryMode,
    );
  }

  if (
    supportedFilters.audienceType
  ) {
    query = applyExactFilter(
      query,
      "audience_type",
      filters.audienceType,
    );
  }

  if (
    supportedFilters.status
  ) {
    query = applyExactFilter(
      query,
      "status",
      filters.status,
    );
  }

  if (
    supportedFilters.statuses
  ) {
    query = applyArrayFilter(
      query,
      "status",
      filters.statuses,
    );
  }

  query = applySearch(
    query,
    filters.search,
    searchColumns,
  );

  if (
    typeof configureQuery ===
    "function"
  ) {
    query = configureQuery(
      query,
      filters,
    );
  }

  query = applyOrdering(
    query,
    filters,
    allowedSortColumns,
  );

  query = applyPagination(
    query,
    pagination,
  );

  const {
    data,
    error,
    count,
  } = await query;

  if (error) {
    throwRepositoryError({
      error,
      operation,
      table,
      fallbackMessage,
    });
  }

  return createPagedResult({
    data,
    count,

    page:
      pagination.page,

    pageSize:
      pagination.pageSize,
  });
}

async function createRecord({
  table,
  payload,
  select = DEFAULT_SELECT,
  operation,
  fallbackMessage,
}) {
  const normalizedPayload =
    normalizePayload(
      payload,
    );

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .insert(
      normalizedPayload,
    )
    .select(select)
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation,
      table,
      fallbackMessage,
    });
  }

  return data;
}

async function updateRecord({
  table,
  id,
  updates,
  select = DEFAULT_SELECT,
  operation,
  fallbackMessage,
}) {
  const recordId =
    requireIdentifier(
      id,
    );

  const normalizedUpdates =
    normalizePayload(
      updates,
    );

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .update(
      normalizedUpdates,
    )
    .eq(
      "id",
      recordId,
    )
    .is(
      "deleted_at",
      null,
    )
    .select(select)
    .maybeSingle();

  if (error) {
    throwRepositoryError({
      error,
      operation,
      table,
      fallbackMessage,
    });
  }

  if (!data) {
    throw new Error(
      "The requested assessment record could not be found.",
    );
  }

  return data;
}

async function softDeleteRecord({
  table,
  id,
  deletedBy = null,
  operation,
  fallbackMessage,
}) {
  const recordId =
    requireIdentifier(
      id,
    );

  const deletedAt =
    new Date().toISOString();

  const {
    error,
  } = await supabase
    .from(table)
    .update({
      deleted_at:
        deletedAt,

      deleted_by:
        deletedBy || null,
    })
    .eq(
      "id",
      recordId,
    )
    .is(
      "deleted_at",
      null,
    );

  if (error) {
    throwRepositoryError({
      error,
      operation,
      table,
      fallbackMessage,
    });
  }

  return {
    id:
      recordId,

    deleted_at:
      deletedAt,

    deleted_by:
      deletedBy || null,
  };
}

async function callRecordRpc({
  functionName,
  args,
  operation,
  fallbackMessage,
}) {
  const {
    data,
    error,
  } = await supabase.rpc(
    functionName,
    args,
  );

  if (error) {
    throwRepositoryError({
      error,
      operation,
      table: null,
      fallbackMessage,
    });
  }

  return data || null;
}

/*
 * Domain-specific repository methods are appended below.
 *
 * Part 2:
 *   Banks, categories, subjects, and topics
 *
 * Part 3:
 *   Questions and answer options
 *
 * Part 4:
 *   Templates, sections, composition, and publishing RPCs
 */

// ============================================================
// ASSESSMENT BANKS
// ============================================================

async function getAssessmentBanks(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.BANKS,

    filters,

    searchColumns: [
      "name",
      "code",
      "description",
    ],

    allowedSortColumns: [
      "name",
      "code",
      "status",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      campusId: true,
      ownerId: true,
      status: true,
      statuses: true,
    },

    operation:
      "load assessment banks",

    fallbackMessage:
      "Unable to load assessment banks.",
  });
}

async function getAssessmentBank(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.BANKS,

    id,

    operation:
      "load assessment bank",

    fallbackMessage:
      "Unable to load the assessment bank.",
  });
}

async function createAssessmentBank(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.BANKS,

    payload,

    operation:
      "create assessment bank",

    fallbackMessage:
      "Unable to create the assessment bank.",
  });
}

async function updateAssessmentBank(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.BANKS,

    id,
    updates,

    operation:
      "update assessment bank",

    fallbackMessage:
      "Unable to update the assessment bank.",
  });
}

async function deleteAssessmentBank(
  id,
  deletedBy = null,
) {
  return softDeleteRecord({
    table:
      AssessmentTable.BANKS,

    id,
    deletedBy,

    operation:
      "delete assessment bank",

    fallbackMessage:
      "Unable to delete the assessment bank.",
  });
}

// ============================================================
// ASSESSMENT CATEGORIES
// ============================================================

async function getAssessmentCategories(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.CATEGORIES,

    filters,

    searchColumns: [
      "name",
      "code",
      "description",
    ],

    allowedSortColumns: [
      "display_order",
      "name",
      "code",
      "status",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      status: true,
      statuses: true,
    },

    configureQuery:
      (
        query,
        currentFilters,
      ) => {
        if (
          currentFilters.parentCategoryId !==
            undefined &&
          currentFilters.parentCategoryId !==
            null &&
          currentFilters.parentCategoryId !==
            ""
        ) {
          query = query.eq(
            "parent_category_id",
            currentFilters.parentCategoryId,
          );
        }

        if (
          currentFilters.rootOnly ===
          true
        ) {
          query = query.is(
            "parent_category_id",
            null,
          );
        }

        return query;
      },

    operation:
      "load assessment categories",

    fallbackMessage:
      "Unable to load assessment categories.",
  });
}

async function getAssessmentCategory(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.CATEGORIES,

    id,

    operation:
      "load assessment category",

    fallbackMessage:
      "Unable to load the assessment category.",
  });
}

async function createAssessmentCategory(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.CATEGORIES,

    payload,

    operation:
      "create assessment category",

    fallbackMessage:
      "Unable to create the assessment category.",
  });
}

async function updateAssessmentCategory(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.CATEGORIES,

    id,
    updates,

    operation:
      "update assessment category",

    fallbackMessage:
      "Unable to update the assessment category.",
  });
}

async function deleteAssessmentCategory(
  id,
  deletedBy = null,
) {
  return softDeleteRecord({
    table:
      AssessmentTable.CATEGORIES,

    id,
    deletedBy,

    operation:
      "delete assessment category",

    fallbackMessage:
      "Unable to delete the assessment category.",
  });
}

// ============================================================
// ASSESSMENT SUBJECTS
// ============================================================

async function getAssessmentSubjects(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.SUBJECTS,

    filters,

    searchColumns: [
      "name",
      "code",
      "description",
      "grade_level_from",
      "grade_level_to",
    ],

    allowedSortColumns: [
      "display_order",
      "name",
      "code",
      "status",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      categoryId: true,
      status: true,
      statuses: true,
    },

    operation:
      "load assessment subjects",

    fallbackMessage:
      "Unable to load assessment subjects.",
  });
}

async function getAssessmentSubject(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.SUBJECTS,

    id,

    operation:
      "load assessment subject",

    fallbackMessage:
      "Unable to load the assessment subject.",
  });
}

async function createAssessmentSubject(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.SUBJECTS,

    payload,

    operation:
      "create assessment subject",

    fallbackMessage:
      "Unable to create the assessment subject.",
  });
}

async function updateAssessmentSubject(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.SUBJECTS,

    id,
    updates,

    operation:
      "update assessment subject",

    fallbackMessage:
      "Unable to update the assessment subject.",
  });
}

async function deleteAssessmentSubject(
  id,
  deletedBy = null,
) {
  return softDeleteRecord({
    table:
      AssessmentTable.SUBJECTS,

    id,
    deletedBy,

    operation:
      "delete assessment subject",

    fallbackMessage:
      "Unable to delete the assessment subject.",
  });
}

// ============================================================
// ASSESSMENT TOPICS
// ============================================================

async function getAssessmentTopics(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.TOPICS,

    filters,

    searchColumns: [
      "name",
      "code",
      "description",
      "learning_outcome",
    ],

    allowedSortColumns: [
      "display_order",
      "name",
      "code",
      "status",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      subjectId: true,
      status: true,
      statuses: true,
    },

    configureQuery:
      (
        query,
        currentFilters,
      ) => {
        if (
          currentFilters.parentTopicId !==
            undefined &&
          currentFilters.parentTopicId !==
            null &&
          currentFilters.parentTopicId !==
            ""
        ) {
          query = query.eq(
            "parent_topic_id",
            currentFilters.parentTopicId,
          );
        }

        if (
          currentFilters.rootOnly ===
          true
        ) {
          query = query.is(
            "parent_topic_id",
            null,
          );
        }

        return query;
      },

    operation:
      "load assessment topics",

    fallbackMessage:
      "Unable to load assessment topics.",
  });
}

async function getAssessmentTopic(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.TOPICS,

    id,

    operation:
      "load assessment topic",

    fallbackMessage:
      "Unable to load the assessment topic.",
  });
}

async function createAssessmentTopic(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.TOPICS,

    payload,

    operation:
      "create assessment topic",

    fallbackMessage:
      "Unable to create the assessment topic.",
  });
}

async function updateAssessmentTopic(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.TOPICS,

    id,
    updates,

    operation:
      "update assessment topic",

    fallbackMessage:
      "Unable to update the assessment topic.",
  });
}

async function deleteAssessmentTopic(
  id,
  deletedBy = null,
) {
  return softDeleteRecord({
    table:
      AssessmentTable.TOPICS,

    id,
    deletedBy,

    operation:
      "delete assessment topic",

    fallbackMessage:
      "Unable to delete the assessment topic.",
  });
}

// ============================================================
// ASSESSMENT QUESTIONS
// ============================================================

async function getAssessmentQuestions(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.QUESTIONS,

    filters,

    searchColumns: [
      "question_number",
      "title",
      "prompt",
      "instructions",
      "learning_outcome",
      "explanation",
    ],

    allowedSortColumns: [
      "question_number",
      "question_type",
      "difficulty",
      "default_marks",
      "status",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      bankId: true,
      categoryId: true,
      subjectId: true,
      topicId: true,
      ownerId: true,
      questionType: true,
      difficulty: true,
      status: true,
      statuses: true,
    },

    operation:
      "load assessment questions",

    fallbackMessage:
      "Unable to load assessment questions.",
  });
}

async function getAssessmentQuestion(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.QUESTIONS,

    id,

    operation:
      "load assessment question",

    fallbackMessage:
      "Unable to load the assessment question.",
  });
}

async function createAssessmentQuestion(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.QUESTIONS,

    payload,

    operation:
      "create assessment question",

    fallbackMessage:
      "Unable to create the assessment question.",
  });
}

async function createAssessmentQuestions(
  payloads = [],
) {
  if (
    !Array.isArray(payloads) ||
    payloads.length === 0
  ) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      AssessmentTable.QUESTIONS,
    )
    .insert(payloads)
    .select();

  if (error) {
    throwRepositoryError({
      error,
      operation:
        "create assessment questions",
      table:
        AssessmentTable.QUESTIONS,
      fallbackMessage:
        "Unable to import assessment questions.",
    });
  }

  return data ?? [];
}


async function updateAssessmentQuestion(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.QUESTIONS,

    id,
    updates,

    operation:
      "update assessment question",

    fallbackMessage:
      "Unable to update the assessment question.",
  });
}

async function deleteAssessmentQuestion(
  id,
  deletedBy = null,
) {
  const recordId =
    requireIdentifier(
      id,
    );

  const deletedAt =
    new Date().toISOString();

  const {
    error,
  } = await supabase
    .from(
      AssessmentTable.QUESTIONS,
    )
    .update({
      status:
        "archived",

      archived_at:
        deletedAt,

      archived_by:
        deletedBy || null,

      deleted_at:
        deletedAt,

      deleted_by:
        deletedBy || null,
    })
    .eq(
      "id",
      recordId,
    )
    .is(
      "deleted_at",
      null,
    );

  if (error) {
    throwRepositoryError({
      error,

      operation:
        "delete assessment question",

      table:
        AssessmentTable.QUESTIONS,

      fallbackMessage:
        "Unable to delete the assessment question.",
    });
  }

  return {
    id:
      recordId,

    status:
      "archived",

    archived_at:
      deletedAt,

    archived_by:
      deletedBy || null,

    deleted_at:
      deletedAt,

    deleted_by:
      deletedBy || null,
  };
}

// ============================================================
// ASSESSMENT QUESTION OPTIONS
// ============================================================
async function getAssessmentQuestionOptions(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.QUESTION_OPTIONS,

    filters,

    searchColumns: [
      "option_key",
      "option_text",
      "matching_key",
      "response_value",
      "feedback",
    ],

    allowedSortColumns: [
      "display_order",
      "option_key",
      "is_correct",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      questionId: true,
      status: false,
      statuses: false,
    },

    configureQuery:
      (
        query,
        currentFilters,
      ) => {
        if (
          currentFilters.isCorrect !==
            undefined &&
          currentFilters.isCorrect !==
            null
        ) {
          query = query.eq(
            "is_correct",
            Boolean(
              currentFilters.isCorrect,
            ),
          );
        }

        if (
          currentFilters.hasMatchingKey ===
          true
        ) {
          query = query.not(
            "matching_key",
            "is",
            null,
          );
        }

        return query;
      },

    operation:
      "load assessment question options",

    fallbackMessage:
      "Unable to load assessment question options.",
  });
}

async function getAssessmentQuestionOption(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.QUESTION_OPTIONS,

    id,

    operation:
      "load assessment question option",

    fallbackMessage:
      "Unable to load the assessment question option.",
  });
}

async function createAssessmentQuestionOption(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.QUESTION_OPTIONS,

    payload,

    operation:
      "create assessment question option",

    fallbackMessage:
      "Unable to create the assessment question option.",
  });
}

async function updateAssessmentQuestionOption(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.QUESTION_OPTIONS,

    id,
    updates,

    operation:
      "update assessment question option",

    fallbackMessage:
      "Unable to update the assessment question option.",
  });
}

async function deleteAssessmentQuestionOption(
  id,
  deletedBy = null,
) {
  return softDeleteRecord({
    table:
      AssessmentTable.QUESTION_OPTIONS,

    id,
    deletedBy,

    operation:
      "delete assessment question option",

    fallbackMessage:
      "Unable to delete the assessment question option.",
  });
}

// ============================================================
// ASSESSMENT TEMPLATES
// ============================================================

async function getAssessmentTemplates(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.TEMPLATES,

    filters,

    searchColumns: [
      "template_number",
      "name",
      "code",
      "description",
      "instructions",
      "grade_level",
    ],

    allowedSortColumns: [
      "template_number",
      "name",
      "code",
      "assessment_type",
      "delivery_mode",
      "audience_type",
      "status",
      "version_number",
      "published_at",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      campusId: true,
      bankId: true,
      categoryId: true,
      subjectId: true,
      ownerId: true,
      assessmentType: true,
      deliveryMode: true,
      audienceType: true,
      status: true,
      statuses: true,
    },

    operation:
      "load assessment templates",

    fallbackMessage:
      "Unable to load assessment templates.",
  });
}

async function getAssessmentTemplate(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.TEMPLATES,

    id,

    operation:
      "load assessment template",

    fallbackMessage:
      "Unable to load the assessment template.",
  });
}

async function createAssessmentTemplate(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.TEMPLATES,

    payload,

    operation:
      "create assessment template",

    fallbackMessage:
      "Unable to create the assessment template.",
  });
}

async function updateAssessmentTemplate(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.TEMPLATES,

    id,
    updates,

    operation:
      "update assessment template",

    fallbackMessage:
      "Unable to update the assessment template.",
  });
}

async function deleteAssessmentTemplate(
  id,
  deletedBy = null,
) {
  return softDeleteRecord({
    table:
      AssessmentTable.TEMPLATES,

    id,
    deletedBy,

    operation:
      "delete assessment template",

    fallbackMessage:
      "Unable to delete the assessment template.",
  });
}

// ============================================================
// TEMPLATE SECTIONS
// ============================================================

async function getAssessmentTemplateSections(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.TEMPLATE_SECTIONS,

    filters,

    searchColumns: [
      "section_number",
      "title",
      "description",
      "instructions",
    ],

    allowedSortColumns: [
      "display_order",
      "section_number",
      "title",
      "section_type",
      "status",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      templateId: true,
      status: true,
      statuses: true,
    },

    configureQuery:
      (
        query,
        currentFilters,
      ) => {
        if (
          currentFilters.sectionType
        ) {
          query = query.eq(
            "section_type",
            currentFilters.sectionType,
          );
        }

        return query;
      },

    operation:
      "load assessment template sections",

    fallbackMessage:
      "Unable to load assessment template sections.",
  });
}

async function getAssessmentTemplateSection(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.TEMPLATE_SECTIONS,

    id,

    operation:
      "load assessment template section",

    fallbackMessage:
      "Unable to load the assessment template section.",
  });
}

async function createAssessmentTemplateSection(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.TEMPLATE_SECTIONS,

    payload,

    operation:
      "create assessment template section",

    fallbackMessage:
      "Unable to create the assessment template section.",
  });
}

async function updateAssessmentTemplateSection(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.TEMPLATE_SECTIONS,

    id,
    updates,

    operation:
      "update assessment template section",

    fallbackMessage:
      "Unable to update the assessment template section.",
  });
}

async function deleteAssessmentTemplateSection(
  id,
  deletedBy = null,
) {
  return softDeleteRecord({
    table:
      AssessmentTable.TEMPLATE_SECTIONS,

    id,
    deletedBy,

    operation:
      "delete assessment template section",

    fallbackMessage:
      "Unable to delete the assessment template section.",
  });
}

// ============================================================
// TEMPLATE QUESTIONS
// ============================================================

async function getAssessmentTemplateQuestions(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.TEMPLATE_QUESTIONS,

    select: `
      *,
      question:assessment_questions (
        id,
        question_number,
        title,
        question_type,
        prompt,
        difficulty,
        default_marks,
        negative_marks,
        status
      )
    `,

    filters,

    searchColumns: [],

    allowedSortColumns: [
      "display_order",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      templateId: true,
      sectionId: true,
      questionId: true,
      status: false,
      statuses: false,
    },

    configureQuery:
      (
        query,
        currentFilters,
      ) => {
        if (
          currentFilters.required !==
            undefined &&
          currentFilters.required !==
            null
        ) {
          query = query.eq(
            "required",
            Boolean(
              currentFilters.required,
            ),
          );
        }

        if (
          currentFilters.randomizationGroup
        ) {
          query = query.eq(
            "randomization_group",
            currentFilters.randomizationGroup,
          );
        }

        return query;
      },

    operation:
      "load assessment template questions",

    fallbackMessage:
      "Unable to load assessment template questions.",
  });
}

async function getAssessmentTemplateQuestion(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.TEMPLATE_QUESTIONS,

    id,

    select: `
      *,
      question:assessment_questions (
        id,
        question_number,
        title,
        question_type,
        prompt,
        difficulty,
        default_marks,
        negative_marks,
        status
      )
    `,

    operation:
      "load assessment template question",

    fallbackMessage:
      "Unable to load the assessment template question.",
  });
}

async function createAssessmentTemplateQuestion(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.TEMPLATE_QUESTIONS,

    payload,

    operation:
      "create assessment template question",

    fallbackMessage:
      "Unable to add the question to the assessment template.",
  });
}

async function updateAssessmentTemplateQuestion(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.TEMPLATE_QUESTIONS,

    id,
    updates,

    operation:
      "update assessment template question",

    fallbackMessage:
      "Unable to update the assessment template question.",
  });
}

async function deleteAssessmentTemplateQuestion(
  id,
  deletedBy = null,
) {
  return softDeleteRecord({
    table:
      AssessmentTable.TEMPLATE_QUESTIONS,

    id,
    deletedBy,

    operation:
      "delete assessment template question",

    fallbackMessage:
      "Unable to remove the question from the assessment template.",
  });
}

// ============================================================
// TEMPLATE LIFECYCLE RPCS
// ============================================================

async function publishAssessmentTemplate(
  id,
) {
  const templateId =
    requireIdentifier(
      id,
      "Assessment template id",
    );

  return callRecordRpc({
    functionName:
      "publish_assessment_template",

    args: {
      target_template_id:
        templateId,
    },

    operation:
      "publish assessment template",

    fallbackMessage:
      "Unable to publish the assessment template.",
  });
}

async function pauseAssessmentTemplate(
  id,
) {
  const templateId =
    requireIdentifier(
      id,
      "Assessment template id",
    );

  return callRecordRpc({
    functionName:
      "pause_assessment_template",

    args: {
      target_template_id:
        templateId,
    },

    operation:
      "pause assessment template",

    fallbackMessage:
      "Unable to pause the assessment template.",
  });
}

async function retireAssessmentTemplate(
  id,
) {
  const templateId =
    requireIdentifier(
      id,
      "Assessment template id",
    );

  return callRecordRpc({
    functionName:
      "retire_assessment_template",

    args: {
      target_template_id:
        templateId,
    },

    operation:
      "retire assessment template",

    fallbackMessage:
      "Unable to retire the assessment template.",
  });
}

// ============================================================
// REPOSITORY EXPORT
// ============================================================

export const assessmentRepository =
  Object.freeze({
    getAssessmentBanks,
    getAssessmentBank,
    createAssessmentBank,
    updateAssessmentBank,
    deleteAssessmentBank,

    getAssessmentCategories,
    getAssessmentCategory,
    createAssessmentCategory,
    updateAssessmentCategory,
    deleteAssessmentCategory,

    getAssessmentSubjects,
    getAssessmentSubject,
    createAssessmentSubject,
    updateAssessmentSubject,
    deleteAssessmentSubject,

    getAssessmentTopics,
    getAssessmentTopic,
    createAssessmentTopic,
    updateAssessmentTopic,
    deleteAssessmentTopic,

    getAssessmentQuestions,
    getAssessmentQuestion,
    createAssessmentQuestion,
    updateAssessmentQuestion,
    deleteAssessmentQuestion,

    getAssessmentQuestionOptions,
    getAssessmentQuestionOption,
    createAssessmentQuestionOption,
    updateAssessmentQuestionOption,
    deleteAssessmentQuestionOption,

    getAssessmentTemplates,
    getAssessmentTemplate,
    createAssessmentTemplate,
    updateAssessmentTemplate,
    deleteAssessmentTemplate,

    getAssessmentTemplateSections,
    getAssessmentTemplateSection,
    createAssessmentTemplateSection,
    updateAssessmentTemplateSection,
    deleteAssessmentTemplateSection,

    getAssessmentTemplateQuestions,
    getAssessmentTemplateQuestion,
    createAssessmentTemplateQuestion,
    updateAssessmentTemplateQuestion,
    deleteAssessmentTemplateQuestion,

    publishAssessmentTemplate,
    pauseAssessmentTemplate,
    retireAssessmentTemplate,
  });

export default assessmentRepository;







