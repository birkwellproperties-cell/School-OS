import fs from "node:fs";

const repositoryPath =
  "./src/modules/assessment-center/api/assessmentRepository.js";

const source =
  fs.readFileSync(
    repositoryPath,
    "utf8",
  );

const lineEnding =
  source.includes("\r\n")
    ? "\r\n"
    : "\n";

const lifecycleMarker = [
  "// ============================================================",
  "// TEMPLATE LIFECYCLE RPCS",
  "// ============================================================",
].join(
  lineEnding,
);

if (
  source.includes(
    "async function getAssessmentAssignments",
  )
) {
  console.log(
    "Assessment runtime repository methods already exist. No changes made.",
  );

  process.exit(0);
}

if (
  !source.includes(
    lifecycleMarker,
  )
) {
  throw new Error(
    "Template lifecycle marker was not found.",
  );
}

const domains = [
  {
    heading:
      "ASSIGNMENTS",

    singular:
      "AssessmentAssignment",

    plural:
      "AssessmentAssignments",

    table:
      "ASSIGNMENTS",

    label:
      "assessment assignment",

    pluralLabel:
      "assessment assignments",

    searchColumns: [
      "assignment_number",
      "title",
      "description",
      "instructions",
      "source_type",
    ],

    allowedSortColumns: [
      "assignment_number",
      "title",
      "status",
      "opens_at",
      "due_at",
      "closes_at",
      "published_at",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      campusId: true,
      templateId: true,
      deliveryMode: true,
      status: true,
      statuses: true,
    },

    exactFilters: [
      [
        "source_type",
        "sourceType",
      ],
      [
        "source_id",
        "sourceId",
      ],
    ],
  },

  {
    heading:
      "ASSIGNMENT RECIPIENTS",

    singular:
      "AssessmentAssignmentRecipient",

    plural:
      "AssessmentAssignmentRecipients",

    table:
      "ASSIGNMENT_RECIPIENTS",

    label:
      "assessment assignment recipient",

    pluralLabel:
      "assessment assignment recipients",

    searchColumns: [
      "audience_type",
      "source_type",
      "cancellation_reason",
    ],

    allowedSortColumns: [
      "status",
      "assigned_at",
      "available_from",
      "due_at",
      "expires_at",
      "completed_at",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      campusId: true,
      audienceType: true,
      status: true,
      statuses: true,
    },

    exactFilters: [
      [
        "assignment_id",
        "assignmentId",
      ],
      [
        "audience_id",
        "audienceId",
      ],
      [
        "recipient_profile_id",
        "recipientProfileId",
      ],
      [
        "source_type",
        "sourceType",
      ],
      [
        "source_id",
        "sourceId",
      ],
    ],
  },

  {
    heading:
      "ATTEMPTS",

    singular:
      "AssessmentAttempt",

    plural:
      "AssessmentAttempts",

    table:
      "ATTEMPTS",

    label:
      "assessment attempt",

    pluralLabel:
      "assessment attempts",

    searchColumns: [],

    allowedSortColumns: [
      "attempt_number",
      "status",
      "grading_status",
      "started_at",
      "submitted_at",
      "completed_at",
      "percentage_score",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      campusId: true,
      templateId: true,
      status: true,
      statuses: true,
    },

    exactFilters: [
      [
        "assignment_id",
        "assignmentId",
      ],
      [
        "recipient_id",
        "recipientId",
      ],
      [
        "grading_status",
        "gradingStatus",
      ],
    ],
  },

  {
    heading:
      "ATTEMPT QUESTIONS",

    singular:
      "AssessmentAttemptQuestion",

    plural:
      "AssessmentAttemptQuestions",

    table:
      "ATTEMPT_QUESTIONS",

    label:
      "assessment attempt question",

    pluralLabel:
      "assessment attempt questions",

    searchColumns: [
      "question_number",
      "question_type",
    ],

    allowedSortColumns: [
      "display_order",
      "question_number",
      "question_type",
      "maximum_marks",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      templateId: true,
      sectionId: true,
      questionId: true,
      questionType: true,
    },

    exactFilters: [
      [
        "attempt_id",
        "attemptId",
      ],
      [
        "assignment_id",
        "assignmentId",
      ],
      [
        "template_question_id",
        "templateQuestionId",
      ],
    ],
  },

  {
    heading:
      "RESPONSES",

    singular:
      "AssessmentResponse",

    plural:
      "AssessmentResponses",

    table:
      "RESPONSES",

    label:
      "assessment response",

    pluralLabel:
      "assessment responses",

    searchColumns: [
      "response_text",
      "status",
      "grader_feedback",
    ],

    allowedSortColumns: [
      "status",
      "answered_at",
      "time_spent_seconds",
      "marks_awarded",
      "graded_at",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      campusId: true,
      questionId: true,
      status: true,
      statuses: true,
    },

    exactFilters: [
      [
        "assignment_id",
        "assignmentId",
      ],
      [
        "attempt_id",
        "attemptId",
      ],
      [
        "attempt_question_id",
        "attemptQuestionId",
      ],
    ],

    booleanFilters: [
      [
        "manual_review_required",
        "manualReviewRequired",
      ],
      [
        "flagged_for_review",
        "flaggedForReview",
      ],
    ],
  },

  {
    heading:
      "RESULTS",

    singular:
      "AssessmentResult",

    plural:
      "AssessmentResults",

    table:
      "RESULTS",

    label:
      "assessment result",

    pluralLabel:
      "assessment results",

    searchColumns: [
      "grade_label",
      "grade_value",
      "recommendation",
      "reviewer_notes",
    ],

    allowedSortColumns: [
      "status",
      "raw_score",
      "percentage_score",
      "calculated_at",
      "finalized_at",
      "released_at",
      "created_at",
      "updated_at",
    ],

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      campusId: true,
      templateId: true,
      status: true,
      statuses: true,
    },

    exactFilters: [
      [
        "assignment_id",
        "assignmentId",
      ],
      [
        "recipient_id",
        "recipientId",
      ],
      [
        "attempt_id",
        "attemptId",
      ],
    ],

    booleanFilters: [
      [
        "passed",
        "passed",
      ],
    ],
  },
];

