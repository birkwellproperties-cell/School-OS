export const AssessmentBankStatus =
  Object.freeze({
    DRAFT: "draft",
    ACTIVE: "active",
    ARCHIVED: "archived",
  });

export const AssessmentTaxonomyStatus =
  Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
    ARCHIVED: "archived",
  });

export const AssessmentQuestionStatus =
  Object.freeze({
    DRAFT: "draft",
    REVIEW: "review",
    APPROVED: "approved",
    ACTIVE: "active",
    RETIRED: "retired",
    ARCHIVED: "archived",
  });

export const AssessmentTemplateStatus =
  Object.freeze({
    DRAFT: "draft",
    REVIEW: "review",
    APPROVED: "approved",
    PUBLISHED: "published",
    PAUSED: "paused",
    RETIRED: "retired",
    ARCHIVED: "archived",
  });

export const AssessmentQuestionType =
  Object.freeze({
    MULTIPLE_CHOICE:
      "multiple_choice",

    MULTIPLE_RESPONSE:
      "multiple_response",

    TRUE_FALSE:
      "true_false",

    FILL_BLANK:
      "fill_blank",

    SHORT_ANSWER:
      "short_answer",

    ESSAY:
      "essay",

    NUMERIC:
      "numeric",

    MATCHING:
      "matching",

    ORDERING:
      "ordering",

    FILE_UPLOAD:
      "file_upload",
  });