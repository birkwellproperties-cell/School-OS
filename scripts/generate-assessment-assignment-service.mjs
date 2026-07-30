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

if (
  source.includes(
    "async getAssessmentAssignments(",
  )
) {
  console.log(
    "Assessment assignment service methods already exist. No changes made.",
  );

  process.exit(0);
}

function withLineEndings(
  value,
) {
  return value
    .trim()
    .replaceAll(
      "\n",
      lineEnding,
    );
}

const helperMarker =
  withLineEndings(`
function assertUpdates(
`);

const constantMarker =
  withLineEndings(`
function getFriendlyServiceError(
`);

const methodInsertionMarker =
  "  async publishAssessmentTemplate(";

if (
  !source.includes(helperMarker)
) {
  throw new Error(
    "Service helper insertion marker was not found.",
  );
}

if (
  !source.includes(constantMarker)
) {
  throw new Error(
    "Service constant insertion marker was not found.",
  );
}

if (
  !source.includes(
    methodInsertionMarker,
  )
) {
  throw new Error(
    "Assessment template publish method insertion marker was not found.",
  );
}

const helperBlock =
  withLineEndings(`
function normalizeTimestamp(
  value,
  {
    label = "Timestamp",
    nullable = true,
  } = {},
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    if (nullable) {
      return null;
    }

    throw new Error(
      \`\${label} is required.\`,
    );
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    throw new Error(
      \`\${label} must be a valid date and time.\`,
    );
  }

  return parsed.toISOString();
}

function assertTimestampOrder({
  opensAt = null,
  dueAt = null,
  closesAt = null,
}) {
  const opensTime =
    opensAt
      ? new Date(opensAt).getTime()
      : null;

  const dueTime =
    dueAt
      ? new Date(dueAt).getTime()
      : null;

  const closesTime =
    closesAt
      ? new Date(closesAt).getTime()
      : null;

  if (
    opensTime !== null &&
    dueTime !== null &&
    opensTime > dueTime
  ) {
    throw new Error(
      "Assessment assignment opening time must not be after its due time.",
    );
  }

  if (
    dueTime !== null &&
    closesTime !== null &&
    dueTime > closesTime
  ) {
    throw new Error(
      "Assessment assignment due time must not be after its closing time.",
    );
  }

  if (
    opensTime !== null &&
    closesTime !== null &&
    opensTime > closesTime
  ) {
    throw new Error(
      "Assessment assignment opening time must not be after its closing time.",
    );
  }
}

function assertSourcePair(
  sourceType,
  sourceId,
) {
  const hasSourceType =
    Boolean(sourceType);

  const hasSourceId =
    Boolean(sourceId);

  if (
    hasSourceType !==
    hasSourceId
  ) {
    throw new Error(
      "Assessment assignment source type and source id must be provided together.",
    );
  }
}

function generateAssignmentNumber() {
  return generateRecordNumber(
    "ASG",
  );
}

`);

const constantBlock =
  withLineEndings(`
const ASSIGNMENT_STATUSES =
  new Set([
    "draft",
    "scheduled",
    "open",
    "closed",
    "cancelled",
    "completed",
    "archived",
  ]);

const ASSIGNMENT_DELIVERY_MODES =
  new Set([
    "online",
    "paper",
    "hybrid",
    "oral",
    "practical",
  ]);

const ASSIGNMENT_PROCTORING_MODES =
  new Set([
    "none",
    "manual",
    "browser_events",
    "locked_browser",
    "remote_live",
    "onsite",
  ]);

`);

