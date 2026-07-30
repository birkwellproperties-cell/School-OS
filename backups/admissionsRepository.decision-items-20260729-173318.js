import { supabase } from "../../../services/supabase";

import {
  AdmissionsTable,
} from "../constants";

import {
  createAdmissionsRepositoryError,
} from "../utils";

import {
  applyArrayFilter,
  applyDateRange,
  applyExactFilter,
  applyOrdering,
  applyPagination,
  applySearch,
  createPagedResult,
  normalizePagination,
} from "./admissionsQuery";

const DEFAULT_SELECT = "*";

function throwRepositoryError({
  error,
  operation,
  table,
  fallbackMessage,
}) {
  throw createAdmissionsRepositoryError({
    error,
    operation,
    table,
    fallbackMessage,
  });
}

async function getSingleRecord({
  table,
  id,
  select = DEFAULT_SELECT,
  operation,
  fallbackMessage,
}) {
  if (!id) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .select(select)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

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
    campusId: true,
    admissionCycleId: true,
    applicantId: true,
    applicationId: true,
    assignedTo: true,
    assignedReviewerId: true,
    leadInterviewerId: true,
    decisionId: true,
    offerId: true,
    priority: true,
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
    supportedFilters.admissionCycleId
  ) {
    query = applyExactFilter(
      query,
      "admission_cycle_id",
      filters.admissionCycleId,
    );
  }

  if (
    supportedFilters.applicantId
  ) {
    query = applyExactFilter(
      query,
      "applicant_id",
      filters.applicantId,
    );
  }

  if (
    supportedFilters.applicationId
  ) {
    query = applyExactFilter(
      query,
      "application_id",
      filters.applicationId,
    );
  }

  if (
    supportedFilters.assignedTo
  ) {
    query = applyExactFilter(
      query,
      "assigned_to",
      filters.assignedTo,
    );
  }

  if (
    supportedFilters
      .assignedReviewerId
  ) {
    query = applyExactFilter(
      query,
      "assigned_reviewer_id",
      filters.assignedReviewerId,
    );
  }

  if (
    supportedFilters
      .leadInterviewerId
  ) {
    query = applyExactFilter(
      query,
      "lead_interviewer_id",
      filters.leadInterviewerId,
    );
  }

  if (
    supportedFilters.decisionId
  ) {
    query = applyExactFilter(
      query,
      "decision_id",
      filters.decisionId,
    );
  }

  if (
    supportedFilters.offerId
  ) {
    query = applyExactFilter(
      query,
      "offer_id",
      filters.offerId,
    );
  }

  if (
    supportedFilters.priority
  ) {
    query = applyExactFilter(
      query,
      "priority",
      filters.priority,
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

  query = applyDateRange(
    query,
    filters.dateColumn ||
      "created_at",
    {
      from:
        filters.dateFrom,

      to:
        filters.dateTo,
    },
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
    pagination,
  });
}

export async function updateAdmissionCycle(
  id,
  updates,
) {
  const { data, error } = await supabase
    .from(AdmissionsTable.CYCLES)
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation: "updateAdmissionCycle",
      table: AdmissionsTable.CYCLES,
      fallbackMessage:
        "Unable to update admission cycle.",
    });
  }

  return data;
}

export async function archiveAdmissionCycle(id) {
  return updateAdmissionCycle(id, {
    status: "archived",
    archived_at: new Date().toISOString(),
  });
}

export async function deleteAdmissionCycle(id) {
  return updateAdmissionCycle(id, {
    deleted_at: new Date().toISOString(),
  });
}

export async function getAdmissionCycles(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.CYCLES,
    filters,
    searchColumns: [
      "name",
      "code",
      "academic_year_label",
      "notes",
    ],
    allowedSortColumns: [
      "created_at",
      "updated_at",
      "name",
      "code",
      "academic_year_label",
      "status",
      "opens_at",
      "closes_at",
    ],
    operation: "getAdmissionCycles",
    fallbackMessage:
      "Unable to load admission cycles.",
  });
}

