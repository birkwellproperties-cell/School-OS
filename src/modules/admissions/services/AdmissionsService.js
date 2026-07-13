import {
  admissionsRepository,
} from "../api";

function requireIdentifier(value, label) {
  if (!value) {
    throw new Error(`${label} is required.`);
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
    campusId: campusId || undefined,
    admissionCycleId:
      admissionCycleId || undefined,
  };
}

function mergeScope(scope, filters = {}) {
  return {
    ...filters,
    organizationId: scope.organizationId,
    schoolId: scope.schoolId,
    campusId:
      filters.campusId ??
      scope.campusId,
    admissionCycleId:
      filters.admissionCycleId ??
      scope.admissionCycleId,
  };
}

export class AdmissionsService {
  constructor({
    repository = admissionsRepository,
    scope = {},
  } = {}) {
    this.repository = repository;
    this.scope =
      normalizeWorkspaceScope(scope);
  }

  withScope(scope) {
    return new AdmissionsService({
      repository: this.repository,
      scope,
    });
  }

  getWorkspaceScope() {
    return {
      ...this.scope,
    };
  }

  async getAdmissionCycles(filters = {}) {
    return this.repository.getAdmissionCycles(
      mergeScope(this.scope, filters),
    );
  }

  async getAdmissionCycle(id) {
    requireIdentifier(
      id,
      "Admission cycle id",
    );

    return this.repository.getAdmissionCycle(id);
  }

  async getInquiries(filters = {}) {
    return this.repository.getInquiries(
      mergeScope(this.scope, filters),
    );
  }

  async getInquiry(id) {
    requireIdentifier(id, "Inquiry id");

    return this.repository.getInquiry(id);
  }

  async getApplicants(filters = {}) {
    return this.repository.getApplicants(
      mergeScope(this.scope, filters),
    );
  }

  async getApplicant(id) {
    requireIdentifier(id, "Applicant id");

    return this.repository.getApplicant(id);
  }

  async getGuardians(filters = {}) {
    return this.repository.getGuardians(
      mergeScope(this.scope, filters),
    );
  }

  async getGuardian(id) {
    requireIdentifier(id, "Guardian id");

    return this.repository.getGuardian(id);
  }

  async getApplicantGuardians(
    applicantId,
    filters = {},
  ) {
    requireIdentifier(
      applicantId,
      "Applicant id",
    );

    return this.repository.getApplicantGuardians(
      mergeScope(this.scope, {
        ...filters,
        applicantId,
      }),
    );
  }

  async getApplications(filters = {}) {
    return this.repository.getApplications(
      mergeScope(this.scope, filters),
    );
  }

  async getApplication(id) {
    requireIdentifier(id, "Application id");

    return this.repository.getApplication(id);
  }

  async getApplicationDocuments(
    applicationId,
    filters = {},
  ) {
    requireIdentifier(
      applicationId,
      "Application id",
    );

    return this.repository.getApplicationDocuments(
      mergeScope(this.scope, {
        ...filters,
        applicationId,
      }),
    );
  }

  async getInterviews(filters = {}) {
    return this.repository.getInterviews(
      mergeScope(this.scope, filters),
    );
  }

  async getInterview(id) {
    requireIdentifier(id, "Interview id");

    return this.repository.getInterview(id);
  }

  async getDecisions(filters = {}) {
    return this.repository.getDecisions(
      mergeScope(this.scope, filters),
    );
  }

  async getDecision(id) {
    requireIdentifier(id, "Decision id");

    return this.repository.getDecision(id);
  }

  async getOffers(filters = {}) {
    return this.repository.getOffers(
      mergeScope(this.scope, filters),
    );
  }

  async getOffer(id) {
    requireIdentifier(id, "Offer id");

    return this.repository.getOffer(id);
  }

  async getStatusHistory(filters = {}) {
    return this.repository.getStatusHistory(
      mergeScope(this.scope, filters),
    );
  }

  async getEnrollmentConversions(
    filters = {},
  ) {
    return this.repository
      .getEnrollmentConversions(
        mergeScope(this.scope, filters),
      );
  }

  async getEnrollmentConversion(id) {
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
        schoolId: this.scope.schoolId,
        campusId:
          overrides.campusId ??
          this.scope.campusId,
        admissionCycleId:
          overrides.admissionCycleId ??
          this.scope.admissionCycleId,
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
      this.scope.admissionCycleId;

    const [
      metrics,
      recentInquiries,
      priorityApplications,
      upcomingInterviews,
    ] = await Promise.all([
      this.getDashboardMetrics({
        admissionCycleId: cycleOverride,
      }),

      this.getInquiries({
        admissionCycleId: cycleOverride,
        page: 1,
        pageSize: inquiryLimit,
        sortBy: "created_at",
        ascending: false,
      }),

      this.getApplications({
        admissionCycleId: cycleOverride,
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
        pageSize: applicationLimit,
        sortBy: "submitted_at",
        ascending: false,
      }),

      this.getInterviews({
        statuses: [
          "scheduled",
          "confirmed",
          "reschedule_required",
        ],
        dateColumn: "scheduled_start_at",
        dateFrom: new Date().toISOString(),
        page: 1,
        pageSize: interviewLimit,
        sortBy: "scheduled_start_at",
        ascending: true,
      }),
    ]);

    return {
      metrics,
      recentInquiries,
      priorityApplications,
      upcomingInterviews,
      loadedAt: new Date().toISOString(),
    };
  }
}

export function createAdmissionsService(scope) {
  return new AdmissionsService({
    scope,
  });
}
