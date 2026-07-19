import {
  assessmentRepository,
} from "../api";

import {
  AssessmentQuestionStatus,
  AssessmentQuestionType,
  AssessmentTemplateStatus,
} from "../constants";

import {
  getAssessmentErrorMessage,
} from "../utils";

function normalizeOptionalText(
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

function normalizeRequiredText(
  value,
  label,
) {
  const normalized =
    normalizeOptionalText(
      value,
    );

  if (!normalized) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return normalized;
}

function normalizeIdentifier(
  value,
) {
  return normalizeOptionalText(
    value,
  );
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

function normalizeBoolean(
  value,
  fallback = false,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return Boolean(value);
}

function normalizeInteger(
  value,
  {
    label,
    minimum = null,
    maximum = null,
    nullable = false,
  },
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
      `${label} is required.`,
    );
  }

  const normalized =
    Number(value);

  if (
    !Number.isInteger(
      normalized,
    )
  ) {
    throw new Error(
      `${label} must be a whole number.`,
    );
  }

  if (
    minimum !== null &&
    normalized < minimum
  ) {
    throw new Error(
      `${label} must be at least ${minimum}.`,
    );
  }

  if (
    maximum !== null &&
    normalized > maximum
  ) {
    throw new Error(
      `${label} must not exceed ${maximum}.`,
    );
  }

  return normalized;
}

function normalizeNumber(
  value,
  {
    label,
    minimum = null,
    maximum = null,
    nullable = false,
  },
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
      `${label} is required.`,
    );
  }

  const normalized =
    Number(value);

  if (
    !Number.isFinite(
      normalized,
    )
  ) {
    throw new Error(
      `${label} must be a valid number.`,
    );
  }

  if (
    minimum !== null &&
    normalized < minimum
  ) {
    throw new Error(
      `${label} must be at least ${minimum}.`,
    );
  }

  if (
    maximum !== null &&
    normalized > maximum
  ) {
    throw new Error(
      `${label} must not exceed ${maximum}.`,
    );
  }

  return normalized;
}

function normalizeJsonObject(
  value,
) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
}

function normalizeCode(
  value,
  label = "Code",
) {
  const normalized =
    normalizeRequiredText(
      value,
      label,
    );

  if (
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(
      normalized,
    )
  ) {
    throw new Error(
      `${label} may contain only letters, numbers, underscores, and hyphens.`,
    );
  }

  return normalized;
}

function normalizeLanguageCode(
  value,
) {
  const normalized =
    normalizeOptionalText(
      value,
    ) || "en";

  if (
    !/^[A-Za-z]{2}(-[A-Za-z]{2})?$/.test(
      normalized,
    )
  ) {
    throw new Error(
      "Language code must use a two-letter language code, optionally followed by a two-letter region.",
    );
  }

  return normalized;
}

function normalizeWorkspaceScope(
  scope = {},
) {
  return {
    organizationId:
      normalizeIdentifier(
        scope.organizationId ||
          scope.organization_id,
      ),

    schoolId:
      normalizeIdentifier(
        scope.schoolId ||
          scope.school_id,
      ),

    campusId:
      normalizeIdentifier(
        scope.campusId ||
          scope.campus_id,
      ),
  };
}

function requireWorkspaceScope(
  scope,
) {
  const organizationId =
    requireIdentifier(
      scope.organizationId,
      "Organization id",
    );

  const schoolId =
    requireIdentifier(
      scope.schoolId,
      "School id",
    );

  return {
    organizationId,
    schoolId,

    campusId:
      scope.campusId ||
      null,
  };
}

function mergeScope(
  scope,
  filters = {},
) {
  return {
    ...filters,

    organizationId:
      filters.organizationId ||
      scope.organizationId,

    schoolId:
      filters.schoolId ||
      scope.schoolId,

    campusId:
      filters.campusId ??
      scope.campusId ??
      null,
  };
}

function generateRecordNumber(
  prefix,
) {
  const datePart =
    new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "");

  const randomPart =
    Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();

  return `${prefix}-${datePart}-${randomPart}`;
}

function generateQuestionNumber() {
  return generateRecordNumber(
    "Q",
  );
}

function generateTemplateNumber() {
  return generateRecordNumber(
    "ASM",
  );
}

function assertUpdates(
  updates,
  label,
) {
  if (
    !updates ||
    Object.keys(updates).length ===
      0
  ) {
    throw new Error(
      `At least one ${label} field must be provided.`,
    );
  }
}

function assertAllowedValue(
  value,
  allowedValues,
  label,
) {
  if (
    value !== null &&
    value !== undefined &&
    !allowedValues.has(value)
  ) {
    throw new Error(
      `${label} is not valid.`,
    );
  }

  return value;
}

const BANK_TYPES =
  new Set([
    "question_bank",
    "item_bank",
    "shared_library",
    "publisher_library",
    "practice_library",
  ]);

const BANK_VISIBILITIES =
  new Set([
    "private",
    "school",
    "organization",
    "public",
  ]);

const BANK_STATUSES =
  new Set([
    "draft",
    "active",
    "archived",
  ]);

const TAXONOMY_STATUSES =
  new Set([
    "active",
    "inactive",
    "archived",
  ]);

const QUESTION_TYPES =
  new Set(
    Object.values(
      AssessmentQuestionType,
    ),
  );

const QUESTION_STATUSES =
  new Set(
    Object.values(
      AssessmentQuestionStatus,
    ),
  );

const QUESTION_DIFFICULTIES =
  new Set([
    "very_easy",
    "easy",
    "medium",
    "hard",
    "very_hard",
  ]);

const PROMPT_FORMATS =
  new Set([
    "plain_text",
    "markdown",
    "html",
  ]);

const OPTION_FORMATS =
  new Set([
    "plain_text",
    "markdown",
    "html",
  ]);

const TEMPLATE_STATUSES =
  new Set(
    Object.values(
      AssessmentTemplateStatus,
    ),
  );

const ASSESSMENT_TYPES =
  new Set([
    "exam",
    "quiz",
    "practice",
    "placement",
    "entrance_exam",
    "diagnostic",
    "certification",
    "survey",
    "evaluation",
    "competition",
    "custom",
  ]);

const DELIVERY_MODES =
  new Set([
    "online",
    "in_person",
    "uploaded_document",
    "external",
  ]);

const AUDIENCE_TYPES =
  new Set([
    "admission_applicant",
    "student",
    "staff",
    "candidate",
    "guardian",
    "external_candidate",
    "mixed",
  ]);

const SECTION_TYPES =
  new Set([
    "standard",
    "instructions",
    "question_pool",
    "adaptive",
    "manual_review",
    "break",
  ]);

const SECTION_STATUSES =
  new Set([
    "active",
    "inactive",
    "archived",
  ]);

const CALCULATOR_POLICIES =
  new Set([
    "not_allowed",
    "basic",
    "scientific",
    "provided",
    "unrestricted",
  ]);

const RESOURCE_POLICIES =
  new Set([
    "closed_book",
    "open_book",
    "provided_resources",
    "unrestricted",
  ]);

const FULLSCREEN_POLICIES =
  new Set([
    "disabled",
    "optional",
    "required",
  ]);