export async function getAdmissionCycle(id) {
  return getSingleRecord({
    table: AdmissionsTable.CYCLES,
    id,
    operation: "getAdmissionCycle",
    fallbackMessage:
      "Unable to load the admission cycle.",
  });
}

export async function createInquiry(
  payload,
) {
  const { data, error } = await supabase
    .from(AdmissionsTable.INQUIRIES)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation: "createInquiry",
      table:
        AdmissionsTable.INQUIRIES,
      fallbackMessage:
        "Unable to create the admission inquiry.",
    });
  }

  return data;
}

export async function updateInquiry(
  id,
  updates,
) {
  const { data, error } = await supabase
    .from(AdmissionsTable.INQUIRIES)
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation: "updateInquiry",
      table:
        AdmissionsTable.INQUIRIES,
      fallbackMessage:
        "Unable to update the admission inquiry.",
    });
  }

  return data;
}

export async function getInquiries(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.INQUIRIES,
    filters,
    searchColumns: [
      "inquiry_number",
      "prospective_student_first_name",
      "prospective_student_middle_name",
      "prospective_student_last_name",
      "contact_name",
      "contact_email",
      "contact_phone",
    ],
    allowedSortColumns: [
      "created_at",
      "updated_at",
      "inquiry_number",
      "status",
      "next_follow_up_at",
      "last_contacted_at",
    ],
    operation: "getInquiries",
    fallbackMessage:
      "Unable to load admission inquiries.",
  });
}

export async function getInquiry(id) {
  return getSingleRecord({
    table: AdmissionsTable.INQUIRIES,
    id,
    operation: "getInquiry",
    fallbackMessage:
      "Unable to load the admission inquiry.",
  });
}

export async function getProfilesByIds(
  ids = [],
) {
  const normalizedIds = [
    ...new Set(
      (
        Array.isArray(ids)
          ? ids
          : []
      )
        .map((id) =>
          String(id || "").trim(),
        )
        .filter(Boolean),
    ),
  ];

  if (!normalizedIds.length) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "full_name",
        "preferred_name",
        "email",
        "avatar_url",
        "account_status",
      ].join(", "),
    )
    .in("id", normalizedIds);

  if (error) {
    throwRepositoryError({
      error,
      operation:
        "getProfilesByIds",
      table: "profiles",
      fallbackMessage:
        "Unable to load reviewer profiles.",
    });
  }

  return Array.isArray(data)
    ? data
    : [];
}

export async function getApplicants(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.APPLICANTS,
    filters,
    searchColumns: [
      "applicant_number",
      "first_name",
      "middle_name",
      "last_name",
      "preferred_name",
      "email",
      "phone",
      "current_school_name",
      "current_grade_level",
    ],
    allowedSortColumns: [
      "created_at",
      "updated_at",
      "applicant_number",
      "first_name",
      "last_name",
      "status",
      "date_of_birth",
    ],
    operation: "getApplicants",
    fallbackMessage:
      "Unable to load applicants.",
  });
}

export async function getApplicant(id) {
  return getSingleRecord({
    table: AdmissionsTable.APPLICANTS,
    id,
    operation: "getApplicant",
    fallbackMessage:
      "Unable to load the applicant.",
  });
}

export async function createApplicant(payload) {
  const { data, error } = await supabase
    .from(AdmissionsTable.APPLICANTS)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation: "createApplicant",
      table: AdmissionsTable.APPLICANTS,
      fallbackMessage:
        "Unable to create applicant.",
    });
  }

  return data;
}

export async function updateApplicant(
  id,
  updates,
) {
  const { data, error } = await supabase
    .from(AdmissionsTable.APPLICANTS)
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation: "updateApplicant",
      table: AdmissionsTable.APPLICANTS,
      fallbackMessage:
        "Unable to update applicant.",
    });
  }

  return data;
}

