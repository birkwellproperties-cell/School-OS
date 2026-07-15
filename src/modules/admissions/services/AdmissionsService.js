import {
  admissionsRepository,
} from "../api";

const ADMISSION_CYCLE_STATUSES =
  new Set([
    "draft",
    "open",
    "closed",
    "archived",
  ]);

const INQUIRY_STATUSES =
  new Set([
    "new",
    "contacted",
    "qualified",
    "unqualified",
    "converted",
    "closed",
  ]);

const INQUIRY_SOURCES =
  new Set([
    "manual",
    "website",
    "phone",
    "email",
    "walk_in",
    "referral",
    "event",
    "campaign",
    "partner",
    "other",
  ]);

const INQUIRY_CONTACT_METHODS =
  new Set([
    "email",
    "phone",
    "sms",
    "whatsapp",
  ]);

const APPLICANT_STATUSES =
  new Set([
    "prospect",
    "applicant",
    "offered",
    "accepted",
    "enrolled",
    "withdrawn",
    "archived",
  ]);

const APPLICATION_STATUSES = new Set([
  "draft",
  "submitted",
  "documents_pending",
  "under_review",
  "assessment_pending",
  "interview_pending",
  "decision_pending",
  "approved",
  "waitlisted",
  "rejected",
  "offer_sent",
  "offer_accepted",
  "offer_declined",
  "enrolled",
  "withdrawn",
  "cancelled",
]);

const APPLICANT_GENDERS =
  new Set([
    "female",
    "male",
    "non_binary",
    "prefer_not_to_say",
    "other",
  ]);
  
function requireIdentifier(
  value,
  label,
) {
  if (!value) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return value;
}

function normalizeWorkspaceScope({
  organizationId,
  schoolId,
  campusId,
  admissionCycleId,
} = {}) {
  requireIdentifier(
    organizationId,
    "Admissions organizationId",
  );

  requireIdentifier(
    schoolId,
    "Admissions schoolId",
  );

  return {
    organizationId,
    schoolId,

    campusId:
      campusId || undefined,

    admissionCycleId:
      admissionCycleId ||
      undefined,
  };
}

function mergeScope(
  scope,
  filters = {},
) {
  return {
    ...filters,

    organizationId:
      scope.organizationId,

    schoolId:
      scope.schoolId,

    campusId:
      filters.campusId ??
      scope.campusId,

    admissionCycleId:
      filters.admissionCycleId ??
      scope.admissionCycleId,
  };
}

function normalizeRequiredText(
  value,
  label,
) {
  const normalized =
    String(value ?? "").trim();

  if (!normalized) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return normalized;
}

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

function normalizeOptionalIdentifier(
  value,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return value;
}

function normalizeOptionalNonNegativeInteger(
  value,
  label,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const normalized =
    Number(value);

  if (
    !Number.isInteger(
      normalized,
    ) ||
    normalized < 0
  ) {
    throw new Error(
      `${label} must be a non-negative whole number.`,
    );
  }

  return normalized;
}

function normalizeOptionalDateTime(
  value,
  label,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${label} must be a valid date and time.`,
    );
  }

  return date.toISOString();
}

function normalizeOptionalDate(
  value,
  label,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${label} must be a valid date.`,
    );
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function normalizeAdmissionCycleStatus(
  value = "draft",
) {
  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    !ADMISSION_CYCLE_STATUSES
      .has(normalized)
  ) {
    throw new Error(
      "Admission cycle status must be draft, open, closed, or archived.",
    );
  }

  return normalized;
}

function validateAdmissionCycleDateOrder({
  opensAt,
  closesAt,
}) {
  if (
    !opensAt ||
    !closesAt
  ) {
    return;
  }

  if (
    new Date(
      closesAt,
    ).getTime() <
    new Date(
      opensAt,
    ).getTime()
  ) {
    throw new Error(
      "Admission cycle closing date cannot be earlier than its opening date.",
    );
  }
}

function normalizeAdmissionCyclePayload(
  payload = {},
  {
    partial = false,
    existingRecord = null,
  } = {},
) {
  const normalized = {};

  if (
    !partial ||
    payload.name !== undefined
  ) {
    normalized.name =
      normalizeRequiredText(
        payload.name,
        "Admission cycle name",
      );
  }

  if (
    !partial ||
    payload.code !== undefined
  ) {
    normalized.code =
      normalizeRequiredText(
        payload.code,
        "Admission cycle code",
      ).toUpperCase();
  }

  if (
    !partial ||
    payload.academic_year_label !==
      undefined
  ) {
    normalized.academic_year_label =
      normalizeRequiredText(
        payload
          .academic_year_label,
        "Academic year",
      );
  }

  if (
    !partial ||
    payload.status !== undefined
  ) {
    normalized.status =
      normalizeAdmissionCycleStatus(
        payload.status,
      );
  }

  if (
    !partial ||
    payload.opens_at !== undefined
  ) {
    normalized.opens_at =
      normalizeOptionalDateTime(
        payload.opens_at,
        "Opening date",
      );
  }

  if (
    !partial ||
    payload.closes_at !== undefined
  ) {
    normalized.closes_at =
      normalizeOptionalDateTime(
        payload.closes_at,
        "Closing date",
      );
  }

  if (
    !partial ||
    payload.application_target !==
      undefined
  ) {
    normalized.application_target =
      normalizeOptionalNonNegativeInteger(
        payload
          .application_target,
        "Application target",
      );
  }

  if (
    !partial ||
    payload.seat_capacity !==
      undefined
  ) {
    normalized.seat_capacity =
      normalizeOptionalNonNegativeInteger(
        payload.seat_capacity,
        "Seat capacity",
      );
  }

  if (
    !partial ||
    payload.notes !== undefined
  ) {
    normalized.notes =
      normalizeOptionalText(
        payload.notes,
      );
  }

  if (
    !partial ||
    payload.campus_id !== undefined
  ) {
    normalized.campus_id =
      normalizeOptionalIdentifier(
        payload.campus_id,
      );
  }

  const opensAt =
    normalized.opens_at !==
      undefined
      ? normalized.opens_at
      : existingRecord
          ?.opens_at ??
        payload.opens_at ??
        null;

  const closesAt =
    normalized.closes_at !==
      undefined
      ? normalized.closes_at
      : existingRecord
          ?.closes_at ??
        payload.closes_at ??
        null;

  validateAdmissionCycleDateOrder({
    opensAt,
    closesAt,
  });

  return normalized;
}

