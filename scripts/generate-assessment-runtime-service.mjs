import fs from "node:fs";

const servicePath =
  "./src/modules/assessment-center/services/AssessmentService.js";

let source =
  fs.readFileSync(
    servicePath,
    "utf8",
  );

const lineEnding =
  source.includes("\r\n")
    ? "\r\n"
    : "\n";

function normalizeLineEndings(
  value,
) {
  return value
    .trim()
    .replaceAll(
      "\n",
      lineEnding,
    );
}

if (
  source.includes(
    "async getAssessmentAssignmentRecipients(",
  )
) {
  console.log(
    "Remaining assessment runtime service methods already exist. No changes made.",
  );

  process.exit(0);
}

const helperMarker =
  normalizeLineEndings(`
function assertUpdates(
`);

const constantMarker =
  normalizeLineEndings(`
function getFriendlyServiceError(
`);

const methodInsertionMarker =
  normalizeLineEndings(`
  async publishAssessmentTemplate(
`);

for (
  const [
    marker,
    label,
  ] of [
    [
      helperMarker,
      "helper",
    ],
    [
      constantMarker,
      "constant",
    ],
    [
      methodInsertionMarker,
      "method insertion",
    ],
  ]
) {
  if (
    !source.includes(
      marker,
    )
  ) {
    throw new Error(
      `AssessmentService ${label} marker was not found.`,
    );
  }
}

if (
  !source.includes(
    "async getAssessmentAssignments(",
  )
) {
  throw new Error(
    "Assignment service methods must exist before generating the remaining runtime services.",
  );
}