export async function createApplication(payload) {
  const { data, error } = await supabase
    .from(AdmissionsTable.APPLICATIONS)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation: "createApplication",
      table: AdmissionsTable.APPLICATIONS,
      fallbackMessage:
        "Unable to create admission application.",
    });
  }

  return data;
}

export async function updateApplication(
  id,
  updates,
) {
  const { data, error } = await supabase
    .from(AdmissionsTable.APPLICATIONS)
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation: "updateApplication",
      table: AdmissionsTable.APPLICATIONS,
      fallbackMessage:
        "Unable to update admission application.",
    });
  }

  return data;
}

export async function convertInquiryToApplicant(
  inquiryId,
  {
    transitionNotes = null,
  } = {},
) {
  const { data, error } =
    await supabase.rpc(
      "convert_admission_inquiry_to_applicant",
      {
        p_inquiry_id:
          inquiryId,

        p_transition_notes:
          transitionNotes,
      },
    );

  if (error) {
    throwRepositoryError({
      error,

      operation:
        "convertInquiryToApplicant",

      table:
        AdmissionsTable.INQUIRIES,

      fallbackMessage:
        "Unable to convert the inquiry to an applicant.",
    });
  }

  return data;
}

export async function getGuardians(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.GUARDIANS,
    filters,
    searchColumns: [
      "first_name",
      "middle_name",
      "last_name",
      "email",
      "phone",
      "alternate_phone",
      "occupation",
      "employer",
    ],
    allowedSortColumns: [
      "created_at",
      "updated_at",
      "first_name",
      "last_name",
      "status",
    ],
    operation: "getGuardians",
    fallbackMessage:
      "Unable to load guardians.",
  });
}

export async function getGuardian(id) {
  return getSingleRecord({
    table: AdmissionsTable.GUARDIANS,
    id,
    operation: "getGuardian",
    fallbackMessage:
      "Unable to load the guardian.",
  });
}

export async function getApplicantGuardians(
  filters = {},
) {
  return getPagedRecords({
    table:
      AdmissionsTable.APPLICANT_GUARDIANS,
    filters,
    searchColumns: [
      "relationship_type",
    ],
    allowedSortColumns: [
      "created_at",
      "updated_at",
      "relationship_type",
    ],
    operation:
      "getApplicantGuardians",
    fallbackMessage:
      "Unable to load applicant guardian relationships.",
  });
}

export async function getApplications(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.APPLICATIONS,
    filters,
    searchColumns: [
      "application_number",
      "entry_grade_level",
      "application_type",
      "internal_notes",
      "applicant_statement",
    ],
    allowedSortColumns: [
      "created_at",
      "updated_at",
      "application_number",
      "submitted_at",
      "status",
      "priority",
      "completion_percentage",
    ],
    operation: "getApplications",
    fallbackMessage:
      "Unable to load admission applications.",
  });
}

export async function getApplication(id) {
  return getSingleRecord({
    table: AdmissionsTable.APPLICATIONS,
    id,
    operation: "getApplication",
    fallbackMessage:
      "Unable to load the admission application.",
  });
}

export async function getAdmissionDocumentRequirements(
  filters = {},
) {
  return getPagedRecords({
    table:
      AdmissionsTable.DOCUMENT_REQUIREMENTS,

    filters,

    supportedFilters: {
      organizationId: true,
      schoolId: true,
      campusId: true,
      admissionCycleId: true,

      applicantId: false,
      applicationId: false,

      assignedTo: false,
      assignedReviewerId: false,
      leadInterviewerId: false,
      decisionId: false,
      offerId: false,
      priority: false,

      status: false,
      statuses: false,
    },

    searchColumns: [
      "document_type",
      "document_label",
      "instructions",
    ],

    allowedSortColumns: [
      "created_at",
      "updated_at",
      "document_type",
      "document_label",
      "requirement_status",
      "display_order",
      "review_required",
      "is_active",
      "archived_at",
    ],

    configureQuery: (
      query,
      currentFilters,
    ) => {
      let nextQuery = query;

      nextQuery = applyExactFilter(
        nextQuery,
        "requirement_status",
        currentFilters.requirementStatus,
      );

      nextQuery = applyExactFilter(
        nextQuery,
        "is_active",
        currentFilters.isActive,
      );

      return nextQuery;
    },

    operation:
      "getAdmissionDocumentRequirements",

    fallbackMessage:
      "Unable to load admission document requirements.",
  });
}