function assertAdmissionCycleUpdates(
  updates,
) {
  if (
    !updates ||
    Object.keys(
      updates,
    ).length === 0
  ) {
    throw new Error(
      "At least one admission cycle field must be provided.",
    );
  }
}

function normalizeInquiryStatus(
  value = "new",
) {
  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    !INQUIRY_STATUSES
      .has(normalized)
  ) {
    throw new Error(
      "Inquiry status must be new, contacted, qualified, unqualified, converted, or closed.",
    );
  }

  return normalized;
}

function normalizeInquirySource(
  value = "manual",
) {
  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    !INQUIRY_SOURCES
      .has(normalized)
  ) {
    throw new Error(
      "Inquiry source is not valid.",
    );
  }

  return normalized;
}

function normalizePreferredContactMethod(
  value,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    !INQUIRY_CONTACT_METHODS
      .has(normalized)
  ) {
    throw new Error(
      "Preferred contact method must be email, phone, SMS, or WhatsApp.",
    );
  }

  return normalized;
}

function validateInquiryContactChannel({
  contactEmail,
  contactPhone,
}) {
  if (
    !contactEmail &&
    !contactPhone
  ) {
    throw new Error(
      "An inquiry requires either a contact email or contact phone.",
    );
  }
}

function generateInquiryNumber() {
  const datePart =
    new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "");

  const randomUuid =
    globalThis.crypto
      ?.randomUUID?.();

  const randomPart =
    randomUuid
      ? randomUuid
          .replaceAll("-", "")
          .slice(0, 8)
          .toUpperCase()
      : Math.random()
          .toString(36)
          .slice(2, 10)
          .toUpperCase();

  return (
    `INQ-${datePart}-${randomPart}`
  );
}

function normalizeInquiryPayload(
  payload = {},
  {
    partial = false,
    existingRecord = null,
  } = {},
) {
  const normalized = {};

  if (
    !partial ||
    payload
      .prospective_student_first_name !==
      undefined
  ) {
    normalized
      .prospective_student_first_name =
      normalizeRequiredText(
        payload
          .prospective_student_first_name,
        "Prospective student first name",
      );
  }

  if (
    !partial ||
    payload
      .prospective_student_middle_name !==
      undefined
  ) {
    normalized
      .prospective_student_middle_name =
      normalizeOptionalText(
        payload
          .prospective_student_middle_name,
      );
  }

  if (
    !partial ||
    payload
      .prospective_student_last_name !==
      undefined
  ) {
    normalized
      .prospective_student_last_name =
      normalizeRequiredText(
        payload
          .prospective_student_last_name,
        "Prospective student last name",
      );
  }

  if (
    !partial ||
    payload
      .prospective_grade_level !==
      undefined
  ) {
    normalized
      .prospective_grade_level =
      normalizeOptionalText(
        payload
          .prospective_grade_level,
      );
  }

  if (
    !partial ||
    payload
      .intended_start_date !==
      undefined
  ) {
    normalized
      .intended_start_date =
      normalizeOptionalDate(
        payload
          .intended_start_date,
        "Intended start date",
      );
  }

  if (
    !partial ||
    payload.contact_name !==
      undefined
  ) {
    normalized.contact_name =
      normalizeRequiredText(
        payload.contact_name,
        "Primary contact name",
      );
  }

  if (
    !partial ||
    payload
      .contact_relationship !==
      undefined
  ) {
    normalized
      .contact_relationship =
      normalizeOptionalText(
        payload
          .contact_relationship,
      );
  }

  if (
    !partial ||
    payload.contact_email !==
      undefined
  ) {
    normalized.contact_email =
      normalizeOptionalText(
        payload.contact_email,
      );
  }

  if (
    !partial ||
    payload.contact_phone !==
      undefined
  ) {
    normalized.contact_phone =
      normalizeOptionalText(
        payload.contact_phone,
      );
  }

  if (
    !partial ||
    payload
      .preferred_contact_method !==
      undefined
  ) {
    normalized
      .preferred_contact_method =
      normalizePreferredContactMethod(
        payload
          .preferred_contact_method,
      );
  }

  if (
    !partial ||
    payload.source !== undefined
  ) {
    normalized.source =
      normalizeInquirySource(
        payload.source,
      );
  }

  if (
    !partial ||
    payload.status !== undefined
  ) {
    normalized.status =
      normalizeInquiryStatus(
        payload.status,
      );
  }

  if (
    !partial ||
    payload.message !== undefined
  ) {
    normalized.message =
      normalizeOptionalText(
        payload.message,
      );
  }

  if (
    !partial ||
    payload.assigned_to !==
      undefined
  ) {
    normalized.assigned_to =
      normalizeOptionalIdentifier(
        payload.assigned_to,
      );
  }

  if (
    !partial ||
    payload.next_follow_up_at !==
      undefined
  ) {
    normalized
      .next_follow_up_at =
      normalizeOptionalDateTime(
        payload
          .next_follow_up_at,
        "Next follow-up",
      );
  }

  if (
    !partial ||
    payload.last_contacted_at !==
      undefined
  ) {
    normalized
      .last_contacted_at =
      normalizeOptionalDateTime(
        payload
          .last_contacted_at,
        "Last contacted date",
      );
  }

  if (
    !partial ||
    payload.closed_reason !==
      undefined
  ) {
    normalized.closed_reason =
      normalizeOptionalText(
        payload.closed_reason,
      );
  }

  const contactEmail =
    normalized.contact_email !==
      undefined
      ? normalized.contact_email
      : existingRecord
          ?.contact_email ??
        null;

  const contactPhone =
    normalized.contact_phone !==
      undefined
      ? normalized.contact_phone
      : existingRecord
          ?.contact_phone ??
        null;

  validateInquiryContactChannel({
    contactEmail,
    contactPhone,
  });

  return normalized;
}