const TAB_SWITCH_POLICIES =
  new Set([
    "ignore",
    "log_only",
    "warn",
    "limit",
    "terminate",
  ]);

const COPY_PASTE_POLICIES =
  new Set([
    "enabled",
    "disabled",
    "log_only",
  ]);

const PROCTORING_MODES =
  new Set([
    "none",
    "browser_events",
    "live",
    "recorded",
    "external",
  ]);

function getFriendlyServiceError(
  error,
  fallbackMessage,
) {
  const message =
    getAssessmentErrorMessage(
      error,
      fallbackMessage,
    );

  if (
    error?.code === "23505"
  ) {
    return new Error(
      "A record with the same code, number, or ordering already exists.",
    );
  }

  if (
    error?.code === "23503"
  ) {
    return new Error(
      "A related assessment record could not be found.",
    );
  }

  if (
    error?.code === "23514"
  ) {
    return new Error(
      message,
    );
  }

  if (
    error?.code === "42501"
  ) {
    return new Error(
      "You do not have permission to complete this assessment action.",
    );
  }

  return new Error(
    message,
  );
}

async function executeServiceOperation(
  operation,
  fallbackMessage,
) {
  try {
    return await operation();
  } catch (error) {
    throw getFriendlyServiceError(
      error,
      fallbackMessage,
    );
  }
}

export class AssessmentService {
  constructor({
    repository =
      assessmentRepository,

    scope = {},
  } = {}) {
    this.repository =
      repository;

    this.scope =
      normalizeWorkspaceScope(
        scope,
      );
  }

  withScope(scope) {
    return new AssessmentService({
      repository:
        this.repository,

      scope: {
        ...this.scope,
        ...scope,
      },
    });
  }

  getWorkspaceScope() {
    return {
      ...this.scope,
    };
  }

  requireWorkspace() {
    return requireWorkspaceScope(
      this.scope,
    );
  }
  async getAssessmentBanks(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentBanks(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment banks.",
    );
  }