export async function getAdmissionDocumentRequirement(
  id,
) {
  return getSingleRecord({
    table:
      AdmissionsTable.DOCUMENT_REQUIREMENTS,

    id,

    operation:
      "getAdmissionDocumentRequirement",

    fallbackMessage:
      "Unable to load the admission document requirement.",
  });
}

export async function createAdmissionDocumentRequirement(
  payload,
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      AdmissionsTable.DOCUMENT_REQUIREMENTS,
    )
    .insert(payload)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,

      operation:
        "createAdmissionDocumentRequirement",

      table:
        AdmissionsTable.DOCUMENT_REQUIREMENTS,

      fallbackMessage:
        "Unable to create the admission document requirement.",
    });
  }

  return data;
}

export async function updateAdmissionDocumentRequirement(
  id,
  updates,
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      AdmissionsTable.DOCUMENT_REQUIREMENTS,
    )
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,

      operation:
        "updateAdmissionDocumentRequirement",

      table:
        AdmissionsTable.DOCUMENT_REQUIREMENTS,

      fallbackMessage:
        "Unable to update the admission document requirement.",
    });
  }

  return data;
}

export async function archiveAdmissionDocumentRequirement(
  id,
) {
  return updateAdmissionDocumentRequirement(
    id,
    {
      is_active: false,
      archived_at:
        new Date().toISOString(),
    },
  );
}

export async function deleteAdmissionDocumentRequirement(
  id,
) {
  return updateAdmissionDocumentRequirement(
    id,
    {
      is_active: false,
      deleted_at:
        new Date().toISOString(),
    },
  );
}

export async function getApplicationDocuments(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.DOCUMENTS,
    filters,

    supportedFilters: {
      organizationId: true,
      schoolId: true,

      campusId: false,
      admissionCycleId: false,

      applicantId: true,
      applicationId: true,

      assignedTo: false,
      assignedReviewerId: false,
      leadInterviewerId: false,
      decisionId: false,
      offerId: false,
      priority: false,

      status: true,
      statuses: true,
    },

    searchColumns: [
      "document_type",
      "document_label",
      "file_name",
      "rejection_reason",
      "notes",
    ],

   allowedSortColumns: [
    "created_at",
    "updated_at",
    "document_type",
    "document_label",
    "status",
    "uploaded_at",
    "verified_at",
    "expires_on",
  ],

  configureQuery: (
    query,
    currentFilters,
  ) => {
    return applyExactFilter(
      query,
      "requirement_id",
      currentFilters.requirementId,
    );
  },

  operation:
    "getApplicationDocuments",

    fallbackMessage:
      "Unable to load application documents.",
  });
}

export async function getApplicationDocument(
  id,
) {
  return getSingleRecord({
    table: AdmissionsTable.DOCUMENTS,
    id,
    operation:
      "getApplicationDocument",
    fallbackMessage:
      "Unable to load the application document.",
  });
}

export async function createApplicationDocument(
  payload,
) {
  const {
    data,
    error,
  } = await supabase
    .from(AdmissionsTable.DOCUMENTS)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation:
        "createApplicationDocument",
      table:
        AdmissionsTable.DOCUMENTS,
      fallbackMessage:
        "Unable to create the application document.",
    });
  }

  return data;
}