function assertInquiryUpdates(
  updates,
) {
  if (
    !updates ||
    Object.keys(
      updates,
    ).length === 0
  ) {
    throw new Error(
      "At least one inquiry field must be provided.",
    );
  }
}

function normalizeApplicantStatus(
  value = "applicant",
) {
  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    !APPLICANT_STATUSES.has(
      normalized,
    )
  ) {
    throw new Error(
      "Applicant status is not valid.",
    );
  }

  return normalized;
}

function normalizeApplicationStatus(
  value = "draft",
) {
  const normalized = String(value)
    .trim()
    .toLowerCase();

  if (
    !APPLICATION_STATUSES.has(normalized)
  ) {
    throw new Error(
      "Application status is not valid.",
    );
  }

  return normalized;
}

function normalizeApplicantGender(
  value,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    !APPLICANT_GENDERS.has(
      normalized,
    )
  ) {
    throw new Error(
      "Applicant gender is not valid.",
    );
  }

  return normalized;
}

function normalizeCountryCode(value) {
  const normalized =
    normalizeOptionalText(value);

  if (!normalized) {
    return null;
  }

  if (
    !/^[A-Za-z]{2}$/.test(
      normalized,
    )
  ) {
    throw new Error(
      "Country code must contain exactly two letters.",
    );
  }

  return normalized.toUpperCase();
}

function normalizeTextArray(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean);
}

function generateApplicantNumber() {
  const datePart =
    new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "");

  const randomUuid =
    globalThis.crypto
      ?.randomUUID?.();

  const randomPart =
    randomUuid
      ? randomUuid
          .replaceAll("-", "")
          .slice(0, 8)
          .toUpperCase()
      : Math.random()
          .toString(36)
          .slice(2, 10)
          .toUpperCase();

  return (
    `APP-${datePart}-${randomPart}`
  );
}

function normalizeApplicantPayload(
  payload = {},
  {
    partial = false,
  } = {},
) {
  const normalized = {};

  if (
    !partial ||
    payload.first_name !== undefined
  ) {
    normalized.first_name =
      normalizeRequiredText(
        payload.first_name,
        "Applicant first name",
      );
  }

  if (
    !partial ||
    payload.middle_name !== undefined
  ) {
    normalized.middle_name =
      normalizeOptionalText(
        payload.middle_name,
      );
  }

  if (
    !partial ||
    payload.last_name !== undefined
  ) {
    normalized.last_name =
      normalizeRequiredText(
        payload.last_name,
        "Applicant last name",
      );
  }

  if (
    !partial ||
    payload.preferred_name !== undefined
  ) {
    normalized.preferred_name =
      normalizeOptionalText(
        payload.preferred_name,
      );
  }

  if (
    !partial ||
    payload.date_of_birth !== undefined
  ) {
    normalized.date_of_birth =
      normalizeOptionalDate(
        payload.date_of_birth,
        "Date of birth",
      );
  }

  if (
    !partial ||
    payload.gender !== undefined
  ) {
    normalized.gender =
      normalizeApplicantGender(
        payload.gender,
      );
  }

  const optionalTextFields = [
    "nationality",
    "country_of_birth",
    "primary_language",
    "current_school_name",
    "current_grade_level",
    "email",
    "phone",
    "address_line_1",
    "address_line_2",
    "city",
    "region",
    "postal_code",
    "medical_notes",
    "learning_support_notes",
    "accessibility_notes",
    "profile_photo_url",
  ];

  optionalTextFields.forEach(
    (field) => {
      if (
        !partial ||
        payload[field] !== undefined
      ) {
        normalized[field] =
          normalizeOptionalText(
            payload[field],
          );
      }
    },
  );

  if (
    !partial ||
    payload.country_code !==
      undefined
  ) {
    normalized.country_code =
      normalizeCountryCode(
        payload.country_code,
      );
  }

  if (
    !partial ||
    payload.additional_languages !==
      undefined
  ) {
    normalized.additional_languages =
      normalizeTextArray(
        payload.additional_languages,
      );
  }

  if (
    !partial ||
    payload.status !== undefined
  ) {
    normalized.status =
      normalizeApplicantStatus(
        payload.status,
      );
  }

  if (
    !partial ||
    payload.metadata !== undefined
  ) {
    normalized.metadata =
      payload.metadata &&
      typeof payload.metadata ===
        "object" &&
      !Array.isArray(
        payload.metadata,
      )
        ? payload.metadata
        : {};
  }

  return normalized;
}

