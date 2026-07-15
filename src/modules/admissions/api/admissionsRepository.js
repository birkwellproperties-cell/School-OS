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

  configureQuery,
  operation,
  fallbackMessage,
}) {
  const pagination =
    normalizePagination(filters);

  let query = supabase
    .from(table)
    .select(select, {
      count: "exact",
    })
    .is("deleted_at", null);

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
    normalizePagination(filters);

  let query = supabase
    .from(table)
    .select(select, {
      count: "exact",
    });

  if (includeDeletedFilter) {
    query = query.is(
      "deleted_at",
      null,
    );
  }

  if (supportedFilters.organizationId) {
    query = applyExactFilter(
      query,
      "organization_id",
      filters.organizationId,
    );
  }

  if (supportedFilters.schoolId) {
    query = applyExactFilter(
      query,
      "school_id",
      filters.schoolId,
    );
  }

  if (supportedFilters.campusId) {
    query = applyExactFilter(
      query,
      "campus_id",
      filters.campusId,
    );
  }

  if (supportedFilters.admissionCycleId) {
    query = applyExactFilter(
      query,
      "admission_cycle_id",
      filters.admissionCycleId,
    );
  }

  if (supportedFilters.applicantId) {
    query = applyExactFilter(
      query,
      "applicant_id",
      filters.applicantId,
    );
  }

  if (supportedFilters.applicationId) {
    query = applyExactFilter(
      query,
      "application_id",
      filters.applicationId,
    );
  }

  if (supportedFilters.assignedTo) {
    query = applyExactFilter(
      query,
      "assigned_to",
      filters.assignedTo,
    );
  }

  if (supportedFilters.assignedReviewerId) {
    query = applyExactFilter(
      query,
      "assigned_reviewer_id",
      filters.assignedReviewerId,
    );
  }

  if (supportedFilters.leadInterviewerId) {
    query = applyExactFilter(
      query,
      "lead_interviewer_id",
      filters.leadInterviewerId,
    );
  }

  if (supportedFilters.decisionId) {
    query = applyExactFilter(
      query,
      "decision_id",
      filters.decisionId,
    );
  }

  if (supportedFilters.offerId) {
    query = applyExactFilter(
      query,
      "offer_id",
      filters.offerId,
    );
  }

  if (supportedFilters.priority) {
    query = applyExactFilter(
      query,
      "priority",
      filters.priority,
    );
  }

  if (supportedFilters.status) {
    query = applyExactFilter(
      query,
      "status",
      filters.status,
    );
  }

  if (supportedFilters.statuses) {
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
      from: filters.dateFrom,
      to: filters.dateTo,
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
  query = applySearch(
    query,
    filters.search,
    searchColumns,
  );

  query = applyDateRange(
    query,
    filters.dateColumn || "created_at",
    {
      from: filters.dateFrom,
      to: filters.dateTo,
    },
  );

  if (typeof configureQuery === "function") {
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

export async function getDecisions(
  filters = {},
) {
  return getPagedRecords({
    table: AdmissionsTable.DECISIONS,
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
    operation: "getDecisions",
    fallbackMessage:
      "Unable to load admission decisions.",
  });
}

export async function getDecision(id) {
  return getSingleRecord({
    table: AdmissionsTable.DECISIONS,
    id,
    operation: "getDecision",
    fallbackMessage:
      "Unable to load the admission decision.",
  });
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

  getApplicationDocuments,
  getApplicationDocument,

  createApplicationDocument,
  updateApplicationDocument,
  deleteApplicationDocument,

  getInterviews,
  getInterview,

  getDecisions,
  getDecision,

  getOffers,
  getOffer,

  getStatusHistory,
  createStatusHistory,

  getEnrollmentConversions,
  getEnrollmentConversion,

  getDashboardMetrics,
});