const helperBlock =
  normalizeLineEndings(`
function normalizeJsonArray(
  value,
  {
    label = "Value",
    nullable = false,
  } = {},
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    if (
      nullable
    ) {
      return null;
    }

    return [];
  }

  if (
    !Array.isArray(
      value,
    )
  ) {
    throw new Error(
      \`\${label} must be an array.\`,
    );
  }

  return value;
}

function normalizeIdentifierArray(
  value,
  {
    label = "Identifiers",
  } = {},
) {
  return normalizeJsonArray(
    value,
    {
      label,
    },
  ).map(
    (
      item,
    ) =>
      requireIdentifier(
        item,
        label,
      ),
  );
}

function normalizeRuntimeField(
  value,
  definition,
) {
  const {
    type,
    label,
    nullable = false,
    minimum = null,
    maximum = null,
    allowedValues = null,
  } = definition;

  switch (
    type
  ) {
    case "requiredText":
      return normalizeRequiredText(
        value,
        label,
      );

    case "optionalText":
      return normalizeOptionalText(
        value,
      );

    case "requiredId":
      return requireIdentifier(
        value,
        label,
      );

    case "optionalId":
      return normalizeIdentifier(
        value,
      );

    case "integer":
      return normalizeInteger(
        value,
        {
          label,
          minimum,
          maximum,
          nullable,
        },
      );

    case "number":
      return normalizeNumber(
        value,
        {
          label,
          minimum,
          maximum,
          nullable,
        },
      );

    case "boolean":
      return normalizeBoolean(
        value,
        false,
      );

    case "timestamp":
      return normalizeTimestamp(
        value,
        {
          label,
          nullable,
        },
      );

    case "jsonObject":
      return normalizeJsonObject(
        value,
      );

    case "jsonArray":
      return normalizeJsonArray(
        value,
        {
          label,
          nullable,
        },
      );

    case "identifierArray":
      return normalizeIdentifierArray(
        value,
        {
          label,
        },
      );

    case "enum":
      return assertAllowedValue(
        normalizeRequiredText(
          value,
          label,
        ),
        allowedValues,
        label,
      );

    default:
      throw new Error(
        \`Unsupported runtime field type: \${type}\`,
      );
  }
}

function normalizeRuntimeRecord(
  payload,
  schema,
  {
    workspace = null,
    create = false,
  } = {},
) {
  const normalized = {};

  if (
    create
  ) {
    if (
      !workspace
    ) {
      throw new Error(
        "Assessment runtime workspace is required.",
      );
    }

    normalized.organization_id =
      workspace.organizationId;

    normalized.school_id =
      workspace.schoolId;

    normalized.campus_id =
      normalizeIdentifier(
        payload.campus_id ??
          workspace.campusId,
      );
  } else if (
    payload.campus_id !==
    undefined
  ) {
    normalized.campus_id =
      normalizeIdentifier(
        payload.campus_id,
      );
  }

  for (
    const [
      field,
      definition,
    ] of Object.entries(
      schema,
    )
  ) {
    const hasValue =
      payload[field] !==
      undefined;

    if (
      !hasValue &&
      !create
    ) {
      continue;
    }

    if (
      !hasValue &&
      definition.defaultValue ===
        undefined &&
      !definition.required
    ) {
      continue;
    }

    const value =
      hasValue
        ? payload[field]
        : typeof definition.defaultValue ===
            "function"
          ? definition.defaultValue()
          : definition.defaultValue;

    normalized[field] =
      normalizeRuntimeField(
        value,
        definition,
      );
  }

  return normalized;
}

function assertRuntimeSourcePair(
  payload,
) {
  if (
    payload.source_type ===
      undefined &&
    payload.source_id ===
      undefined
  ) {
    return;
  }

  const sourceType =
    normalizeOptionalText(
      payload.source_type,
    );

  const sourceId =
    normalizeIdentifier(
      payload.source_id,
    );

  if (
    Boolean(
      sourceType,
    ) !==
    Boolean(
      sourceId,
    )
  ) {
    throw new Error(
      "Runtime source type and source id must be provided together.",
    );
  }
}

function assertRecipientTimestampOrder(
  payload,
) {
  const availableFrom =
    payload.available_from
      ? new Date(
          payload.available_from,
        ).getTime()
      : null;

  const dueAt =
    payload.due_at
      ? new Date(
          payload.due_at,
        ).getTime()
      : null;

  const expiresAt =
    payload.expires_at
      ? new Date(
          payload.expires_at,
        ).getTime()
      : null;

  if (
    availableFrom !==
      null &&
    dueAt !==
      null &&
    availableFrom >
      dueAt
  ) {
    throw new Error(
      "Recipient availability must not begin after the due time.",
    );
  }

  if (
    dueAt !==
      null &&
    expiresAt !==
      null &&
    dueAt >
      expiresAt
  ) {
    throw new Error(
      "Recipient due time must not be after the expiration time.",
    );
  }

  if (
    availableFrom !==
      null &&
    expiresAt !==
      null &&
    availableFrom >
      expiresAt
  ) {
    throw new Error(
      "Recipient availability must not begin after the expiration time.",
    );
  }
}
`);