function normalizeApplicationPayload(
  payload = {},
  {
    partial = false,
  } = {},
) {
  const normalized = {};

  //
  // applicant_id
  //
  if (
    !partial ||
    payload.applicant_id !== undefined
  ) {
    normalized.applicant_id =
      normalizeOptionalIdentifier(
        payload.applicant_id,
      );

    if (
      !partial &&
      !normalized.applicant_id
    ) {
      throw new Error(
        "Applicant is required.",
      );
    }
  }

  //
  // admission_cycle_id
  //
  if (
    !partial ||
    payload.admission_cycle_id !==
      undefined
  ) {
    normalized.admission_cycle_id =
      normalizeOptionalIdentifier(
        payload.admission_cycle_id,
      );

    if (
      !partial &&
      !normalized.admission_cycle_id
    ) {
      throw new Error(
        "Admission cycle is required.",
      );
    }
  }

  //
  // application_number
  //
  if (
    !partial ||
    payload.application_number !==
      undefined
  ) {
    normalized.application_number =
      normalizeOptionalText(
        payload.application_number,
      );
  }

  //
  // entry_grade_level
  //
  if (
    !partial ||
    payload.entry_grade_level !==
      undefined
  ) {
    normalized.entry_grade_level =
      normalizeRequiredText(
        payload.entry_grade_level,
        "Entry grade level",
      );
  }

  //
  // status
  //
  if (
    !partial ||
    payload.status !== undefined
  ) {
    normalized.status =
      normalizeApplicationStatus(
        payload.status,
      );
  }

  //
  // submitted_at
  //
  if (
    !partial ||
    payload.submitted_at !==
      undefined
  ) {
    normalized.submitted_at =
      payload.submitted_at
        ? new Date(
            payload.submitted_at,
          ).toISOString()
        : null;
  }

  //
  // assigned_reviewer_id
  //
  if (
    !partial ||
    payload.assigned_reviewer_id !==
      undefined
  ) {
    normalized.assigned_reviewer_id =
      normalizeOptionalIdentifier(
        payload.assigned_reviewer_id,
      );
  }
 
  //
  // internal_notes
  //
  if (
    !partial ||
    payload.internal_notes !== undefined
  ) {
    normalized.internal_notes =
      normalizeOptionalText(
        payload.internal_notes,
      );
  }

  //
  // applicant_statement
  //
  if (
    !partial ||
    payload.applicant_statement !==
      undefined
  ) {
    normalized.applicant_statement =
      normalizeOptionalText(
        payload.applicant_statement,
      );
  }

  //
  // intended_start_date
  //
  if (
    !partial ||
    payload.intended_start_date !==
      undefined
  ) {
    normalized.intended_start_date =
      payload.intended_start_date
        ? String(
            payload.intended_start_date,
          ).trim()
        : null;
  }

  //
  // application_type
  //
  if (
    !partial ||
    payload.application_type !==
      undefined
  ) {
    const applicationType = String(
      payload.application_type ||
        "new_student",
    )
      .trim()
      .toLowerCase();

    const allowedApplicationTypes =
      new Set([
        "new_student",
        "transfer",
        "returning_student",
        "international",
        "scholarship",
        "other",
      ]);

    if (
      !allowedApplicationTypes.has(
        applicationType,
      )
    ) {
      throw new Error(
        "Application type is not valid.",
      );
    }

    normalized.application_type =
      applicationType;
  }

  //
  // priority
  //
  if (
    !partial ||
    payload.priority !== undefined
  ) {
    const priority = String(
      payload.priority || "normal",
    )
      .trim()
      .toLowerCase();

    const allowedPriorities =
      new Set([
        "low",
        "normal",
        "high",
        "urgent",
      ]);

    if (
      !allowedPriorities.has(priority)
    ) {
      throw new Error(
        "Application priority is not valid.",
      );
    }

    normalized.priority = priority;
  }

  //
  // completion_percentage
  //
  if (
    !partial ||
    payload.completion_percentage !==
      undefined
  ) {
    const percentage = Number(
      payload.completion_percentage ?? 0,
    );

    if (
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      throw new Error(
        "Application completion percentage must be between 0 and 100.",
      );
    }

    normalized.completion_percentage =
      percentage;
  }

  //
  // application_fee_amount
  //
  if (
    !partial ||
    payload.application_fee_amount !==
      undefined
  ) {
    if (
      payload.application_fee_amount ===
        undefined ||
      payload.application_fee_amount ===
        null ||
      payload.application_fee_amount ===
        ""
    ) {
      normalized.application_fee_amount =
        null;
    } else {
      const feeAmount = Number(
        payload.application_fee_amount,
      );

      if (
        !Number.isFinite(feeAmount) ||
        feeAmount < 0
      ) {
        throw new Error(
          "Application fee amount must be zero or greater.",
        );
      }

      normalized.application_fee_amount =
        feeAmount;
    }
  }

  //
  // application_fee_currency
  //
  if (
    !partial ||
    payload.application_fee_currency !==
      undefined
  ) {
    const currency =
      normalizeOptionalText(
        payload.application_fee_currency,
      );

    if (
      currency &&
      !/^[A-Za-z]{3}$/.test(currency)
    ) {
      throw new Error(
        "Application fee currency must be a three-letter currency code.",
      );
    }

    normalized.application_fee_currency =
      currency
        ? currency.toUpperCase()
        : null;
  }

  //
  // application_fee_status
  //
  if (
    !partial ||
    payload.application_fee_status !==
      undefined
  ) {
    const feeStatus =
      normalizeOptionalText(
        payload.application_fee_status,
      );

    const allowedFeeStatuses =
      new Set([
        "not_required",
        "pending",
        "paid",
        "waived",
        "refunded",
      ]);

    if (
      feeStatus &&
      !allowedFeeStatuses.has(
        feeStatus.toLowerCase(),
      )
    ) {
      throw new Error(
        "Application fee status is not valid.",
      );
    }

    normalized.application_fee_status =
      feeStatus
        ? feeStatus.toLowerCase()
        : null;
  }

  //
  // source_inquiry_id
  //
  if (
    !partial ||
    payload.source_inquiry_id !==
      undefined
  ) {
    normalized.source_inquiry_id =
      normalizeOptionalIdentifier(
        payload.source_inquiry_id,
      );
  }

  //
  // metadata
  //
  if (
    !partial ||
    payload.metadata !== undefined
  ) {
    normalized.metadata =
      payload.metadata &&
      typeof payload.metadata ===
        "object" &&
      !Array.isArray(
        payload.metadata,
      )
        ? payload.metadata
        : {};
  }

  return normalized;
}

const APPLICATION_DOCUMENT_STATUSES =
  new Set([
    "missing",
    "requested",
    "uploaded",
    "under_review",
    "verified",
    "rejected",
    "expired",
    "waived",
  ]);

const APPLICATION_DOCUMENT_REQUIREMENTS =
  new Set([
    "required",
    "optional",
    "conditionally_required",
    "waived",
  ]);