export async function updateApplicationDocument(
  id,
  updates,
) {
  const {
    data,
    error,
  } = await supabase
    .from(AdmissionsTable.DOCUMENTS)
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation:
        "updateApplicationDocument",
      table:
        AdmissionsTable.DOCUMENTS,
      fallbackMessage:
        "Unable to update the application document.",
    });
  }

  return data;
}

export async function deleteApplicationDocument(
  id,
) {
  return updateApplicationDocument(
    id,
    {
      deleted_at:
        new Date().toISOString(),
    },
  );
}

export async function getInterviews(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.INTERVIEWS,
    filters,
    searchColumns: [
      "interview_type",
      "location_details",
      "summary",
      "internal_notes",
    ],
    allowedSortColumns: [
      "created_at",
      "updated_at",
      "scheduled_start_at",
      "scheduled_end_at",
      "status",
      "score",
    ],
    operation: "getInterviews",
    fallbackMessage:
      "Unable to load admission interviews.",
  });
}

export async function getInterview(id) {
  return getSingleRecord({
    table: AdmissionsTable.INTERVIEWS,
    id,
    operation: "getInterview",
    fallbackMessage:
      "Unable to load the admission interview.",
  });
}

function getProfileDisplayName(
  profile,
) {
  if (!profile) {
    return null;
  }

  return (
    profile.preferred_name ||
    profile.full_name ||
    profile.email ||
    profile.id ||
    null
  );
}

async function enrichDecisionProfiles(
  decisions = [],
) {
  const normalizedDecisions =
    Array.isArray(decisions)
      ? decisions
      : [];

  if (!normalizedDecisions.length) {
    return [];
  }

  const profileIds = [
    ...new Set(
      normalizedDecisions
        .flatMap((decision) => [
          decision
            ?.recommended_by,
          decision
            ?.approved_by,
          decision
            ?.published_by,
        ])
        .map((id) =>
          String(id || "").trim(),
        )
        .filter(Boolean),
    ),
  ];

  if (!profileIds.length) {
    return normalizedDecisions;
  }

  const profiles =
    await getProfilesByIds(
      profileIds,
    );

  console.log(
    "[Decision] profileIds:",
    profileIds,
  );

  console.log(
    "[Decision] profiles:",
    profiles,
  );

  console.log(
    "[Decision] decisions:",
    normalizedDecisions,
  );

  const profilesById =
    new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ]),
    );

  return normalizedDecisions.map(
    (decision) => {
      const recommendedByProfile =
        decision.recommended_by
          ? profilesById.get(
              decision
                .recommended_by,
            ) || null
          : null;

      const approvedByProfile =
        decision.approved_by
          ? profilesById.get(
              decision
                .approved_by,
            ) || null
          : null;

      const publishedByProfile =
        decision.published_by
          ? profilesById.get(
              decision
                .published_by,
            ) || null
          : null;

      return {
        ...decision,

        recommended_by_profile:
          recommendedByProfile,

        recommended_by_name:
          getProfileDisplayName(
            recommendedByProfile,
          ),

        approved_by_profile:
          approvedByProfile,

        approved_by_name:
          getProfileDisplayName(
            approvedByProfile,
          ),

        published_by_profile:
          publishedByProfile,

        published_by_name:
          getProfileDisplayName(
            publishedByProfile,
          ),
      };
    },
  );
}

async function enrichDecisionProfile(
  decision,
) {
  if (!decision) {
    return null;
  }

  const [
    enrichedDecision,
  ] = await enrichDecisionProfiles([
    decision,
  ]);

  return (
    enrichedDecision ||
    decision
  );
}