const constantBlock =
  normalizeLineEndings(`
const ASSIGNMENT_RECIPIENT_AUDIENCE_TYPES =
  new Set([
    "admission_applicant",
    "student",
    "staff",
    "candidate",
    "guardian",
    "external_candidate",
  ]);

const ASSIGNMENT_RECIPIENT_STATUSES =
  new Set([
    "assigned",
    "not_started",
    "in_progress",
    "submitted",
    "completed",
    "expired",
    "cancelled",
  ]);

const ATTEMPT_STATUSES =
  new Set([
    "not_started",
    "in_progress",
    "paused",
    "submitted",
    "grading",
    "completed",
    "expired",
    "abandoned",
    "invalidated",
  ]);

const ATTEMPT_GRADING_STATUSES =
  new Set([
    "not_started",
    "auto_grading",
    "manual_grading",
    "pending_review",
    "completed",
  ]);

const RESPONSE_STATUSES =
  new Set([
    "unanswered",
    "answered",
    "skipped",
    "flagged",
    "submitted",
    "graded",
  ]);

const RESULT_STATUSES =
  new Set([
    "provisional",
    "pending_review",
    "final",
    "released",
    "withheld",
    "void",
  ]);

const ASSIGNMENT_RECIPIENT_SCHEMA = {
  assignment_id: {
    type: "requiredId",
    label: "Assessment assignment id",
    required: true,
  },
  audience_type: {
    type: "enum",
    label: "Assessment recipient audience type",
    allowedValues:
      ASSIGNMENT_RECIPIENT_AUDIENCE_TYPES,
    required: true,
  },
  audience_id: {
    type: "requiredId",
    label: "Assessment recipient audience id",
    required: true,
  },
  recipient_profile_id: {
    type: "optionalId",
    label: "Assessment recipient profile id",
  },
  source_type: {
    type: "optionalText",
    label: "Assessment recipient source type",
  },
  source_id: {
    type: "optionalId",
    label: "Assessment recipient source id",
  },
  status: {
    type: "enum",
    label: "Assessment recipient status",
    allowedValues:
      ASSIGNMENT_RECIPIENT_STATUSES,
    defaultValue: "assigned",
  },
  assigned_at: {
    type: "timestamp",
    label: "Assessment recipient assignment time",
    nullable: false,
    defaultValue: () =>
      new Date().toISOString(),
  },
  assigned_by: {
    type: "optionalId",
    label: "Assessment recipient assigner id",
  },
  available_from: {
    type: "timestamp",
    label: "Assessment recipient availability time",
    nullable: true,
  },
  due_at: {
    type: "timestamp",
    label: "Assessment recipient due time",
    nullable: true,
  },
  expires_at: {
    type: "timestamp",
    label: "Assessment recipient expiration time",
    nullable: true,
  },
  maximum_attempts_override: {
    type: "integer",
    label: "Assessment recipient maximum attempts",
    minimum: 1,
    nullable: true,
  },
  duration_minutes_override: {
    type: "integer",
    label: "Assessment recipient duration",
    minimum: 1,
    nullable: true,
  },
  accommodations: {
    type: "jsonObject",
    label: "Assessment recipient accommodations",
    defaultValue: {},
  },
  metadata: {
    type: "jsonObject",
    label: "Assessment recipient metadata",
    defaultValue: {},
  },
  completed_at: {
    type: "timestamp",
    label: "Assessment recipient completion time",
    nullable: true,
  },
  cancelled_at: {
    type: "timestamp",
    label: "Assessment recipient cancellation time",
    nullable: true,
  },
  cancelled_by: {
    type: "optionalId",
    label: "Assessment recipient cancellation actor",
  },
  cancellation_reason: {
    type: "optionalText",
    label: "Assessment recipient cancellation reason",
  },
  created_by: {
    type: "optionalId",
    label: "Assessment recipient creator",
  },
  updated_by: {
    type: "optionalId",
    label: "Assessment recipient updater",
  },
  archived_at: {
    type: "timestamp",
    label: "Assessment recipient archive time",
    nullable: true,
  },
  archived_by: {
    type: "optionalId",
    label: "Assessment recipient archive actor",
  },
};

const ATTEMPT_SCHEMA = {
  assignment_id: {
    type: "requiredId",
    label: "Assessment assignment id",
    required: true,
  },
  recipient_id: {
    type: "requiredId",
    label: "Assessment recipient id",
    required: true,
  },
  template_id: {
    type: "requiredId",
    label: "Assessment template id",
    required: true,
  },
  attempt_number: {
    type: "integer",
    label: "Assessment attempt number",
    minimum: 1,
    required: true,
  },
  status: {
    type: "enum",
    label: "Assessment attempt status",
    allowedValues:
      ATTEMPT_STATUSES,
    defaultValue: "not_started",
  },
  started_at: {
    type: "timestamp",
    label: "Assessment attempt start time",
    nullable: true,
  },
  last_activity_at: {
    type: "timestamp",
    label: "Assessment attempt last activity time",
    nullable: true,
  },
  submitted_at: {
    type: "timestamp",
    label: "Assessment attempt submission time",
    nullable: true,
  },
  completed_at: {
    type: "timestamp",
    label: "Assessment attempt completion time",
    nullable: true,
  },
  expires_at: {
    type: "timestamp",
    label: "Assessment attempt expiration time",
    nullable: true,
  },
  duration_minutes: {
    type: "integer",
    label: "Assessment attempt duration",
    minimum: 1,
    nullable: true,
  },
  elapsed_seconds: {
    type: "integer",
    label: "Assessment attempt elapsed seconds",
    minimum: 0,
    defaultValue: 0,
  },
  maximum_score: {
    type: "number",
    label: "Assessment attempt maximum score",
    minimum: 0,
    nullable: true,
  },
  raw_score: {
    type: "number",
    label: "Assessment attempt raw score",
    minimum: 0,
    nullable: true,
  },
  percentage_score: {
    type: "number",
    label: "Assessment attempt percentage score",
    minimum: 0,
    maximum: 100,
    nullable: true,
  },
  passed: {
    type: "boolean",
    label: "Assessment attempt passed flag",
  },
  grading_status: {
    type: "enum",
    label: "Assessment attempt grading status",
    allowedValues:
      ATTEMPT_GRADING_STATUSES,
    defaultValue: "not_started",
  },
  auto_graded_score: {
    type: "number",
    label: "Assessment auto-graded score",
    minimum: 0,
    nullable: true,
  },
  manually_graded_score: {
    type: "number",
    label: "Assessment manually graded score",
    minimum: 0,
    nullable: true,
  },
  graded_at: {
    type: "timestamp",
    label: "Assessment attempt grading time",
    nullable: true,
  },
  graded_by: {
    type: "optionalId",
    label: "Assessment attempt grader",
  },
  reviewed_at: {
    type: "timestamp",
    label: "Assessment attempt review time",
    nullable: true,
  },
  reviewed_by: {
    type: "optionalId",
    label: "Assessment attempt reviewer",
  },
  attempt_snapshot: {
    type: "jsonObject",
    label: "Assessment attempt snapshot",
    defaultValue: {},
  },
  delivery_context: {
    type: "jsonObject",
    label: "Assessment delivery context",
    defaultValue: {},
  },
  proctoring_events: {
    type: "jsonArray",
    label: "Assessment proctoring events",
    defaultValue: [],
  },
  metadata: {
    type: "jsonObject",
    label: "Assessment attempt metadata",
    defaultValue: {},
  },
  invalidated_at: {
    type: "timestamp",
    label: "Assessment attempt invalidation time",
    nullable: true,
  },
  invalidated_by: {
    type: "optionalId",
    label: "Assessment attempt invalidation actor",
  },
  invalidation_reason: {
    type: "optionalText",
    label: "Assessment attempt invalidation reason",
  },
  created_by: {
    type: "optionalId",
    label: "Assessment attempt creator",
  },
  updated_by: {
    type: "optionalId",
    label: "Assessment attempt updater",
  },
  archived_at: {
    type: "timestamp",
    label: "Assessment attempt archive time",
    nullable: true,
  },
  archived_by: {
    type: "optionalId",
    label: "Assessment attempt archive actor",
  },
};

const ATTEMPT_QUESTION_SCHEMA = {
  assignment_id: {
    type: "requiredId",
    label: "Assessment assignment id",
    required: true,
  },
  attempt_id: {
    type: "requiredId",
    label: "Assessment attempt id",
    required: true,
  },
  template_id: {
    type: "requiredId",
    label: "Assessment template id",
    required: true,
  },
  section_id: {
    type: "optionalId",
    label: "Assessment section id",
  },
  template_question_id: {
    type: "optionalId",
    label: "Assessment template question id",
  },
  question_id: {
    type: "requiredId",
    label: "Assessment question id",
    required: true,
  },
  display_order: {
    type: "integer",
    label: "Assessment attempt question order",
    minimum: 0,
    defaultValue: 0,
  },
  question_number: {
    type: "optionalText",
    label: "Assessment attempt question number",
  },
  question_type: {
    type: "requiredText",
    label: "Assessment attempt question type",
    required: true,
  },
  prompt_snapshot: {
    type: "jsonObject",
    label: "Assessment question prompt snapshot",
    required: true,
  },
  option_snapshot: {
    type: "jsonArray",
    label: "Assessment question option snapshot",
    defaultValue: [],
  },
  scoring_snapshot: {
    type: "jsonObject",
    label: "Assessment question scoring snapshot",
    defaultValue: {},
  },
  configuration_snapshot: {
    type: "jsonObject",
    label: "Assessment question configuration snapshot",
    defaultValue: {},
  },
  maximum_marks: {
    type: "number",
    label: "Assessment question maximum marks",
    minimum: 0,
    defaultValue: 0,
  },
  negative_marks: {
    type: "number",
    label: "Assessment question negative marks",
    minimum: 0,
    defaultValue: 0,
  },
  required: {
    type: "boolean",
    label: "Assessment question required flag",
    defaultValue: true,
  },
  metadata: {
    type: "jsonObject",
    label: "Assessment attempt question metadata",
    defaultValue: {},
  },
  created_by: {
    type: "optionalId",
    label: "Assessment attempt question creator",
  },
  updated_by: {
    type: "optionalId",
    label: "Assessment attempt question updater",
  },
};

const RESPONSE_SCHEMA = {
  assignment_id: {
    type: "requiredId",
    label: "Assessment assignment id",
    required: true,
  },
  attempt_id: {
    type: "requiredId",
    label: "Assessment attempt id",
    required: true,
  },
  attempt_question_id: {
    type: "requiredId",
    label: "Assessment attempt question id",
    required: true,
  },
  question_id: {
    type: "requiredId",
    label: "Assessment question id",
    required: true,
  },
  response_value: {
    type: "jsonObject",
    label: "Assessment response value",
  },
  response_text: {
    type: "optionalText",
    label: "Assessment response text",
  },
  selected_option_ids: {
    type: "identifierArray",
    label: "Assessment selected option ids",
    defaultValue: [],
  },
  status: {
    type: "enum",
    label: "Assessment response status",
    allowedValues:
      RESPONSE_STATUSES,
    defaultValue: "unanswered",
  },
  answered_at: {
    type: "timestamp",
    label: "Assessment response answer time",
    nullable: true,
  },
  first_answered_at: {
    type: "timestamp",
    label: "Assessment response first answer time",
    nullable: true,
  },
  time_spent_seconds: {
    type: "integer",
    label: "Assessment response time spent",
    minimum: 0,
    defaultValue: 0,
  },
  change_count: {
    type: "integer",
    label: "Assessment response change count",
    minimum: 0,
    defaultValue: 0,
  },
  flagged_for_review: {
    type: "boolean",
    label: "Assessment response review flag",
    defaultValue: false,
  },
  auto_graded: {
    type: "boolean",
    label: "Assessment response auto-graded flag",
    defaultValue: false,
  },
  manual_review_required: {
    type: "boolean",
    label: "Assessment manual review flag",
    defaultValue: false,
  },
  is_correct: {
    type: "boolean",
    label: "Assessment response correctness",
  },
  marks_awarded: {
    type: "number",
    label: "Assessment response marks awarded",
    minimum: 0,
    nullable: true,
  },
  negative_marks_awarded: {
    type: "number",
    label: "Assessment response negative marks",
    minimum: 0,
    defaultValue: 0,
  },
  grader_feedback: {
    type: "optionalText",
    label: "Assessment response grader feedback",
  },
  graded_at: {
    type: "timestamp",
    label: "Assessment response grading time",
    nullable: true,
  },
  graded_by: {
    type: "optionalId",
    label: "Assessment response grader",
  },
  metadata: {
    type: "jsonObject",
    label: "Assessment response metadata",
    defaultValue: {},
  },
  created_by: {
    type: "optionalId",
    label: "Assessment response creator",
  },
  updated_by: {
    type: "optionalId",
    label: "Assessment response updater",
  },
};

const RESULT_SCHEMA = {
  assignment_id: {
    type: "requiredId",
    label: "Assessment assignment id",
    required: true,
  },
  recipient_id: {
    type: "requiredId",
    label: "Assessment recipient id",
    required: true,
  },
  attempt_id: {
    type: "requiredId",
    label: "Assessment attempt id",
    required: true,
  },
  template_id: {
    type: "requiredId",
    label: "Assessment template id",
    required: true,
  },
  status: {
    type: "enum",
    label: "Assessment result status",
    allowedValues:
      RESULT_STATUSES,
    defaultValue: "provisional",
  },
  maximum_score: {
    type: "number",
    label: "Assessment result maximum score",
    minimum: 0,
    defaultValue: 0,
  },
  raw_score: {
    type: "number",
    label: "Assessment result raw score",
    minimum: 0,
    defaultValue: 0,
  },
  percentage_score: {
    type: "number",
    label: "Assessment result percentage",
    minimum: 0,
    maximum: 100,
    nullable: true,
  },
  passed: {
    type: "boolean",
    label: "Assessment result passed flag",
  },
  grade_label: {
    type: "optionalText",
    label: "Assessment result grade label",
  },
  grade_value: {
    type: "optionalText",
    label: "Assessment result grade value",
  },
  section_results: {
    type: "jsonArray",
    label: "Assessment section results",
    defaultValue: [],
  },
  competency_results: {
    type: "jsonArray",
    label: "Assessment competency results",
    defaultValue: [],
  },
  recommendation: {
    type: "optionalText",
    label: "Assessment result recommendation",
  },
  reviewer_notes: {
    type: "optionalText",
    label: "Assessment result reviewer notes",
  },
  calculated_at: {
    type: "timestamp",
    label: "Assessment result calculation time",
    nullable: false,
    defaultValue: () =>
      new Date().toISOString(),
  },
  finalized_at: {
    type: "timestamp",
    label: "Assessment result finalization time",
    nullable: true,
  },
  finalized_by: {
    type: "optionalId",
    label: "Assessment result finalizer",
  },
  released_at: {
    type: "timestamp",
    label: "Assessment result release time",
    nullable: true,
  },
  released_by: {
    type: "optionalId",
    label: "Assessment result release actor",
  },
  metadata: {
    type: "jsonObject",
    label: "Assessment result metadata",
    defaultValue: {},
  },
  created_by: {
    type: "optionalId",
    label: "Assessment result creator",
  },
  updated_by: {
    type: "optionalId",
    label: "Assessment result updater",
  },
  archived_at: {
    type: "timestamp",
    label: "Assessment result archive time",
    nullable: true,
  },
  archived_by: {
    type: "optionalId",
    label: "Assessment result archive actor",
  },
};
`);