function normalizeApplicationDocumentDate(
  value,
  label,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${label} is not a valid date.`,
    );
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function normalizeApplicationDocumentTimestamp(
  value,
  label,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${label} is not a valid date and time.`,
    );
  }

  return date.toISOString();
}

function normalizeApplicationDocumentPayload(
  payload = {},
  {
    partial = false,
  } = {},
) {
  const normalized = {};

  if (
    !partial ||
    payload.application_id !== undefined
  ) {
    normalized.application_id =
      normalizeOptionalIdentifier(
        payload.application_id,
      );

    if (
      !partial &&
      !normalized.application_id
    ) {
      throw new Error(
        "Application is required.",
      );
    }
  }

  if (
    !partial ||
    payload.applicant_id !== undefined
  ) {
    normalized.applicant_id =
      normalizeOptionalIdentifier(
        payload.applicant_id,
      );

    if (
      !partial &&
      !normalized.applicant_id
    ) {
      throw new Error(
        "Applicant is required.",
      );
    }
  }

  if (
    !partial ||
    payload.document_type !== undefined
  ) {
    normalized.document_type =
      normalizeRequiredText(
        payload.document_type,
        "Document type",
      )
        .toLowerCase()
        .replaceAll(" ", "_");
  }

  if (
    !partial ||
    payload.document_label !== undefined
  ) {
    normalized.document_label =
      normalizeRequiredText(
        payload.document_label,
        "Document label",
      );
  }

  if (
    !partial ||
    payload.requirement_status !==
      undefined
  ) {
    const requirementStatus =
      String(
        payload.requirement_status ||
          "required",
      )
        .trim()
        .toLowerCase();

    if (
      !APPLICATION_DOCUMENT_REQUIREMENTS
        .has(requirementStatus)
    ) {
      throw new Error(
        "Document requirement status is not valid.",
      );
    }

    normalized.requirement_status =
      requirementStatus;
  }

  if (
    !partial ||
    payload.status !== undefined
  ) {
    const status =
      String(
        payload.status ||
          "missing",
      )
        .trim()
        .toLowerCase();

    if (
      !APPLICATION_DOCUMENT_STATUSES
        .has(status)
    ) {
      throw new Error(
        "Document status is not valid.",
      );
    }

    normalized.status = status;
  }

  const optionalTextFields = [
    "file_name",
    "storage_bucket",
    "storage_path",
    "mime_type",
    "rejection_reason",
    "notes",
  ];

  optionalTextFields.forEach(
    (field) => {
      if (
        !partial ||
        payload[field] !== undefined
      ) {
        normalized[field] =
          normalizeOptionalText(
            payload[field],
          );
      }
    },
  );

  if (
    !partial ||
    payload.file_size_bytes !== undefined
  ) {
    if (
      payload.file_size_bytes ===
        undefined ||
      payload.file_size_bytes === null ||
      payload.file_size_bytes === ""
    ) {
      normalized.file_size_bytes =
        null;
    } else {
      const fileSize =
        Number(
          payload.file_size_bytes,
        );

      if (
        !Number.isSafeInteger(fileSize) ||
        fileSize < 0
      ) {
        throw new Error(
          "Document file size must be a non-negative whole number.",
        );
      }

      normalized.file_size_bytes =
        fileSize;
    }
  }

  const timestampFields = [
    [
      "uploaded_at",
      "Uploaded date",
    ],
    [
      "verified_at",
      "Verified date",
    ],
    [
      "rejected_at",
      "Rejected date",
    ],
  ];

  timestampFields.forEach(
    ([field, label]) => {
      if (
        !partial ||
        payload[field] !== undefined
      ) {
        normalized[field] =
          normalizeApplicationDocumentTimestamp(
            payload[field],
            label,
          );
      }
    },
  );

  const identifierFields = [
    "uploaded_by",
    "verified_by",
    "rejected_by",
  ];

  identifierFields.forEach(
    (field) => {
      if (
        !partial ||
        payload[field] !== undefined
      ) {
        normalized[field] =
          normalizeOptionalIdentifier(
            payload[field],
          );
      }
    },
  );

  if (
    !partial ||
    payload.issued_on !== undefined
  ) {
    normalized.issued_on =
      normalizeApplicationDocumentDate(
        payload.issued_on,
        "Issued date",
      );
  }

  if (
    !partial ||
    payload.expires_on !== undefined
  ) {
    normalized.expires_on =
      normalizeApplicationDocumentDate(
        payload.expires_on,
        "Expiry date",
      );
  }

  if (
    normalized.issued_on &&
    normalized.expires_on &&
    normalized.expires_on <
      normalized.issued_on
  ) {
    throw new Error(
      "Document expiry date cannot be before its issued date.",
    );
  }

  if (
    !partial ||
    payload.metadata !== undefined
  ) {
    normalized.metadata =
      payload.metadata &&
      typeof payload.metadata ===
        "object" &&
      !Array.isArray(
        payload.metadata,
      )
        ? payload.metadata
        : {};
  }

  return normalized;
}

function assertApplicationDocumentUpdates(
  updates,
) {
  if (
    !updates ||
    Object.keys(updates).length === 0
  ) {
    throw new Error(
      "At least one application document field must be provided.",
    );
  }
}

function validateApplicationDocumentState(
  document,
) {
  if (
    [
      "uploaded",
      "under_review",
      "verified",
      "rejected",
      "expired",
    ].includes(document.status) &&
    (
      !document.storage_bucket ||
      !document.storage_path
    )
  ) {
    throw new Error(
      "Uploaded documents require a storage bucket and storage path.",
    );
  }

  if (
    document.status === "verified" &&
    !document.verified_at
  ) {
    throw new Error(
      "Verified documents require a verified date.",
    );
  }

  if (
    document.status === "rejected" &&
    (
      !document.rejected_at ||
      !document.rejection_reason
    )
  ) {
    throw new Error(
      "Rejected documents require a rejected date and rejection reason.",
    );
  }

  if (
    document.issued_on &&
    document.expires_on &&
    document.expires_on <
      document.issued_on
  ) {
    throw new Error(
      "Document expiry date cannot be before its issued date.",
    );
  }
}