  async getAssessmentBank(id) {
    requireIdentifier(
      id,
      "Assessment bank id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentBank(
            id,
          ),

      "Unable to load the assessment bank.",
    );
  }

  async createAssessmentBank(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

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

      name:
        normalizeRequiredText(
          payload.name,
          "Assessment bank name",
        ),

      code:
        normalizeCode(
          payload.code,
          "Assessment bank code",
        ),

      description:
        normalizeOptionalText(
          payload.description,
        ),

      bank_type:
        assertAllowedValue(
          normalizeOptionalText(
            payload.bank_type,
          ) ||
            "question_bank",

          BANK_TYPES,
          "Assessment bank type",
        ),

      visibility:
        assertAllowedValue(
          normalizeOptionalText(
            payload.visibility,
          ) ||
            "private",

          BANK_VISIBILITIES,
          "Assessment bank visibility",
        ),

      status:
        assertAllowedValue(
          normalizeOptionalText(
            payload.status,
          ) ||
            "draft",

          BANK_STATUSES,
          "Assessment bank status",
        ),

      owner_id:
        normalizeIdentifier(
          payload.owner_id,
        ),

      metadata:
        normalizeJsonObject(
          payload.metadata,
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
          .createAssessmentBank(
            normalized,
          ),

      "Unable to create the assessment bank.",
    );
  }

  async updateAssessmentBank(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Assessment bank id",
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
      updates.name !==
      undefined
    ) {
      normalized.name =
        normalizeRequiredText(
          updates.name,
          "Assessment bank name",
        );
    }

    if (
      updates.code !==
      undefined
    ) {
      normalized.code =
        normalizeCode(
          updates.code,
          "Assessment bank code",
        );
    }

    if (
      updates.description !==
      undefined
    ) {
      normalized.description =
        normalizeOptionalText(
          updates.description,
        );
    }

    if (
      updates.bank_type !==
      undefined
    ) {
      normalized.bank_type =
        assertAllowedValue(
          normalizeRequiredText(
            updates.bank_type,
            "Assessment bank type",
          ),

          BANK_TYPES,
          "Assessment bank type",
        );
    }

    if (
      updates.visibility !==
      undefined
    ) {
      normalized.visibility =
        assertAllowedValue(
          normalizeRequiredText(
            updates.visibility,
            "Assessment bank visibility",
          ),

          BANK_VISIBILITIES,
          "Assessment bank visibility",
        );
    }

    if (
      updates.status !==
      undefined
    ) {
      normalized.status =
        assertAllowedValue(
          normalizeRequiredText(
            updates.status,
            "Assessment bank status",
          ),

          BANK_STATUSES,
          "Assessment bank status",
        );
    }

    if (
      updates.owner_id !==
      undefined
    ) {
      normalized.owner_id =
        normalizeIdentifier(
          updates.owner_id,
        );
    }

    if (
      updates.metadata !==
      undefined
    ) {
      normalized.metadata =
        normalizeJsonObject(
          updates.metadata,
        );
    }

    if (
      updates.updated_by !==
      undefined
    ) {
      normalized.updated_by =
        normalizeIdentifier(
          updates.updated_by,
        );
    }

    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        updates.archived_at === null
          ? null
          : normalizeOptionalText(
              updates.archived_at,
            );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        updates.archived_by === null
          ? null
          : normalizeIdentifier(
              updates.archived_by,
            );
    }

    assertUpdates(
      normalized,
      "assessment bank",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentBank(
            id,
            normalized,
          ),

      "Unable to update the assessment bank.",
    );
  }

  async deleteAssessmentBank(
    id,
    deletedBy = null,
  ) {
    requireIdentifier(
      id,
      "Assessment bank id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentBank(
            id,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to delete the assessment bank.",
    );
  }

  async getAssessmentCategories(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentCategories(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment categories.",
    );
  }

  async getAssessmentCategory(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment category id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentCategory(
            id,
          ),

      "Unable to load the assessment category.",
    );
  }

  async createAssessmentCategory(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

    const normalized = {
      organization_id:
        workspace.organizationId,

      school_id:
        workspace.schoolId,

      parent_category_id:
        normalizeIdentifier(
          payload.parent_category_id,
        ),

      name:
        normalizeRequiredText(
          payload.name,
          "Assessment category name",
        ),

      code:
        normalizeCode(
          payload.code,
          "Assessment category code",
        ),

      description:
        normalizeOptionalText(
          payload.description,
        ),

      display_order:
        normalizeInteger(
          payload.display_order ??
            0,
          {
            label:
              "Assessment category display order",

            minimum: 0,
          },
        ),

      status:
        assertAllowedValue(
          normalizeOptionalText(
            payload.status,
          ) ||
            "active",

          TAXONOMY_STATUSES,
          "Assessment category status",
        ),

      metadata:
        normalizeJsonObject(
          payload.metadata,
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
          .createAssessmentCategory(
            normalized,
          ),

      "Unable to create the assessment category.",
    );
  }

  async updateAssessmentCategory(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Assessment category id",
    );

    const normalized = {};

    if (
      updates.parent_category_id !==
      undefined
    ) {
      normalized.parent_category_id =
        normalizeIdentifier(
          updates.parent_category_id,
        );
    }

    if (
      updates.name !==
      undefined
    ) {
      normalized.name =
        normalizeRequiredText(
          updates.name,
          "Assessment category name",
        );
    }

    if (
      updates.code !==
      undefined
    ) {
      normalized.code =
        normalizeCode(
          updates.code,
          "Assessment category code",
        );
    }

    if (
      updates.description !==
      undefined
    ) {
      normalized.description =
        normalizeOptionalText(
          updates.description,
        );
    }

    if (
      updates.display_order !==
      undefined
    ) {
      normalized.display_order =
        normalizeInteger(
          updates.display_order,
          {
            label:
              "Assessment category display order",

            minimum: 0,
          },
        );
    }

    if (
      updates.status !==
      undefined
    ) {
      normalized.status =
        assertAllowedValue(
          normalizeRequiredText(
            updates.status,
            "Assessment category status",
          ),

          TAXONOMY_STATUSES,
          "Assessment category status",
        );
    }

    if (
      updates.metadata !==
      undefined
    ) {
      normalized.metadata =
        normalizeJsonObject(
          updates.metadata,
        );
    }

    if (
      updates.updated_by !==
      undefined
    ) {
      normalized.updated_by =
        normalizeIdentifier(
          updates.updated_by,
        );
    }

    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        updates.archived_at === null
          ? null
          : normalizeOptionalText(
              updates.archived_at,
            );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        updates.archived_by === null
          ? null
          : normalizeIdentifier(
              updates.archived_by,
            );
    }

    assertUpdates(
      normalized,
      "assessment category",
    );


    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        normalizeOptionalText(
          updates.archived_at,
        );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        normalizeIdentifier(
          updates.archived_by,
        );
    }

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentCategory(
            id,
            normalized,
          ),

      "Unable to update the assessment category.",
    );
  }

  async deleteAssessmentCategory(
    id,
    deletedBy = null,
  ) {
    requireIdentifier(
      id,
      "Assessment category id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentCategory(
            id,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to delete the assessment category.",
    );
  }

  async getAssessmentSubjects(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentSubjects(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment subjects.",
    );
  }

  async getAssessmentSubject(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment subject id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentSubject(
            id,
          ),

      "Unable to load the assessment subject.",
    );
  }

  async createAssessmentSubject(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

    const normalized = {
      organization_id:
        workspace.organizationId,

      school_id:
        workspace.schoolId,

      category_id:
        normalizeIdentifier(
          payload.category_id,
        ),

      name:
        normalizeRequiredText(
          payload.name,
          "Assessment subject name",
        ),

      code:
        normalizeCode(
          payload.code,
          "Assessment subject code",
        ),

      description:
        normalizeOptionalText(
          payload.description,
        ),

      grade_level_from:
        normalizeOptionalText(
          payload.grade_level_from,
        ),

      grade_level_to:
        normalizeOptionalText(
          payload.grade_level_to,
        ),

      display_order:
        normalizeInteger(
          payload.display_order ??
            0,
          {
            label:
              "Assessment subject display order",

            minimum: 0,
          },
        ),

      status:
        assertAllowedValue(
          normalizeOptionalText(
            payload.status,
          ) ||
            "active",

          TAXONOMY_STATUSES,
          "Assessment subject status",
        ),

      metadata:
        normalizeJsonObject(
          payload.metadata,
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
          .createAssessmentSubject(
            normalized,
          ),

      "Unable to create the assessment subject.",
    );
  }

  async updateAssessmentSubject(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Assessment subject id",
    );

    const normalized = {};

    if (
      updates.category_id !==
      undefined
    ) {
      normalized.category_id =
        normalizeIdentifier(
          updates.category_id,
        );
    }

    if (
      updates.name !==
      undefined
    ) {
      normalized.name =
        normalizeRequiredText(
          updates.name,
          "Assessment subject name",
        );
    }

    if (
      updates.code !==
      undefined
    ) {
      normalized.code =
        normalizeCode(
          updates.code,
          "Assessment subject code",
        );
    }

    if (
      updates.description !==
      undefined
    ) {
      normalized.description =
        normalizeOptionalText(
          updates.description,
        );
    }

    if (
      updates.grade_level_from !==
      undefined
    ) {
      normalized.grade_level_from =
        normalizeOptionalText(
          updates.grade_level_from,
        );
    }

    if (
      updates.grade_level_to !==
      undefined
    ) {
      normalized.grade_level_to =
        normalizeOptionalText(
          updates.grade_level_to,
        );
    }

    if (
      updates.display_order !==
      undefined
    ) {
      normalized.display_order =
        normalizeInteger(
          updates.display_order,
          {
            label:
              "Assessment subject display order",

            minimum: 0,
          },
        );
    }

    if (
      updates.status !==
      undefined
    ) {
      normalized.status =
        assertAllowedValue(
          normalizeRequiredText(
            updates.status,
            "Assessment subject status",
          ),

          TAXONOMY_STATUSES,
          "Assessment subject status",
        );
    }

    if (
      updates.metadata !==
      undefined
    ) {
      normalized.metadata =
        normalizeJsonObject(
          updates.metadata,
        );
    }

    if (
      updates.updated_by !==
      undefined
    ) {
      normalized.updated_by =
        normalizeIdentifier(
          updates.updated_by,
        );
    }

    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        updates.archived_at === null
          ? null
          : normalizeOptionalText(
              updates.archived_at,
            );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        updates.archived_by === null
          ? null
          : normalizeIdentifier(
              updates.archived_by,
            );
    }

    assertUpdates(
      normalized,
      "assessment subject",
    );


    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        normalizeOptionalText(
          updates.archived_at,
        );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        normalizeIdentifier(
          updates.archived_by,
        );
    }

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentSubject(
            id,
            normalized,
          ),

      "Unable to update the assessment subject.",
    );
  }

  async deleteAssessmentSubject(
    id,
    deletedBy = null,
  ) {
    requireIdentifier(
      id,
      "Assessment subject id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentSubject(
            id,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to delete the assessment subject.",
    );
  }

  async getAssessmentTopics(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentTopics(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment topics.",
    );
  }

  async getAssessmentTopic(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment topic id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentTopic(
            id,
          ),

      "Unable to load the assessment topic.",
    );
  }

  async createAssessmentTopic(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

    const normalized = {
      organization_id:
        workspace.organizationId,

      school_id:
        workspace.schoolId,

      subject_id:
        requireIdentifier(
          payload.subject_id,
          "Assessment subject id",
        ),

      parent_topic_id:
        normalizeIdentifier(
          payload.parent_topic_id,
        ),

      name:
        normalizeRequiredText(
          payload.name,
          "Assessment topic name",
        ),

      code:
        normalizeCode(
          payload.code,
          "Assessment topic code",
        ),

      description:
        normalizeOptionalText(
          payload.description,
        ),

      learning_outcome:
        normalizeOptionalText(
          payload.learning_outcome,
        ),

      display_order:
        normalizeInteger(
          payload.display_order ??
            0,
          {
            label:
              "Assessment topic display order",

            minimum: 0,
          },
        ),

      status:
        assertAllowedValue(
          normalizeOptionalText(
            payload.status,
          ) ||
            "active",

          TAXONOMY_STATUSES,
          "Assessment topic status",
        ),

      metadata:
        normalizeJsonObject(
          payload.metadata,
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
          .createAssessmentTopic(
            normalized,
          ),

      "Unable to create the assessment topic.",
    );
  }

  async updateAssessmentTopic(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Assessment topic id",
    );

    const normalized = {};

    if (
      updates.subject_id !==
      undefined
    ) {
      normalized.subject_id =
        requireIdentifier(
          updates.subject_id,
          "Assessment subject id",
        );
    }

    if (
      updates.parent_topic_id !==
      undefined
    ) {
      normalized.parent_topic_id =
        normalizeIdentifier(
          updates.parent_topic_id,
        );
    }

    if (
      updates.name !==
      undefined
    ) {
      normalized.name =
        normalizeRequiredText(
          updates.name,
          "Assessment topic name",
        );
    }

    if (
      updates.code !==
      undefined
    ) {
      normalized.code =
        normalizeCode(
          updates.code,
          "Assessment topic code",
        );
    }

    if (
      updates.description !==
      undefined
    ) {
      normalized.description =
        normalizeOptionalText(
          updates.description,
        );
    }

    if (
      updates.learning_outcome !==
      undefined
    ) {
      normalized.learning_outcome =
        normalizeOptionalText(
          updates.learning_outcome,
        );
    }

    if (
      updates.display_order !==
      undefined
    ) {
      normalized.display_order =
        normalizeInteger(
          updates.display_order,
          {
            label:
              "Assessment topic display order",

            minimum: 0,
          },
        );
    }

    if (
      updates.status !==
      undefined
    ) {
      normalized.status =
        assertAllowedValue(
          normalizeRequiredText(
            updates.status,
            "Assessment topic status",
          ),

          TAXONOMY_STATUSES,
          "Assessment topic status",
        );
    }

    if (
      updates.metadata !==
      undefined
    ) {
      normalized.metadata =
        normalizeJsonObject(
          updates.metadata,
        );
    }

    if (
      updates.updated_by !==
      undefined
    ) {
      normalized.updated_by =
        normalizeIdentifier(
          updates.updated_by,
        );
    }

    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        updates.archived_at === null
          ? null
          : normalizeOptionalText(
              updates.archived_at,
            );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        updates.archived_by === null
          ? null
          : normalizeIdentifier(
              updates.archived_by,
            );
    }

    assertUpdates(
      normalized,
      "assessment topic",
    );


    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        normalizeOptionalText(
          updates.archived_at,
        );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        normalizeIdentifier(
          updates.archived_by,
        );
    }

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentTopic(
            id,
            normalized,
          ),

      "Unable to update the assessment topic.",
    );
  }

  async deleteAssessmentTopic(
    id,
    deletedBy = null,
  ) {
    requireIdentifier(
      id,
      "Assessment topic id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentTopic(
            id,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to delete the assessment topic.",
    );
  }
  async getAssessmentQuestions(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentQuestions(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment questions.",
    );
  }

  async getAssessmentQuestion(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment question id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentQuestion(
            id,
          ),

      "Unable to load the assessment question.",
    );
  }

  async createAssessmentQuestion(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

    const normalized = {
      organization_id:
        workspace.organizationId,

      school_id:
        workspace.schoolId,

      bank_id:
        requireIdentifier(
          payload.bank_id,
          "Assessment bank id",
        ),

      category_id:
        normalizeIdentifier(
          payload.category_id,
        ),

      subject_id:
        normalizeIdentifier(
          payload.subject_id,
        ),

      topic_id:
        normalizeIdentifier(
          payload.topic_id,
        ),

      owner_id:
        normalizeIdentifier(
          payload.owner_id,
        ),

      question_number:
        normalizeOptionalText(
          payload.question_number,
        ) ||
        generateQuestionNumber(),

      title:
        normalizeOptionalText(
          payload.title,
        ),

      question_type:
        assertAllowedValue(
          normalizeRequiredText(
            payload.question_type,
            "Assessment question type",
          ),

          QUESTION_TYPES,
          "Assessment question type",
        ),

      prompt:
        normalizeRequiredText(
          payload.prompt,
          "Assessment question prompt",
        ),

      prompt_format:
        assertAllowedValue(
          normalizeOptionalText(
            payload.prompt_format,
          ) ||
            "plain_text",

          PROMPT_FORMATS,
          "Assessment question prompt format",
        ),

      instructions:
        normalizeOptionalText(
          payload.instructions,
        ),

      learning_outcome:
        normalizeOptionalText(
          payload.learning_outcome,
        ),

      explanation:
        normalizeOptionalText(
          payload.explanation,
        ),

      difficulty:
        assertAllowedValue(
          normalizeOptionalText(
            payload.difficulty,
          ) ||
            "medium",

          QUESTION_DIFFICULTIES,
          "Assessment question difficulty",
        ),

      default_marks:
        normalizeNumber(
          payload.default_marks ??
            1,
          {
            label:
              "Assessment question default marks",

            minimum: 0,
          },
        ),

      negative_marks:
        normalizeNumber(
          payload.negative_marks ??
            0,
          {
            label:
              "Assessment question negative marks",

            minimum: 0,
          },
        ),

      allow_partial_credit:
        normalizeBoolean(
          payload.allow_partial_credit,
          false,
        ),

status:
        assertAllowedValue(
          normalizeOptionalText(
            payload.status,
          ) ||
            "draft",

          QUESTION_STATUSES,
          "Assessment question status",
        ),

      metadata:
        normalizeJsonObject(
          payload.metadata,
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
          .createAssessmentQuestion(
            normalized,
          ),

      "Unable to create the assessment question.",
    );
  }

  async importAssessmentQuestions(
    questions = [],
    defaults = {},
  ) {
    if (!Array.isArray(questions)) {
      throw new Error(
        "Assessment questions must be provided as an array.",
      );
    }

    if (questions.length === 0) {
      return {
        imported: [],
        importedCount: 0,
        skippedCount: 0,
        errors: [],
      };
    }

    const imported = [];
    const errors = [];

    for (let index = 0; index < questions.length; index += 1) {
      const question =
        questions[index] || {};

      const rowNumber =
        question.import_row_number ??
        index + 2;

      try {
        const created =
          await this.createAssessmentQuestion({
            ...defaults,
            ...question,

            bank_id:
              question.bank_id ||
              defaults.bank_id,

            category_id:
              question.category_id ||
              defaults.category_id ||
              null,

            subject_id:
              question.subject_id ||
              defaults.subject_id ||
              null,

            topic_id:
              question.topic_id ||
              defaults.topic_id ||
              null,
          });

        imported.push(created);
      } catch (error) {
        errors.push({
          rowNumber,

          questionNumber:
            question.question_number ||
            null,

          title:
            question.title ||
            null,

          message:
            error?.message ||
            "Unable to import the assessment question.",
        });
      }
    }

    return {
      imported,

      importedCount:
        imported.length,

      skippedCount:
        errors.length,

      errors,
    };
  }
  async updateAssessmentQuestion(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Assessment question id",
    );

    const normalized = {};

    if (
      updates.bank_id !==
      undefined
    ) {
      normalized.bank_id =
        requireIdentifier(
          updates.bank_id,
          "Assessment bank id",
        );
    }

    if (
      updates.category_id !==
      undefined
    ) {
      normalized.category_id =
        normalizeIdentifier(
          updates.category_id,
        );
    }

    if (
      updates.subject_id !==
      undefined
    ) {
      normalized.subject_id =
        normalizeIdentifier(
          updates.subject_id,
        );
    }

    if (
      updates.topic_id !==
      undefined
    ) {
      normalized.topic_id =
        normalizeIdentifier(
          updates.topic_id,
        );
    }

    if (
      updates.owner_id !==
      undefined
    ) {
      normalized.owner_id =
        normalizeIdentifier(
          updates.owner_id,
        );
    }

    if (
      updates.question_number !==
      undefined
    ) {
      normalized.question_number =
        normalizeRequiredText(
          updates.question_number,
          "Assessment question number",
        );
    }

    if (
      updates.title !==
      undefined
    ) {
      normalized.title =
        normalizeOptionalText(
          updates.title,
        );
    }

    if (
      updates.question_type !==
      undefined
    ) {
      normalized.question_type =
        assertAllowedValue(
          normalizeRequiredText(
            updates.question_type,
            "Assessment question type",
          ),

          QUESTION_TYPES,
          "Assessment question type",
        );
    }

    if (
      updates.prompt !==
      undefined
    ) {
      normalized.prompt =
        normalizeRequiredText(
          updates.prompt,
          "Assessment question prompt",
        );
    }

    if (
      updates.prompt_format !==
      undefined
    ) {
      normalized.prompt_format =
        assertAllowedValue(
          normalizeRequiredText(
            updates.prompt_format,
            "Assessment question prompt format",
          ),

          PROMPT_FORMATS,
          "Assessment question prompt format",
        );
    }

    if (
      updates.instructions !==
      undefined
    ) {
      normalized.instructions =
        normalizeOptionalText(
          updates.instructions,
        );
    }

    if (
      updates.learning_outcome !==
      undefined
    ) {
      normalized.learning_outcome =
        normalizeOptionalText(
          updates.learning_outcome,
        );
    }

    if (
      updates.explanation !==
      undefined
    ) {
      normalized.explanation =
        normalizeOptionalText(
          updates.explanation,
        );
    }

    if (
      updates.difficulty !==
      undefined
    ) {
      normalized.difficulty =
        assertAllowedValue(
          normalizeRequiredText(
            updates.difficulty,
            "Assessment question difficulty",
          ),

          QUESTION_DIFFICULTIES,
          "Assessment question difficulty",
        );
    }

    if (
      updates.default_marks !==
      undefined
    ) {
      normalized.default_marks =
        normalizeNumber(
          updates.default_marks,
          {
            label:
              "Assessment question default marks",

            minimum: 0,
          },
        );
    }

    if (
      updates.negative_marks !==
      undefined
    ) {
      normalized.negative_marks =
        normalizeNumber(
          updates.negative_marks,
          {
            label:
              "Assessment question negative marks",

            minimum: 0,
          },
        );
    }

    if (
      updates.allow_partial_credit !==
      undefined
    ) {
      normalized.allow_partial_credit =
        normalizeBoolean(
          updates.allow_partial_credit,
        );
    }

if (
      updates.status !==
      undefined
    ) {
      normalized.status =
        assertAllowedValue(
          normalizeRequiredText(
            updates.status,
            "Assessment question status",
          ),

          QUESTION_STATUSES,
          "Assessment question status",
        );
    }

    if (
      updates.metadata !==
      undefined
    ) {
      normalized.metadata =
        normalizeJsonObject(
          updates.metadata,
        );
    }

    if (
      updates.updated_by !==
      undefined
    ) {
      normalized.updated_by =
        normalizeIdentifier(
          updates.updated_by,
        );
    }

    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        updates.archived_at === null
          ? null
          : normalizeOptionalText(
              updates.archived_at,
            );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        updates.archived_by === null
          ? null
          : normalizeIdentifier(
              updates.archived_by,
            );
    }

    assertUpdates(
      normalized,
      "assessment question",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentQuestion(
            id,
            normalized,
          ),

      "Unable to update the assessment question.",
    );
  }

  async deleteAssessmentQuestion(
    id,
    deletedBy = null,
  ) {
    requireIdentifier(
      id,
      "Assessment question id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentQuestion(
            id,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to delete the assessment question.",
    );
  }

  async getAssessmentQuestionOptions(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentQuestionOptions(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment question options.",
    );
  }

  async getAssessmentQuestionOption(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment question option id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentQuestionOption(
            id,
          ),

      "Unable to load the assessment question option.",
    );
  }

  async createAssessmentQuestionOption(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

    const normalized = {
      organization_id:
        workspace.organizationId,

      school_id:
        workspace.schoolId,

      question_id:
        requireIdentifier(
          payload.question_id,
          "Assessment question id",
        ),

      option_key:
        normalizeRequiredText(
          payload.option_key,
          "Assessment question option key",
        ),

      option_text:
        normalizeRequiredText(
          payload.option_text,
          "Assessment question option text",
        ),

      option_format:
        assertAllowedValue(
          normalizeOptionalText(
            payload.option_format,
          ) ||
            "plain_text",

          OPTION_FORMATS,
          "Assessment question option format",
        ),

      display_order:
        normalizeInteger(
          payload.display_order ??
            0,
          {
            label:
              "Assessment question option display order",

            minimum: 0,
          },
        ),

      is_correct:
        normalizeBoolean(
          payload.is_correct,
          false,
        ),

      score_fraction:
        normalizeNumber(
          payload.score_fraction ??
            0,
          {
            label:
              "Assessment question option score fraction",

            minimum: 0,
            maximum: 1,
          },
        ),

      matching_key:
        normalizeOptionalText(
          payload.matching_key,
        ),

      response_value:
        normalizeOptionalText(
          payload.response_value,
        ),

      feedback:
        normalizeOptionalText(
          payload.feedback,
        ),

      metadata:
        normalizeJsonObject(
          payload.metadata,
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
          .createAssessmentQuestionOption(
            normalized,
          ),

      "Unable to create the assessment question option.",
    );
  }

  async updateAssessmentQuestionOption(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Assessment question option id",
    );

    const normalized = {};

    if (
      updates.question_id !==
      undefined
    ) {
      normalized.question_id =
        requireIdentifier(
          updates.question_id,
          "Assessment question id",
        );
    }

    if (
      updates.option_key !==
      undefined
    ) {
      normalized.option_key =
        normalizeRequiredText(
          updates.option_key,
          "Assessment question option key",
        );
    }

    if (
      updates.option_text !==
      undefined
    ) {
      normalized.option_text =
        normalizeRequiredText(
          updates.option_text,
          "Assessment question option text",
        );
    }

    if (
      updates.option_format !==
      undefined
    ) {
      normalized.option_format =
        assertAllowedValue(
          normalizeRequiredText(
            updates.option_format,
            "Assessment question option format",
          ),

          OPTION_FORMATS,
          "Assessment question option format",
        );
    }

    if (
      updates.display_order !==
      undefined
    ) {
      normalized.display_order =
        normalizeInteger(
          updates.display_order,
          {
            label:
              "Assessment question option display order",

            minimum: 0,
          },
        );
    }

    if (
      updates.is_correct !==
      undefined
    ) {
      normalized.is_correct =
        normalizeBoolean(
          updates.is_correct,
        );
    }

    if (
      updates.score_fraction !==
      undefined
    ) {
      normalized.score_fraction =
        normalizeNumber(
          updates.score_fraction,
          {
            label:
              "Assessment question option score fraction",

            minimum: 0,
            maximum: 1,
          },
        );
    }

    if (
      updates.matching_key !==
      undefined
    ) {
      normalized.matching_key =
        normalizeOptionalText(
          updates.matching_key,
        );
    }

    if (
      updates.response_value !==
      undefined
    ) {
      normalized.response_value =
        normalizeOptionalText(
          updates.response_value,
        );
    }

    if (
      updates.feedback !==
      undefined
    ) {
      normalized.feedback =
        normalizeOptionalText(
          updates.feedback,
        );
    }

    if (
      updates.metadata !==
      undefined
    ) {
      normalized.metadata =
        normalizeJsonObject(
          updates.metadata,
        );
    }

    if (
      updates.updated_by !==
      undefined
    ) {
      normalized.updated_by =
        normalizeIdentifier(
          updates.updated_by,
        );
    }

    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        updates.archived_at === null
          ? null
          : normalizeOptionalText(
              updates.archived_at,
            );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        updates.archived_by === null
          ? null
          : normalizeIdentifier(
              updates.archived_by,
            );
    }

    assertUpdates(
      normalized,
      "assessment question option",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentQuestionOption(
            id,
            normalized,
          ),

      "Unable to update the assessment question option.",
    );
  }

  async deleteAssessmentQuestionOption(
    id,
    deletedBy = null,
  ) {
    requireIdentifier(
      id,
      "Assessment question option id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentQuestionOption(
            id,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to delete the assessment question option.",
    );
  }

  async getAssessmentTemplates(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentTemplates(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment templates.",
    );
  }

  async getAssessmentTemplate(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment template id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentTemplate(
            id,
          ),

      "Unable to load the assessment template.",
    );
  }

  async createAssessmentTemplate(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

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

      bank_id:
        normalizeIdentifier(
          payload.bank_id,
        ),

      category_id:
        normalizeIdentifier(
          payload.category_id,
        ),

      subject_id:
        normalizeIdentifier(
          payload.subject_id,
        ),

      owner_id:
        normalizeIdentifier(
          payload.owner_id,
        ),

      template_number:
        normalizeOptionalText(
          payload.template_number,
        ) ||
        generateTemplateNumber(),

      name:
        normalizeRequiredText(
          payload.name,
          "Assessment template name",
        ),

      code:
        normalizeCode(
          payload.code,
          "Assessment template code",
        ),

      description:
        normalizeOptionalText(
          payload.description,
        ),

      instructions:
        normalizeOptionalText(
          payload.instructions,
        ),

      assessment_type:
        assertAllowedValue(
          normalizeOptionalText(
            payload.assessment_type,
          ) || "exam",
          ASSESSMENT_TYPES,
          "Assessment type",
        ),

      delivery_mode:
        assertAllowedValue(
          normalizeOptionalText(
            payload.delivery_mode,
          ) || "online",
          DELIVERY_MODES,
          "Assessment delivery mode",
        ),

      audience_type:
        assertAllowedValue(
          normalizeOptionalText(
            payload.audience_type,
          ) || "student",
          AUDIENCE_TYPES,
          "Assessment audience type",
        ),

      grade_level:
        normalizeOptionalText(
          payload.grade_level,
        ),

      duration_minutes:
        normalizeInteger(
          payload.duration_minutes,
          {
            label:
              "Assessment duration",
            minimum: 1,
            nullable: true,
          },
        ),

      total_marks:
        normalizeNumber(
          payload.total_marks,
          {
            label:
              "Assessment total marks",
            minimum: 0,
            nullable: true,
          },
        ),

      passing_marks:
        normalizeNumber(
          payload.passing_marks,
          {
            label:
              "Assessment passing marks",
            minimum: 0,
            nullable: true,
          },
        ),

      pass_percentage:
        normalizeNumber(
          payload.pass_percentage,
          {
            label:
              "Assessment pass percentage",
            minimum: 0,
            maximum: 100,
            nullable: true,
          },
        ),

      max_attempts:
        normalizeInteger(
          payload.max_attempts ?? 1,
          {
            label:
              "Assessment maximum attempts",
            minimum: 1,
          },
        ),

      shuffle_questions:
        normalizeBoolean(
          payload.shuffle_questions,
          false,
        ),

      randomize_sections:
        normalizeBoolean(
          payload.randomize_sections,
          false,
        ),

      show_results:
        normalizeBoolean(
          payload.show_results,
          true,
        ),

      show_correct_answers:
        normalizeBoolean(
          payload.show_correct_answers,
          false,
        ),

      calculator_policy:
        assertAllowedValue(
          normalizeOptionalText(
            payload.calculator_policy,
          ) || "not_allowed",
          CALCULATOR_POLICIES,
          "Calculator policy",
        ),

      resource_policy:
        assertAllowedValue(
          normalizeOptionalText(
            payload.resource_policy,
          ) || "closed_book",
          RESOURCE_POLICIES,
          "Resource policy",
        ),

      fullscreen_policy:
        assertAllowedValue(
          normalizeOptionalText(
            payload.fullscreen_policy,
          ) || "disabled",
          FULLSCREEN_POLICIES,
          "Fullscreen policy",
        ),

      tab_switch_policy:
        assertAllowedValue(
          normalizeOptionalText(
            payload.tab_switch_policy,
          ) || "ignore",
          TAB_SWITCH_POLICIES,
          "Tab switch policy",
        ),

      tab_switch_limit:
        normalizeInteger(
          payload.tab_switch_limit,
          {
            label:
              "Tab switch limit",
            minimum: 0,
            nullable: true,
          },
        ),

      copy_paste_policy:
        assertAllowedValue(
          normalizeOptionalText(
            payload.copy_paste_policy,
          ) || "enabled",
          COPY_PASTE_POLICIES,
          "Copy and paste policy",
        ),

      proctoring_mode:
        assertAllowedValue(
          normalizeOptionalText(
            payload.proctoring_mode,
          ) || "none",
          PROCTORING_MODES,
          "Proctoring mode",
        ),

      status:
        assertAllowedValue(
          normalizeOptionalText(
            payload.status,
          ) || "draft",
          TEMPLATE_STATUSES,
          "Assessment template status",
        ),

      version_number:
        normalizeInteger(
          payload.version_number ?? 1,
          {
            label:
              "Assessment template version",
            minimum: 1,
          },
        ),

      metadata:
        normalizeJsonObject(
          payload.metadata,
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
          .createAssessmentTemplate(
            normalized,
          ),

      "Unable to create the assessment template.",
    );
  }

  async updateAssessmentTemplate(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Assessment template id",
    );

    const normalized = {};

    const identifierFields = [
      "campus_id",
      "bank_id",
      "category_id",
      "subject_id",
      "owner_id",
    ];

    for (const field of identifierFields) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeIdentifier(
            updates[field],
          );
      }
    }

    if (updates.template_number !== undefined) {
      normalized.template_number =
        normalizeRequiredText(
          updates.template_number,
          "Assessment template number",
        );
    }

    if (updates.name !== undefined) {
      normalized.name =
        normalizeRequiredText(
          updates.name,
          "Assessment template name",
        );
    }

    if (updates.code !== undefined) {
      normalized.code =
        normalizeCode(
          updates.code,
          "Assessment template code",
        );
    }

    const optionalTextFields = [
      "description",
      "instructions",
      "grade_level",
    ];

    for (const field of optionalTextFields) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeOptionalText(
            updates[field],
          );
      }
    }

    if (updates.assessment_type !== undefined) {
      normalized.assessment_type =
        assertAllowedValue(
          normalizeRequiredText(
            updates.assessment_type,
            "Assessment type",
          ),
          ASSESSMENT_TYPES,
          "Assessment type",
        );
    }

    if (updates.delivery_mode !== undefined) {
      normalized.delivery_mode =
        assertAllowedValue(
          normalizeRequiredText(
            updates.delivery_mode,
            "Assessment delivery mode",
          ),
          DELIVERY_MODES,
          "Assessment delivery mode",
        );
    }

    if (updates.audience_type !== undefined) {
      normalized.audience_type =
        assertAllowedValue(
          normalizeRequiredText(
            updates.audience_type,
            "Assessment audience type",
          ),
          AUDIENCE_TYPES,
          "Assessment audience type",
        );
    }

    const nullableIntegerFields = {
      duration_minutes:
        "Assessment duration",
      tab_switch_limit:
        "Tab switch limit",
    };

    for (const [field, label] of Object.entries(nullableIntegerFields)) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeInteger(
            updates[field],
            {
              label,
              minimum: 0,
              nullable: true,
            },
          );
      }
    }

    if (updates.max_attempts !== undefined) {
      normalized.max_attempts =
        normalizeInteger(
          updates.max_attempts,
          {
            label:
              "Assessment maximum attempts",
            minimum: 1,
          },
        );
    }

    if (updates.version_number !== undefined) {
      normalized.version_number =
        normalizeInteger(
          updates.version_number,
          {
            label:
              "Assessment template version",
            minimum: 1,
          },
        );
    }

    const nullableNumberFields = {
      total_marks:
        "Assessment total marks",
      passing_marks:
        "Assessment passing marks",
      pass_percentage:
        "Assessment pass percentage",
    };

    for (const [field, label] of Object.entries(nullableNumberFields)) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeNumber(
            updates[field],
            {
              label,
              minimum: 0,
              maximum:
                field === "pass_percentage"
                  ? 100
                  : null,
              nullable: true,
            },
          );
      }
    }

    const booleanFields = [
      "randomize_questions",
      "randomize_sections",
      "show_results",
      "show_correct_answers",
    ];

    for (const field of booleanFields) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeBoolean(
            updates[field],
          );
      }
    }

    const policyFields = [
      ["calculator_policy", CALCULATOR_POLICIES, "Calculator policy"],
      ["resource_policy", RESOURCE_POLICIES, "Resource policy"],
      ["fullscreen_policy", FULLSCREEN_POLICIES, "Fullscreen policy"],
      ["tab_switch_policy", TAB_SWITCH_POLICIES, "Tab switch policy"],
      ["copy_paste_policy", COPY_PASTE_POLICIES, "Copy and paste policy"],
      ["proctoring_mode", PROCTORING_MODES, "Proctoring mode"],
      ["status", TEMPLATE_STATUSES, "Assessment template status"],
    ];

    for (const [field, values, label] of policyFields) {
      if (updates[field] !== undefined) {
        normalized[field] =
          assertAllowedValue(
            normalizeRequiredText(
              updates[field],
              label,
            ),
            values,
            label,
          );
      }
    }

    if (updates.metadata !== undefined) {
      normalized.metadata =
        normalizeJsonObject(
          updates.metadata,
        );
    }

    if (updates.updated_by !== undefined) {
      normalized.updated_by =
        normalizeIdentifier(
          updates.updated_by,
        );
    }

    assertUpdates(
      normalized,
      "assessment template",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentTemplate(
            id,
            normalized,
          ),

      "Unable to update the assessment template.",
    );
  }

  async deleteAssessmentTemplate(
    id,
    deletedBy = null,
  ) {
    requireIdentifier(
      id,
      "Assessment template id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentTemplate(
            id,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to delete the assessment template.",
    );
  }

  async getAssessmentTemplateSections(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentTemplateSections(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment template sections.",
    );
  }

  async getAssessmentTemplateSection(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment template section id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentTemplateSection(
            id,
          ),

      "Unable to load the assessment template section.",
    );
  }

  async createAssessmentTemplateSection(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

    const normalized = {
      organization_id:
        workspace.organizationId,
      school_id:
        workspace.schoolId,
      template_id:
        requireIdentifier(
          payload.template_id,
          "Assessment template id",
        ),
      section_number:
        normalizeRequiredText(
          payload.section_number,
          "Assessment section number",
        ),
      title:
        normalizeRequiredText(
          payload.title,
          "Assessment section title",
        ),
      description:
        normalizeOptionalText(
          payload.description,
        ),
      instructions:
        normalizeOptionalText(
          payload.instructions,
        ),
      section_type:
        assertAllowedValue(
          normalizeOptionalText(
            payload.section_type,
          ) || "standard",
          SECTION_TYPES,
          "Assessment section type",
        ),
      display_order:
        normalizeInteger(
          payload.display_order ?? 0,
          {
            label:
              "Assessment section display order",
            minimum: 0,
          },
        ),
      duration_minutes:
        normalizeInteger(
          payload.duration_minutes,
          {
            label:
              "Assessment section duration",
            minimum: 1,
            nullable: true,
          },
        ),
      maximum_score:
        normalizeNumber(
          payload.maximum_score,
          {
            label:
              "Assessment section maximum score",
            minimum: 0,
            nullable: true,
          },
        ),

      passing_score:
        normalizeNumber(
          payload.passing_score,
            {
              label:
                "Assessment section passing score",
              minimum: 0,
              nullable: true,
            },
        ),

      passing_percentage:
        normalizeNumber(
          payload.passing_percentage,
            {
              label:
                "Assessment section passing percentage",
              minimum: 0,
              maximum: 100,
              nullable: true,
            },
        ),

      questions_to_display:
        normalizeInteger(
          payload.questions_to_display,
            {
              label:
                "Assessment section questions to display",
              minimum: 0,
              nullable: true,
            },
        ),
        
      shuffle_questions:
        normalizeBoolean(
          payload.shuffle_questions,
          false,
        ),
      status:
        assertAllowedValue(
          normalizeOptionalText(
            payload.status,
          ) || "active",
          SECTION_STATUSES,
          "Assessment section status",
        ),
      metadata:
        normalizeJsonObject(
          payload.metadata,
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
          .createAssessmentTemplateSection(
            normalized,
          ),

      "Unable to create the assessment template section.",
    );
  }

  async updateAssessmentTemplateSection(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Assessment template section id",
    );

    const normalized = {};

    if (updates.template_id !== undefined) {
      normalized.template_id =
        requireIdentifier(
          updates.template_id,
          "Assessment template id",
        );
    }

    for (const field of ["section_number", "title"]) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeRequiredText(
            updates[field],
            field === "title"
              ? "Assessment section title"
              : "Assessment section number",
          );
      }
    }

    for (const field of ["description", "instructions"]) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeOptionalText(
            updates[field],
          );
      }
    }

    if (updates.section_type !== undefined) {
      normalized.section_type =
        assertAllowedValue(
          normalizeRequiredText(
            updates.section_type,
            "Assessment section type",
          ),
          SECTION_TYPES,
          "Assessment section type",
        );
    }

    if (updates.display_order !== undefined) {
      normalized.display_order =
        normalizeInteger(
          updates.display_order,
          {
            label:
              "Assessment section display order",
            minimum: 0,
          },
        );
    }

    const nullableIntegerFields = {
      duration_minutes:
        "Assessment section duration",

      question_count:
        "Assessment section question count",
        
      questions_to_display:
        "Assessment section questions to display",
    };

    for (const [field, label] of Object.entries(nullableIntegerFields)) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeInteger(
            updates[field],
            {
              label,
              minimum: 0,
              nullable: true,
            },
          );
      }
    }

    for (const [field, label] of Object.entries({
      maximum_score:
        "Assessment section maximum score",

      passing_score:
        "Assessment section passing score",

      passing_percentage:
        "Assessment section passing percentage",
      })) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeNumber(
            updates[field],
              {
                label,
                minimum: 0,
                maximum:
                  field === "passing_percentage"
                    ? 100
                    : null,
                nullable: true,
              },
          );
      }
    }

    if (updates.shuffle_questions !== undefined) {
      normalized.shuffle_questions =
        normalizeBoolean(
          updates.shuffle_questions,
        );
    }

    if (updates.status !== undefined) {
      normalized.status =
        assertAllowedValue(
          normalizeRequiredText(
            updates.status,
            "Assessment section status",
          ),
          SECTION_STATUSES,
          "Assessment section status",
        );
    }

    if (updates.metadata !== undefined) {
      normalized.metadata =
        normalizeJsonObject(
          updates.metadata,
        );
    }

    if (updates.updated_by !== undefined) {
      normalized.updated_by =
        normalizeIdentifier(
          updates.updated_by,
        );
    }

    assertUpdates(
      normalized,
      "assessment template section",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentTemplateSection(
            id,
            normalized,
          ),

      "Unable to update the assessment template section.",
    );
  }

  async deleteAssessmentTemplateSection(
    id,
    deletedBy = null,
  ) {
    requireIdentifier(
      id,
      "Assessment template section id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentTemplateSection(
            id,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to delete the assessment template section.",
    );
  }

  async getAssessmentTemplateQuestions(
    filters = {},
  ) {
    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentTemplateQuestions(
            mergeScope(
              this.scope,
              filters,
            ),
          ),

      "Unable to load assessment template questions.",
    );
  }

  async getAssessmentTemplateQuestion(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment template question id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .getAssessmentTemplateQuestion(
            id,
          ),

      "Unable to load the assessment template question.",
    );
  }

  async createAssessmentTemplateQuestion(
    payload = {},
  ) {
    const workspace =
      this.requireWorkspace();

    const normalized = {
      organization_id:
        workspace.organizationId,
      school_id:
        workspace.schoolId,
      template_id:
        requireIdentifier(
          payload.template_id,
          "Assessment template id",
        ),
      section_id:
        requireIdentifier(
          payload.section_id,
          "Assessment template section id",
        ),
      question_id:
        requireIdentifier(
          payload.question_id,
          "Assessment question id",
        ),
      display_order:
        normalizeInteger(
          payload.display_order ?? 0,
          {
            label:
              "Assessment template question display order",
            minimum: 0,
          },
        ),
      required:
        normalizeBoolean(
          payload.required,
          true,
        ),
      marks_override:
        normalizeNumber(
          payload.marks_override,
          {
            label:
              "Assessment question marks override",
            minimum: 0,
            nullable: true,
          },
        ),
      negative_marks_override:
        normalizeNumber(
          payload.negative_marks_override,
          {
            label:
              "Assessment question negative marks override",
            minimum: 0,
            nullable: true,
          },
        ),
      randomization_group:
        normalizeOptionalText(
          payload.randomization_group,
        ),
      metadata:
        normalizeJsonObject(
          payload.metadata,
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
          .createAssessmentTemplateQuestion(
            normalized,
          ),

      "Unable to add the question to the assessment template.",
    );
  }

  async updateAssessmentTemplateQuestion(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Assessment template question id",
    );

    const normalized = {};

    for (const [field, label] of [
      ["template_id", "Assessment template id"],
      ["section_id", "Assessment template section id"],
      ["question_id", "Assessment question id"],
    ]) {
      if (updates[field] !== undefined) {
        normalized[field] =
          requireIdentifier(
            updates[field],
            label,
          );
      }
    }

    if (updates.display_order !== undefined) {
      normalized.display_order =
        normalizeInteger(
          updates.display_order,
          {
            label:
              "Assessment template question display order",
            minimum: 0,
          },
        );
    }

    if (updates.required !== undefined) {
      normalized.required =
        normalizeBoolean(
          updates.required,
        );
    }

    for (const [field, label] of [
      ["marks_override", "Assessment question marks override"],
      ["negative_marks_override", "Assessment question negative marks override"],
    ]) {
      if (updates[field] !== undefined) {
        normalized[field] =
          normalizeNumber(
            updates[field],
            {
              label,
              minimum: 0,
              nullable: true,
            },
          );
      }
    }

    if (updates.randomization_group !== undefined) {
      normalized.randomization_group =
        normalizeOptionalText(
          updates.randomization_group,
        );
    }

    if (updates.metadata !== undefined) {
      normalized.metadata =
        normalizeJsonObject(
          updates.metadata,
        );
    }

    if (updates.updated_by !== undefined) {
      normalized.updated_by =
        normalizeIdentifier(
          updates.updated_by,
        );
    }

    assertUpdates(
      normalized,
      "assessment template question",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .updateAssessmentTemplateQuestion(
            id,
            normalized,
          ),

      "Unable to update the assessment template question.",
    );
  }

  async deleteAssessmentTemplateQuestion(
    id,
    deletedBy = null,
  ) {
    requireIdentifier(
      id,
      "Assessment template question id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .deleteAssessmentTemplateQuestion(
            id,
            normalizeIdentifier(
              deletedBy,
            ),
          ),

      "Unable to remove the question from the assessment template.",
    );
  }

  async publishAssessmentTemplate(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment template id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .publishAssessmentTemplate(
            id,
          ),

      "Unable to publish the assessment template.",
    );
  }

  async pauseAssessmentTemplate(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment template id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .pauseAssessmentTemplate(
            id,
          ),

      "Unable to pause the assessment template.",
    );
  }

  async retireAssessmentTemplate(
    id,
  ) {
    requireIdentifier(
      id,
      "Assessment template id",
    );

    return executeServiceOperation(
      () =>
        this.repository
          .retireAssessmentTemplate(
            id,
          ),

      "Unable to retire the assessment template.",
    );
  }

}

/*
 * Parts 1-4 complete:
 * Banks, taxonomy, questions, options, templates, sections, composition, and lifecycle operations.
 */

export function createAssessmentService(
  options = {},
) {
  return new AssessmentService(
    options,
  );
  
}

export default AssessmentService;