function buildMethods(
  {
    heading,
    plural,
    singular,
    schema,
    beforeCreate = "",
    beforeUpdate = "",
  },
) {
  return normalizeLineEndings(`
  // ============================================================
  // ASSESSMENT RUNTIME — ${heading}
  // ============================================================

  async getAssessment${plural}(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessment${plural}(
            mergeScope(
              this.scope,
              filters,
            ),
          ),
      "Unable to load assessment ${heading.toLowerCase()}.",
    );
  }

  async getAssessment${singular}(
    id,
  ) {
    const recordId =
      requireIdentifier(
        id,
        "Assessment ${heading.toLowerCase()} id",
      );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessment${singular}(
            recordId,
          ),
      "Unable to load the assessment ${heading.toLowerCase()}.",
    );
  }

  async createAssessment${singular}(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

    ${beforeCreate}

    const normalized =
      normalizeRuntimeRecord(
        payload,
        ${schema},
        {
          workspace,
          create: true,
        },
      );

    return executeServiceOperation(
      () =>
        this.repository
          .createAssessment${singular}(
            normalized,
          ),
      "Unable to create the assessment ${heading.toLowerCase()}.",
    );
  }

  async updateAssessment${singular}(
    id,
    updates = {},
  ) {
    const recordId =
      requireIdentifier(
        id,
        "Assessment ${heading.toLowerCase()} id",
      );

    ${beforeUpdate}

    const normalized =
      normalizeRuntimeRecord(
        updates,
        ${schema},
      );

    assertUpdates(
      normalized,
      "assessment ${heading.toLowerCase()}",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessment${singular}(
            recordId,
            normalized,
          ),
      "Unable to update the assessment ${heading.toLowerCase()}.",
    );
  }

  async deleteAssessment${singular}(
    id,
    deletedBy = null,
  ) {
    const recordId =
      requireIdentifier(
        id,
        "Assessment ${heading.toLowerCase()} id",
      );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessment${singular}(
            recordId,
            normalizeIdentifier(
              deletedBy,
            ),
          ),
      "Unable to delete the assessment ${heading.toLowerCase()}.",
    );
  }
`);
}