function assertApplicantUpdates(
  updates,
) {
  if (
    !updates ||
    Object.keys(updates)
      .length === 0
  ) {
    throw new Error(
      "At least one applicant field must be provided.",
    );
  }
}

function assertApplicationUpdates(
  updates,
) {
  if (
    !updates ||
    Object.keys(updates).length ===
      0
  ) {
    throw new Error(
      "At least one application field must be provided.",
    );
  }
}

function generateApplicationNumber() {
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

  return `APP-${datePart}-${randomPart}`;
}

export class AdmissionsService {
  constructor({
    repository =
      admissionsRepository,
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
    return new AdmissionsService({
      repository:
        this.repository,
      scope,
    });
  }

  getWorkspaceScope() {
    return {
      ...this.scope,
    };
  }

  async getAdmissionCycles(
    filters = {},
  ) {
    return this.repository
      .getAdmissionCycles(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getAdmissionCycle(id) {
    requireIdentifier(
      id,
      "Admission cycle id",
    );

    return this.repository
      .getAdmissionCycle(id);
  }

  async createAdmissionCycle(
    payload = {},
  ) {
    const normalized =
      normalizeAdmissionCyclePayload(
        payload,
      );

    return this.repository
      .createAdmissionCycle({
        organization_id:
          this.scope.organizationId,

        school_id:
          this.scope.schoolId,

        campus_id:
          normalized.campus_id ??
          this.scope.campusId ??
          null,

        name:
          normalized.name,

        code:
          normalized.code,

        academic_year_label:
          normalized
            .academic_year_label,

        opens_at:
          normalized.opens_at,

        closes_at:
          normalized.closes_at,

        status:
          normalized.status,

        application_target:
          normalized
            .application_target,

        seat_capacity:
          normalized.seat_capacity,

        notes:
          normalized.notes,
      });
  }

  async updateAdmissionCycle(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Admission cycle id",
    );

    const existingRecord =
      await this.repository
        .getAdmissionCycle(id);

    if (!existingRecord) {
      throw new Error(
        "The admission cycle could not be found.",
      );
    }

    const normalized =
      normalizeAdmissionCyclePayload(
        updates,
        {
          partial: true,
          existingRecord,
        },
      );

    assertAdmissionCycleUpdates(
      normalized,
    );

    return this.repository
      .updateAdmissionCycle(
        id,
        normalized,
      );
  }

  async archiveAdmissionCycle(id) {
    requireIdentifier(
      id,
      "Admission cycle id",
    );

    const existingRecord =
      await this.repository
        .getAdmissionCycle(id);

    if (!existingRecord) {
      throw new Error(
        "The admission cycle could not be found.",
      );
    }

    if (
      existingRecord.status ===
      "archived"
    ) {
      return existingRecord;
    }

    return this.repository
      .archiveAdmissionCycle(id);
  }

  async deleteAdmissionCycle(id) {
    requireIdentifier(
      id,
      "Admission cycle id",
    );

    const existingRecord =
      await this.repository
        .getAdmissionCycle(id);

    if (!existingRecord) {
      throw new Error(
        "The admission cycle could not be found.",
      );
    }

    return this.repository
      .deleteAdmissionCycle(id);
  }

  async createInquiry(
    payload = {},
  ) {
    const normalized =
      normalizeInquiryPayload(
        payload,
      );

    const admissionCycleId =
      payload.admission_cycle_id ||
      this.scope.admissionCycleId;

    if (!admissionCycleId) {
      throw new Error(
        "An admission cycle must be selected before creating an inquiry.",
      );
    }

    const inquiryNumber =
      normalizeOptionalText(
        payload.inquiry_number,
      ) ||
      generateInquiryNumber();

    return this.repository
      .createInquiry({
        organization_id:
          this.scope.organizationId,

        school_id:
          this.scope.schoolId,

        campus_id:
          normalizeOptionalIdentifier(
            payload.campus_id,
          ) ??
          this.scope.campusId ??
          null,

        admission_cycle_id:
          admissionCycleId,

        inquiry_number:
          inquiryNumber,

        ...normalized,
      });
  }

  async updateInquiry(
    id,
    updates = {},
  ) {
    requireIdentifier(
      id,
      "Inquiry id",
    );

    const existingRecord =
      await this.repository
        .getInquiry(id);

    if (!existingRecord) {
      throw new Error(
        "The admission inquiry could not be found.",
      );
    }

    const normalized =
      normalizeInquiryPayload(
        updates,
        {
          partial: true,
          existingRecord,
        },
      );

    assertInquiryUpdates(
      normalized,
    );

    if (
      normalized.status ===
        "closed" &&
      existingRecord.status !==
        "closed"
    ) {
      normalized.closed_at =
        new Date()
          .toISOString();
    }

    if (
      normalized.status &&
      normalized.status !==
        "closed"
    ) {
      normalized.closed_at =
        null;

      normalized.closed_reason =
        null;
    }

    return this.repository
      .updateInquiry(
        id,
        normalized,
      );
  }

  async convertInquiryToApplicant(
    inquiryId,
    {
      transitionNotes = null,
    } = {},
  ) {
    requireIdentifier(
      inquiryId,
      "Inquiry id",
    );

    const existingInquiry =
      await this.repository
        .getInquiry(inquiryId);

    if (!existingInquiry) {
      throw new Error(
        "The admission inquiry could not be found.",
      );
    }

    if (
      existingInquiry.status ===
        "converted" &&
      existingInquiry
        .converted_applicant_id
    ) {
      const existingApplicant =
        await this.repository
          .getApplicant(
            existingInquiry
              .converted_applicant_id,
          );

      return {
        inquiry:
          existingInquiry,

        applicant:
          existingApplicant,

        alreadyConverted:
          true,
      };
    }

    if (
      existingInquiry.status !==
      "qualified"
    ) {
      throw new Error(
        "Only qualified inquiries can be converted to applicants.",
      );
    }

    return this.repository
      .convertInquiryToApplicant(
        inquiryId,
        {
          transitionNotes:
            normalizeOptionalText(
              transitionNotes,
            ),
        },
      );
  }

  async getInquiries(
    filters = {},
  ) {
    return this.repository
      .getInquiries(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getInquiry(id) {
    requireIdentifier(
      id,
      "Inquiry id",
    );

    return this.repository
      .getInquiry(id);
  }

  async getApplicants(
    filters = {},
  ) {
    return this.repository
      .getApplicants(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getApplicant(id) {
    requireIdentifier(
      id,
      "Applicant id",
    );

    return this.repository
      .getApplicant(id);
  }

   async createApplicant(
    payload = {},
   ) {
    const normalized =
      normalizeApplicantPayload(
        payload,
      );

    const applicantNumber =
      normalizeOptionalText(
        payload.applicant_number,
      ) ||
      generateApplicantNumber();

   return this.repository
    .createApplicant({
      organization_id:
        this.scope.organizationId,

      school_id:
        this.scope.schoolId,

      campus_id:
        normalizeOptionalIdentifier(
          payload.campus_id,
        ) ??
        this.scope.campusId ??
        null,

      applicant_number:
        applicantNumber,

      ...normalized,
    });
  }

  async updateApplicant(
    applicantId,
    updates = {},
  ) {
    requireIdentifier(
      applicantId,
      "Applicant id",
    );

    const existingApplicant =
      await this.repository
        .getApplicant(
          applicantId,
        );

    if (!existingApplicant) {
      throw new Error(
        "The applicant could not be found.",
      );
    }

    const normalized =
      normalizeApplicantPayload(
        updates,
        {
          partial: true,
        },
      );

    assertApplicantUpdates(
      normalized,
    );

    return this.repository
      .updateApplicant(
        applicantId,
        normalized,
      );
   }
  async getGuardians(
    filters = {},
  ) {
    return this.repository
      .getGuardians(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getGuardian(id) {
    requireIdentifier(
      id,
      "Guardian id",
    );

    return this.repository
      .getGuardian(id);
  }

  async getApplicantGuardians(
    applicantId,
    filters = {},
  ) {
    requireIdentifier(
      applicantId,
      "Applicant id",
    );

    return this.repository
      .getApplicantGuardians(
        mergeScope(
          this.scope,
          {
            ...filters,
            applicantId,
          },
        ),
      );
  }

  async getApplications(
    filters = {},
  ) {
    return this.repository
      .getApplications(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getApplication(id) {
    requireIdentifier(
      id,
      "Application id",
    );

    return this.repository
      .getApplication(id);
  }

  async createApplication(
    payload = {},
  ) {
    const normalized =
      normalizeApplicationPayload(
        payload,
      );

    const applicationNumber =
      normalizeOptionalText(
        payload.application_number,
      ) ||
      generateApplicationNumber();

    const admissionCycleId =
      normalized.admission_cycle_id ||
      this.scope.admissionCycleId;

    requireIdentifier(
      admissionCycleId,
      "Admission cycle id",
    );

    requireIdentifier(
      normalized.applicant_id,
      "Applicant id",
    );

    try {
      return await this.repository
        .createApplication({
          organization_id:
            this.scope.organizationId,

          school_id:
            this.scope.schoolId,

          campus_id:
            normalizeOptionalIdentifier(
              payload.campus_id,
            ) ??
            this.scope.campusId ??
            null,

          admission_cycle_id:
            admissionCycleId,

          applicant_id:
            normalized.applicant_id,

          source_inquiry_id:
            normalized.source_inquiry_id ??
            null,

          application_number:
            applicationNumber,

          entry_grade_level:
            normalized.entry_grade_level,

          intended_start_date:
            normalized.intended_start_date ??
            null,

          application_type:
            normalized.application_type,

          status:
            normalized.status,

          priority:
            normalized.priority,

          submitted_at:
            normalized.submitted_at,

          assigned_reviewer_id:
            normalized.assigned_reviewer_id,

          completion_percentage:
            normalized.completion_percentage,

          application_fee_amount:
            normalized.application_fee_amount,

          application_fee_currency:
            normalized.application_fee_currency,

          application_fee_status:
            normalized.application_fee_status,

          internal_notes:
            normalized.internal_notes,

          applicant_statement:
            normalized.applicant_statement,

          metadata:
            normalized.metadata,
        });
    } catch (error) {
      const errorCode =
        error?.code ||
        error?.cause?.code ||
        error?.details?.code;

      const errorText = [
        error?.message,
        error?.details,
        error?.hint,
        error?.cause?.message,
      ]
        .filter(Boolean)
        .join(" ");

      if (
        errorCode === "23505" ||
        errorText.includes(
          "admission_applications_cycle_applicant_unique_idx",
        )
      ) {
        throw new Error(
          "This applicant already has an active application for the selected admission cycle.",
        );
      }

      throw error;
    }
  }
  
  async updateApplication(
  applicationId,
  updates = {},
) {
  requireIdentifier(
    applicationId,
    "Application id",
  );

  const existingApplication =
    await this.repository
      .getApplication(
        applicationId,
      );

  if (!existingApplication) {
    throw new Error(
      "The admission application could not be found.",
    );
  }

  const normalized =
    normalizeApplicationPayload(
      updates,
      {
        partial: true,
      },
    );

  assertApplicationUpdates(
    normalized,
  );

  const nextStatus =
    normalized.status ??
    existingApplication.status;

  if (
    nextStatus !== "draft" &&
    nextStatus !== "cancelled" &&
    nextStatus !== "withdrawn" &&
    !(
      normalized.submitted_at ??
      existingApplication.submitted_at
    )
  ) {
    normalized.submitted_at =
      new Date().toISOString();
  }

  if (
    nextStatus === "withdrawn" &&
    !existingApplication.withdrawn_at
  ) {
    normalized.withdrawn_at =
      new Date().toISOString();
  }

  return this.repository
    .updateApplication(
      applicationId,
      normalized,
    );
}

async getApplicationDocuments(
  applicationId,
  filters = {},
) {
  requireIdentifier(
    applicationId,
    "Application id",
  );

  return this.repository
    .getApplicationDocuments(
      mergeScope(
        this.scope,
        {
          ...filters,
          applicationId,
        },
      ),
    );
}

async getApplicationDocument(
  documentId,
) {
  requireIdentifier(
    documentId,
    "Application document id",
  );

  return this.repository
    .getApplicationDocument(
      documentId,
    );
}

async createApplicationDocument(
  applicationId,
  payload = {},
) {
  requireIdentifier(
    applicationId,
    "Application id",
  );

  const application =
    await this.repository
      .getApplication(
        applicationId,
      );

  if (!application) {
    throw new Error(
      "The admission application could not be found.",
    );
  }

  const normalized =
    normalizeApplicationDocumentPayload(
      {
        ...payload,

        application_id:
          application.id,

        applicant_id:
          application.applicant_id,
      },
    );

  validateApplicationDocumentState(
    normalized,
  );

  return this.repository
    .createApplicationDocument({
      ...normalized,

      organization_id:
        application.organization_id,

      school_id:
        application.school_id,
    });
  }

async updateApplicationDocument(
  documentId,
  updates = {},
) {
  requireIdentifier(
    documentId,
    "Application document id",
  );

  const existingDocument =
    await this.repository
      .getApplicationDocument(
        documentId,
      );

  if (!existingDocument) {
    throw new Error(
      "The application document could not be found.",
    );
  }

  const normalized =
    normalizeApplicationDocumentPayload(
      updates,
      {
        partial: true,
      },
    );

  assertApplicationDocumentUpdates(
    normalized,
  );

  const nextDocument = {
    ...existingDocument,
    ...normalized,
  };

  validateApplicationDocumentState(
    nextDocument,
  );

  return this.repository
    .updateApplicationDocument(
      documentId,
      normalized,
    );
}

async deleteApplicationDocument(
  documentId,
) {
  requireIdentifier(
    documentId,
    "Application document id",
  );

  const existingDocument =
    await this.repository
      .getApplicationDocument(
        documentId,
      );

  if (!existingDocument) {
    throw new Error(
      "The application document could not be found.",
    );
  }

  return this.repository
    .deleteApplicationDocument(
      documentId,
    );
}

  async getInterviews(
    filters = {},
  ) {
    return this.repository
      .getInterviews(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getInterview(id) {
    requireIdentifier(
      id,
      "Interview id",
    );

    return this.repository
      .getInterview(id);
  }

  async getDecisions(
    filters = {},
  ) {
    return this.repository
      .getDecisions(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getDecision(id) {
    requireIdentifier(
      id,
      "Decision id",
    );

    return this.repository
      .getDecision(id);
  }

  async getOffers(
    filters = {},
  ) {
    return this.repository
      .getOffers(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getOffer(id) {
    requireIdentifier(
      id,
      "Offer id",
    );

    return this.repository
      .getOffer(id);
  }

  async getStatusHistory(
    filters = {},
  ) {
    return this.repository
      .getStatusHistory(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getEnrollmentConversions(
    filters = {},
  ) {
    return this.repository
      .getEnrollmentConversions(
        mergeScope(
          this.scope,
          filters,
        ),
      );
  }

  async getEnrollmentConversion(
    id,
  ) {
    requireIdentifier(
      id,
      "Enrollment conversion id",
    );

    return this.repository
      .getEnrollmentConversion(id);
  }

  async getDashboardMetrics(
    overrides = {},
  ) {
    return this.repository
      .getDashboardMetrics({
        schoolId:
          this.scope.schoolId,

        campusId:
          overrides.campusId ??
          this.scope.campusId,

        admissionCycleId:
          overrides
            .admissionCycleId ??
          this.scope
            .admissionCycleId,
      });
  }

  async getDashboardSnapshot({
    admissionCycleId,
    inquiryLimit = 5,
    applicationLimit = 8,
    interviewLimit = 6,
  } = {}) {
    const cycleOverride =
      admissionCycleId ||
      this.scope
        .admissionCycleId;

    const [
      metrics,
      recentInquiries,
      priorityApplications,
      upcomingInterviews,
    ] = await Promise.all([
      this.getDashboardMetrics({
        admissionCycleId:
          cycleOverride,
      }),

      this.getInquiries({
        admissionCycleId:
          cycleOverride,

        page: 1,
        pageSize:
          inquiryLimit,

        sortBy:
          "created_at",

        ascending:
          false,
      }),

      this.getApplications({
        admissionCycleId:
          cycleOverride,

        statuses: [
          "submitted",
          "documents_pending",
          "under_review",
          "assessment_pending",
          "interview_pending",
          "decision_pending",
          "approved",
          "waitlisted",
          "offer_sent",
          "offer_accepted",
        ],

        page: 1,

        pageSize:
          applicationLimit,

        sortBy:
          "submitted_at",

        ascending:
          false,
      }),

      this.getInterviews({
        statuses: [
          "scheduled",
          "confirmed",
          "reschedule_required",
        ],

        dateColumn:
          "scheduled_start_at",

        dateFrom:
          new Date()
            .toISOString(),

        page: 1,

        pageSize:
          interviewLimit,

        sortBy:
          "scheduled_start_at",

        ascending:
          true,
      }),
    ]);

    return {
      metrics,
      recentInquiries,
      priorityApplications,
      upcomingInterviews,

      loadedAt:
        new Date()
          .toISOString(),
    };
  }
}

export function createAdmissionsService(
  scope,
) {
  return new AdmissionsService({
    scope,
  });
}