export async function getDecisions(
  filters = {},
) {
  console.log(
    "[Decision] getDecisions called",
    filters,
  );
  const pagedResult =
    await getPagedRecords({
      table:
        AdmissionsTable.DECISIONS,

      filters,

      searchColumns: [
        "decision",
        "decision_reason",
        "conditions",
        "review_summary",
        "internal_notes",
      ],

      allowedSortColumns: [
        "created_at",
        "updated_at",
        "status",
        "decision",
        "recommended_at",
        "approved_at",
        "published_at",
        "effective_on",
        "expires_on",
      ],

      operation:
        "getDecisions",

      fallbackMessage:
        "Unable to load admission decisions.",
    });

  const enrichedData =
    await enrichDecisionProfiles(
      pagedResult?.items,
    );

  return {
    ...pagedResult,
    data:
      enrichedData,
  };
}

export async function getDecision(id) {
  console.log(
    "[Decision] getDecision called",
    id,
  );
  const decision =
    await getSingleRecord({
      table:
        AdmissionsTable.DECISIONS,

      id,

      operation:
        "getDecision",

      fallbackMessage:
        "Unable to load the admission decision.",
    });

  return enrichDecisionProfile(
    decision,
  );
}
export async function createDecision(
  payload,
) {
  const {
    data,
    error,
  } = await supabase
    .from(AdmissionsTable.DECISIONS)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation:
        "createDecision",
      table:
        AdmissionsTable.DECISIONS,
      fallbackMessage:
        "Unable to create the admission decision.",
    });
  }

  return data;
}

export async function updateDecision(
  id,
  updates,
) {
  const {
    data,
    error,
  } = await supabase
    .from(AdmissionsTable.DECISIONS)
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation:
        "updateDecision",
      table:
        AdmissionsTable.DECISIONS,
      fallbackMessage:
        "Unable to update the admission decision.",
    });
  }

  return data;
}

export async function getOffers(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.OFFERS,
    filters,
    searchColumns: [
      "offer_number",
      "entry_grade_level",
      "conditions",
      "offer_message",
      "internal_notes",
    ],
    allowedSortColumns: [
      "created_at",
      "updated_at",
      "offer_number",
      "status",
      "offered_on",
      "expires_at",
      "sent_at",
      "responded_at",
    ],
    operation: "getOffers",
    fallbackMessage:
      "Unable to load admission offers.",
  });
}

export async function getOffer(id) {
  return getSingleRecord({
    table: AdmissionsTable.OFFERS,
    id,
    operation: "getOffer",
    fallbackMessage:
      "Unable to load the admission offer.",
  });
}
export async function createOffer(
  payload,
) {
  const {
    data,
    error,
  } = await supabase
    .from(AdmissionsTable.OFFERS)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation:
        "createOffer",
      table:
        AdmissionsTable.OFFERS,
      fallbackMessage:
        "Unable to create the admission offer.",
    });
  }

  return data;
}

export async function updateOffer(
  id,
  updates,
) {
  const {
    data,
    error,
  } = await supabase
    .from(AdmissionsTable.OFFERS)
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation:
        "updateOffer",
      table:
        AdmissionsTable.OFFERS,
      fallbackMessage:
        "Unable to update the admission offer.",
    });
  }

  return data;
}

export async function getStatusHistory(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.STATUS_HISTORY,
    filters,
    searchColumns: [
      "entity_type",
      "previous_status",
      "new_status",
      "transition_reason",
      "transition_notes",
    ],
    allowedSortColumns: [
      "created_at",
      "changed_at",
      "entity_type",
      "new_status",
    ],
    configureQuery: (
      query,
      currentFilters,
    ) => {
      let nextQuery = query;

      nextQuery = applyExactFilter(
        nextQuery,
        "entity_type",
        currentFilters.entityType,
      );

      nextQuery = applyExactFilter(
        nextQuery,
        "entity_id",
        currentFilters.entityId,
      );

      nextQuery = applyExactFilter(
        nextQuery,
        "inquiry_id",
        currentFilters.inquiryId,
      );

      return nextQuery;
    },
    operation: "getStatusHistory",
    fallbackMessage:
      "Unable to load admissions status history.",
  });
}