const recipientCreateValidation =
  normalizeLineEndings(`
    assertRuntimeSourcePair(
      payload,
    );

    assertRecipientTimestampOrder(
      payload,
    );
`);

const recipientUpdateValidation =
  normalizeLineEndings(`
    assertRuntimeSourcePair(
      updates,
    );

    assertRecipientTimestampOrder(
      updates,
    );
`);

const methodBlock = [
  buildMethods(
    {
      heading:
        "ASSIGNMENT RECIPIENTS",
      plural:
        "AssignmentRecipients",
      singular:
        "AssignmentRecipient",
      schema:
        "ASSIGNMENT_RECIPIENT_SCHEMA",
      beforeCreate:
        recipientCreateValidation,
      beforeUpdate:
        recipientUpdateValidation,
    },
  ),
  buildMethods(
    {
      heading:
        "ATTEMPTS",
      plural:
        "Attempts",
      singular:
        "Attempt",
      schema:
        "ATTEMPT_SCHEMA",
    },
  ),
  buildMethods(
    {
      heading:
        "ATTEMPT QUESTIONS",
      plural:
        "AttemptQuestions",
      singular:
        "AttemptQuestion",
      schema:
        "ATTEMPT_QUESTION_SCHEMA",
    },
  ),
  buildMethods(
    {
      heading:
        "RESPONSES",
      plural:
        "Responses",
      singular:
        "Response",
      schema:
        "RESPONSE_SCHEMA",
    },
  ),
  buildMethods(
    {
      heading:
        "RESULTS",
      plural:
        "Results",
      singular:
        "Result",
      schema:
        "RESULT_SCHEMA",
    },
  ),
].join(
  `${lineEnding}${lineEnding}`,
);

source =
  source.replace(
    helperMarker,
    `${
      helperBlock
    }${
      lineEnding
    }${
      lineEnding
    }${
      helperMarker
    }`,
  );

source =
  source.replace(
    constantMarker,
    `${
      constantBlock
    }${
      lineEnding
    }${
      lineEnding
    }${
      constantMarker
    }`,
  );

source =
  source.replace(
    methodInsertionMarker,
    `${
      methodBlock
    }${
      lineEnding
    }${
      lineEnding
    }${
      methodInsertionMarker
    }`,
  );

fs.writeFileSync(
  servicePath,
  source,
  "utf8",
);

console.log(
  "Remaining assessment runtime service methods generated successfully.",
);