const methodBlock =
  withLineEndings(`
  // ============================================================
  // ASSESSMENT RUNTIME — ASSIGNMENTS
  // ============================================================

  async getAssessmentAssignments(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentAssignments(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment assignments.",
    );
  }

  async getAssessmentAssignment(
    id,
  ) {
    const assignmentId =
      requireIdentifier(
        id,
        "Assessment assignment id",
      );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentAssignment(
            assignmentId,
          ),

      "Unable to load the assessment assignment.",
    );
  }

  async createAssessmentAssignment(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

    const opensAt =
      normalizeTimestamp(
        payload.opens_at,
        {
          label:
            "Assessment assignment opening time",
        },
      );

    const dueAt =
      normalizeTimestamp(
        payload.due_at,
        {
          label:
            "Assessment assignment due time",
        },
      );

    const closesAt =
      normalizeTimestamp(
        payload.closes_at,
        {
          label:
            "Assessment assignment closing time",
        },
      );

    assertTimestampOrder({
      opensAt,
      dueAt,
      closesAt,
    });

    const sourceType =
      normalizeOptionalText(
        payload.source_type,
      );

    const sourceId =
      normalizeIdentifier(
        payload.source_id,
      );

    assertSourcePair(
      sourceType,
      sourceId,
    );

    const normalized = {
      organization_id:
        workspace.organizationId,

      school_id:
        workspace.schoolId,

      campus_id:
        normalizeIdentifier(
          payload.campus_id ??
            workspace.campusId,
        ),

      template_id:
        requireIdentifier(
          payload.template_id,
          "Assessment template id",
        ),

      assignment_number:
        normalizeOptionalText(
          payload.assignment_number,
        ) ||
        generateAssignmentNumber(),

      title:
        normalizeRequiredText(
          payload.title,
          "Assessment assignment title",
        ),

      description:
        normalizeOptionalText(
          payload.description,
        ),

      instructions:
        normalizeOptionalText(
          payload.instructions,
        ),

      status:
        assertAllowedValue(
          normalizeOptionalText(
            payload.status,
          ) ||
            "draft",

          ASSIGNMENT_STATUSES,
          "Assessment assignment status",
        ),

      opens_at:
        opensAt,

      due_at:
        dueAt,

      closes_at:
        closesAt,

      duration_minutes:
        normalizeInteger(
          payload.duration_minutes,
          {
            label:
              "Assessment assignment duration",
            minimum: 1,
            nullable: true,
          },
        ),

      maximum_attempts:
        normalizeInteger(
          payload.maximum_attempts ??
            1,
          {
            label:
              "Assessment assignment maximum attempts",
            minimum: 1,
          },
        ),

      passing_score:
        normalizeNumber(
          payload.passing_score,
          {
            label:
              "Assessment assignment passing score",
            minimum: 0,
            nullable: true,
          },
        ),

      passing_percentage:
        normalizeNumber(
          payload.passing_percentage,
          {
            label:
              "Assessment assignment passing percentage",
            minimum: 0,
            maximum: 100,
            nullable: true,
          },
        ),

      delivery_mode:
        assertAllowedValue(
          normalizeOptionalText(
            payload.delivery_mode,
          ) ||
            "online",

          ASSIGNMENT_DELIVERY_MODES,
          "Assessment assignment delivery mode",
        ),

      proctoring_mode:
        assertAllowedValue(
          normalizeOptionalText(
            payload.proctoring_mode,
          ) ||
            "none",

          ASSIGNMENT_PROCTORING_MODES,
          "Assessment assignment proctoring mode",
        ),

      source_type:
        sourceType,

      source_id:
        sourceId,

      configuration:
        normalizeJsonObject(
          payload.configuration,
        ),

      metadata:
        normalizeJsonObject(
          payload.metadata,
        ),

      published_at:
        normalizeTimestamp(
          payload.published_at,
          {
            label:
              "Assessment assignment publication time",
          },
        ),

      published_by:
        normalizeIdentifier(
          payload.published_by,
        ),

      cancelled_at:
        normalizeTimestamp(
          payload.cancelled_at,
          {
            label:
              "Assessment assignment cancellation time",
          },
        ),

      cancelled_by:
        normalizeIdentifier(
          payload.cancelled_by,
        ),

      created_by:
        normalizeIdentifier(
          payload.created_by,
        ),

      updated_by:
        normalizeIdentifier(
          payload.updated_by,
        ),
    };

    return executeServiceOperation(
      () =>
        this.repository
          .createAssessmentAssignment(
            normalized,
          ),

      "Unable to create the assessment assignment.",
    );
  }

  async updateAssessmentAssignment(
    id,
    updates = {},
  ) {
    const assignmentId =
      requireIdentifier(
        id,
        "Assessment assignment id",
      );

    const normalized = {};

    if (
      updates.campus_id !==
      undefined
    ) {
      normalized.campus_id =
        normalizeIdentifier(
          updates.campus_id,
        );
    }

    if (
      updates.template_id !==
      undefined
    ) {
      normalized.template_id =
        requireIdentifier(
          updates.template_id,
          "Assessment template id",
        );
    }

    if (
      updates.assignment_number !==
      undefined
    ) {
      normalized.assignment_number =
        normalizeRequiredText(
          updates.assignment_number,
          "Assessment assignment number",
        );
    }

    if (
      updates.title !==
      undefined
    ) {
      normalized.title =
        normalizeRequiredText(
          updates.title,
          "Assessment assignment title",
        );
    }

    for (
      const field of [
        "description",
        "instructions",
      ]
    ) {
      if (
        updates[field] !==
        undefined
      ) {
        normalized[field] =
          normalizeOptionalText(
            updates[field],
          );
      }
    }

    if (
      updates.status !==
      undefined
    ) {
      normalized.status =
        assertAllowedValue(
          normalizeRequiredText(
            updates.status,
            "Assessment assignment status",
          ),

          ASSIGNMENT_STATUSES,
          "Assessment assignment status",
        );
    }

    const timestampFields = {
      opens_at:
        "Assessment assignment opening time",

      due_at:
        "Assessment assignment due time",

      closes_at:
        "Assessment assignment closing time",

      published_at:
        "Assessment assignment publication time",

      cancelled_at:
        "Assessment assignment cancellation time",

      archived_at:
        "Assessment assignment archive time",
    };

    for (
      const [
        field,
        label,
      ] of Object.entries(
        timestampFields,
      )
    ) {
      if (
        updates[field] !==
        undefined
      ) {
        normalized[field] =
          normalizeTimestamp(
            updates[field],
            {
              label,
            },
          );
      }
    }

    if (
      updates.duration_minutes !==
      undefined
    ) {
      normalized.duration_minutes =
        normalizeInteger(
          updates.duration_minutes,
          {
            label:
              "Assessment assignment duration",
            minimum: 1,
            nullable: true,
          },
        );
    }

    if (
      updates.maximum_attempts !==
      undefined
    ) {
      normalized.maximum_attempts =
        normalizeInteger(
          updates.maximum_attempts,
          {
            label:
              "Assessment assignment maximum attempts",
            minimum: 1,
          },
        );
    }

    if (
      updates.passing_score !==
      undefined
    ) {
      normalized.passing_score =
        normalizeNumber(
          updates.passing_score,
          {
            label:
              "Assessment assignment passing score",
            minimum: 0,
            nullable: true,
          },
        );
    }

    if (
      updates.passing_percentage !==
      undefined
    ) {
      normalized.passing_percentage =
        normalizeNumber(
          updates.passing_percentage,
          {
            label:
              "Assessment assignment passing percentage",
            minimum: 0,
            maximum: 100,
            nullable: true,
          },
        );
    }

    if (
      updates.delivery_mode !==
      undefined
    ) {
      normalized.delivery_mode =
        assertAllowedValue(
          normalizeRequiredText(
            updates.delivery_mode,
            "Assessment assignment delivery mode",
          ),

          ASSIGNMENT_DELIVERY_MODES,
          "Assessment assignment delivery mode",
        );
    }

    if (
      updates.proctoring_mode !==
      undefined
    ) {
      normalized.proctoring_mode =
        assertAllowedValue(
          normalizeRequiredText(
            updates.proctoring_mode,
            "Assessment assignment proctoring mode",
          ),

          ASSIGNMENT_PROCTORING_MODES,
          "Assessment assignment proctoring mode",
        );
    }

    const sourceType =
      updates.source_type !==
      undefined
        ? normalizeOptionalText(
            updates.source_type,
          )
        : undefined;

    const sourceId =
      updates.source_id !==
      undefined
        ? normalizeIdentifier(
            updates.source_id,
          )
        : undefined;

    if (
      sourceType !== undefined
    ) {
      normalized.source_type =
        sourceType;
    }

    if (
      sourceId !== undefined
    ) {
      normalized.source_id =
        sourceId;
    }

    if (
      sourceType !== undefined &&
      sourceId !== undefined
    ) {
      assertSourcePair(
        sourceType,
        sourceId,
      );
    }

    for (
      const field of [
        "configuration",
        "metadata",
      ]
    ) {
      if (
        updates[field] !==
        undefined
      ) {
        normalized[field] =
          normalizeJsonObject(
            updates[field],
          );
      }
    }

    for (
      const field of [
        "published_by",
        "cancelled_by",
        "archived_by",
        "updated_by",
      ]
    ) {
      if (
        updates[field] !==
        undefined
      ) {
        normalized[field] =
          normalizeIdentifier(
            updates[field],
          );
      }
    }

    assertTimestampOrder({
      opensAt:
        normalized.opens_at ??
        null,

      dueAt:
        normalized.due_at ??
        null,

      closesAt:
        normalized.closes_at ??
        null,
    });

    assertUpdates(
      normalized,
      "assessment assignment",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentAssignment(
            assignmentId,
            normalized,
          ),

      "Unable to update the assessment assignment.",
    );
  }

  async deleteAssessmentAssignment(
    id,
    deletedBy = null,
  ) {
    const assignmentId =
      requireIdentifier(
        id,
        "Assessment assignment id",
      );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentAssignment(
            assignmentId,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to delete the assessment assignment.",
    );
  }

`);

source =
  source.replace(
    helperMarker,
    `${
      helperBlock
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
      methodInsertionMarker
    }`,
  );

fs.writeFileSync(
  servicePath,
  source,
  "utf8",
);

console.log(
  "Assessment assignment service helpers, constants, and CRUD methods generated successfully.",
);