export async function createStatusHistory(
  payload,
) {
  const { data, error } = await supabase
    .from(
      AdmissionsTable.STATUS_HISTORY,
    )
    .insert(payload)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation:
        "createStatusHistory",
      table:
        AdmissionsTable.STATUS_HISTORY,
      fallbackMessage:
        "Unable to create status history.",
    });
  }

  return data;
}

export async function getEnrollmentConversions(
  filters = {},
) {
  return getPagedRecords({
    table:
      AdmissionsTable.ENROLLMENT_CONVERSIONS,
    filters,
    searchColumns: [
      "target_grade_level",
      "failure_reason",
      "cancellation_reason",
      "reversal_reason",
    ],
    allowedSortColumns: [
      "created_at",
      "updated_at",
      "requested_at",
      "processing_started_at",
      "completed_at",
      "status",
      "enrollment_start_date",
    ],
    operation:
      "getEnrollmentConversions",
    fallbackMessage:
      "Unable to load enrollment conversions.",
  });
}

export async function getEnrollmentConversion(
  id,
) {
  return getSingleRecord({
    table:
      AdmissionsTable.ENROLLMENT_CONVERSIONS,
    id,
    operation:
      "getEnrollmentConversion",
    fallbackMessage:
      "Unable to load the enrollment conversion.",
  });
}

async function countRows({
  table,
  filters = [],
  operation,
  fallbackMessage,
}) {
  let query = supabase
    .from(table)
    .select("id", {
      count: "exact",
      head: true,
    })
    .is("deleted_at", null);

  filters.forEach(
    ({
      column,
      value,
      operator = "eq",
    }) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      query = query[operator](
        column,
        value,
      );
    },
  );

  const {
    count,
    error,
  } = await query;

  if (error) {
    throwRepositoryError({
      error,
      operation,
      table,
      fallbackMessage,
    });
  }

  return count || 0;
}