function formatArray(
  values,
  indent,
) {
  if (!values.length) {
    return "[]";
  }

  const padding =
    " ".repeat(indent);

  const itemPadding =
    " ".repeat(
      indent + 2,
    );

  return `[
${values
  .map(
    (value) =>
      `${itemPadding}"${value}",`,
  )
  .join("\n")}
${padding}]`;
}

function formatObject(
  value,
  indent,
) {
  const padding =
    " ".repeat(indent);

  const itemPadding =
    " ".repeat(
      indent + 2,
    );

  return `{
${Object.entries(
  value,
)
  .map(
    ([
      key,
      enabled,
    ]) =>
      `${itemPadding}${key}: ${enabled},`,
  )
  .join("\n")}
${padding}}`;
}

function createConfigureQuery(
  domain,
) {
  const lines = [];

  for (
    const [
      column,
      filterName,
    ] of domain.exactFilters || []
  ) {
    lines.push(`
        nextQuery =
          applyExactFilter(
            nextQuery,
            "${column}",
            currentFilters.${filterName},
          );`);
  }

  for (
    const [
      column,
      filterName,
    ] of domain.booleanFilters || []
  ) {
    lines.push(`
        if (
          currentFilters.${filterName} !==
            undefined &&
          currentFilters.${filterName} !==
            null
        ) {
          nextQuery =
            nextQuery.eq(
              "${column}",
              Boolean(
                currentFilters.${filterName},
              ),
            );
        }`);
  }

  if (!lines.length) {
    return "";
  }

  return `
    configureQuery:
      (
        query,
        currentFilters,
      ) => {
        let nextQuery =
          query;
${lines.join("\n")}

        return nextQuery;
      },
`;
}

function createDomainMethods(
  domain,
) {
  const configureQuery =
    createConfigureQuery(
      domain,
    );

  return `// ============================================================
// ASSESSMENT RUNTIME - ${domain.heading}
// ============================================================

async function get${domain.plural}(
  filters = {},
) {
  return getPagedRecords({
    table:
      AssessmentTable.${domain.table},

    filters,

    searchColumns:
      ${formatArray(
        domain.searchColumns,
        6,
      )},

    allowedSortColumns:
      ${formatArray(
        domain.allowedSortColumns,
        6,
      )},

    supportedFilters:
      ${formatObject(
        domain.supportedFilters,
        6,
      )},
${configureQuery}
    operation:
      "load ${domain.pluralLabel}",

    fallbackMessage:
      "Unable to load ${domain.pluralLabel}.",
  });
}

async function get${domain.singular}(
  id,
) {
  return getSingleRecord({
    table:
      AssessmentTable.${domain.table},

    id,

    operation:
      "load ${domain.label}",

    fallbackMessage:
      "Unable to load the ${domain.label}.",
  });
}

async function create${domain.singular}(
  payload,
) {
  return createRecord({
    table:
      AssessmentTable.${domain.table},

    payload,

    operation:
      "create ${domain.label}",

    fallbackMessage:
      "Unable to create the ${domain.label}.",
  });
}

async function update${domain.singular}(
  id,
  updates,
) {
  return updateRecord({
    table:
      AssessmentTable.${domain.table},

    id,
    updates,

    operation:
      "update ${domain.label}",

    fallbackMessage:
      "Unable to update the ${domain.label}.",
  });
}

async function delete${domain.singular}(
  id,
  deletedBy = null,
) {
  return softDeleteRecord({
    table:
      AssessmentTable.${domain.table},

    id,
    deletedBy,

    operation:
      "delete ${domain.label}",

    fallbackMessage:
      "Unable to delete the ${domain.label}.",
  });
}

`;
}

const runtimeMethods =
  domains
    .map(
      createDomainMethods,
    )
    .join("");

const runtimeExportNames =
  domains.flatMap(
    (domain) => [
      `get${domain.plural}`,
      `get${domain.singular}`,
      `create${domain.singular}`,
      `update${domain.singular}`,
      `delete${domain.singular}`,
    ],
  );

const runtimeExports =
  runtimeExportNames
    .map(
      (name) =>
        `    ${name},`,
    )
    .join("\n");

let updatedSource =
  source.replace(
    lifecycleMarker,
    `${runtimeMethods}${lifecycleMarker}`,
  );

const exportMarker =
  "    publishAssessmentTemplate,";

if (
  !updatedSource.includes(
    exportMarker,
  )
) {
  throw new Error(
    "Repository export marker was not found.",
  );
}

updatedSource =
  updatedSource.replace(
    exportMarker,
    `${runtimeExports}\n\n${exportMarker}`,
  );

fs.writeFileSync(
  repositoryPath,
  updatedSource,
  "utf8",
);

console.log(
  "Assessment runtime repository methods and exports generated successfully.",
);