export async function getDashboardMetrics({
  schoolId,
  campusId,
  admissionCycleId,
} = {}) {
  const commonFilters = [
    {
      column: "school_id",
      value: schoolId,
    },
    {
      column: "campus_id",
      value: campusId,
    },
    {
      column: "admission_cycle_id",
      value: admissionCycleId,
    },
  ];

  const [
    activeCycles,
    openInquiries,
    totalApplicants,
    openApplications,
    pendingDocuments,
    upcomingInterviews,
    pendingDecisions,
    openOffers,
    completedEnrollments,
  ] = await Promise.all([
    countRows({
      table: AdmissionsTable.CYCLES,
      filters: [
        {
          column: "school_id",
          value: schoolId,
        },
        {
          column: "campus_id",
          value: campusId,
        },
        {
          column: "status",
          value: "open",
        },
      ],
      operation: "countActiveCycles",
      fallbackMessage:
        "Unable to count active admission cycles.",
    }),

    countRows({
      table: AdmissionsTable.INQUIRIES,
      filters: [
        ...commonFilters,
        {
          column: "status",
          value: [
            "new",
            "contacted",
            "qualified",
          ],
          operator: "in",
        },
      ],
      operation: "countOpenInquiries",
      fallbackMessage:
        "Unable to count open inquiries.",
    }),

    countRows({
      table: AdmissionsTable.APPLICANTS,
      filters: [
        {
          column: "school_id",
          value: schoolId,
        },
        {
          column: "campus_id",
          value: campusId,
        },
      ],
      operation: "countApplicants",
      fallbackMessage:
        "Unable to count applicants.",
    }),

    countRows({
      table: AdmissionsTable.APPLICATIONS,
      filters: [
        ...commonFilters,
        {
          column: "status",
          value: [
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
          operator: "in",
        },
      ],
      operation: "countOpenApplications",
      fallbackMessage:
        "Unable to count open applications.",
    }),

    countRows({
      table: AdmissionsTable.DOCUMENTS,
      filters: [
        {
          column: "school_id",
          value: schoolId,
        },
        {
          column: "status",
          value: [
            "missing",
            "requested",
            "uploaded",
            "under_review",
            "rejected",
            "expired",
          ],
          operator: "in",
        },
      ],
      operation:
        "countPendingDocuments",
      fallbackMessage:
        "Unable to count pending documents.",
    }),

    countRows({
      table: AdmissionsTable.INTERVIEWS,
      filters: [
        {
          column: "school_id",
          value: schoolId,
        },
        {
          column: "campus_id",
          value: campusId,
        },
        {
          column: "status",
          value: [
            "scheduled",
            "confirmed",
            "reschedule_required",
          ],
          operator: "in",
        },
      ],
      operation:
        "countUpcomingInterviews",
      fallbackMessage:
        "Unable to count upcoming interviews.",
    }),

    countRows({
      table: AdmissionsTable.DECISIONS,
      filters: [
        ...commonFilters,
        {
          column: "status",
          value: [
            "draft",
            "pending_approval",
            "approved",
          ],
          operator: "in",
        },
      ],
      operation:
        "countPendingDecisions",
      fallbackMessage:
        "Unable to count pending decisions.",
    }),

    countRows({
      table: AdmissionsTable.OFFERS,
      filters: [
        ...commonFilters,
        {
          column: "status",
          value: [
            "draft",
            "pending_approval",
            "approved",
            "sent",
            "viewed",
            "accepted",
          ],
          operator: "in",
        },
      ],
      operation: "countOpenOffers",
      fallbackMessage:
        "Unable to count open offers.",
    }),

    countRows({
      table:
        AdmissionsTable.ENROLLMENT_CONVERSIONS,
      filters: [
        ...commonFilters,
        {
          column: "status",
          value: "completed",
        },
      ],
      operation:
        "countCompletedEnrollments",
      fallbackMessage:
        "Unable to count completed enrollments.",
    }),
  ]);

  const conversionRate =
    totalApplicants > 0
      ? Number(
          (
            completedEnrollments /
            totalApplicants
          ).toFixed(4),
        )
      : 0;

  return {
    activeCycles,
    openInquiries,
    totalApplicants,
    openApplications,
    pendingDocuments,
    upcomingInterviews,
    pendingDecisions,
    openOffers,
    completedEnrollments,
    conversionRate,
  };
}

export async function createAdmissionCycle(payload) {
  const { data, error } = await supabase
    .from(AdmissionsTable.CYCLES)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throwRepositoryError({
      error,
      operation: "createAdmissionCycle",
      table: AdmissionsTable.CYCLES,
      fallbackMessage:
        "Unable to create admission cycle.",
    });
  }

  return data;
}

export const admissionsRepository = Object.freeze({
  createAdmissionCycle,
  updateAdmissionCycle,
  archiveAdmissionCycle,
  deleteAdmissionCycle,

  getAdmissionCycles,
  getAdmissionCycle,

  createInquiry,
  updateInquiry,
  convertInquiryToApplicant,

  getInquiries,
  getInquiry,

  getProfilesByIds,


  getApplicants,
  getApplicant,

  createApplicant,
  updateApplicant,


  getGuardians,
  getGuardian,

  getApplicantGuardians,

  createApplication,
  updateApplication,

  getApplications,
  getApplication,

  getAdmissionDocumentRequirements,
  getAdmissionDocumentRequirement,

  createAdmissionDocumentRequirement,
  updateAdmissionDocumentRequirement,
  archiveAdmissionDocumentRequirement,
  deleteAdmissionDocumentRequirement,

  getApplicationDocuments,
  getApplicationDocument,

  createApplicationDocument,
  updateApplicationDocument,
  deleteApplicationDocument,

  getInterviews,
  getInterview,

  getDecisions,
  getDecision,

  createDecision,
  updateDecision,

  getOffers,
  getOffer,

  createOffer,
  updateOffer,

  getStatusHistory,
  createStatusHistory,

  getEnrollmentConversions,
  getEnrollmentConversion,

  getDashboardMetrics,
});
