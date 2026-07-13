export const AdmissionCycleStatus = Object.freeze({
  DRAFT: "draft",
  OPEN: "open",
  CLOSED: "closed",
  ARCHIVED: "archived",
});

export const InquiryStatus = Object.freeze({
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  UNQUALIFIED: "unqualified",
  CONVERTED: "converted",
  CLOSED: "closed",
});

export const ApplicantStatus = Object.freeze({
  PROSPECT: "prospect",
  APPLICANT: "applicant",
  OFFERED: "offered",
  ACCEPTED: "accepted",
  ENROLLED: "enrolled",
  WITHDRAWN: "withdrawn",
  ARCHIVED: "archived",
});

export const ApplicationStatus = Object.freeze({
  DRAFT: "draft",
  SUBMITTED: "submitted",
  DOCUMENTS_PENDING: "documents_pending",
  UNDER_REVIEW: "under_review",
  ASSESSMENT_PENDING: "assessment_pending",
  INTERVIEW_PENDING: "interview_pending",
  DECISION_PENDING: "decision_pending",
  APPROVED: "approved",
  WAITLISTED: "waitlisted",
  REJECTED: "rejected",
  OFFER_SENT: "offer_sent",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_DECLINED: "offer_declined",
  ENROLLED: "enrolled",
  WITHDRAWN: "withdrawn",
  CANCELLED: "cancelled",
});

export const ApplicationPriority = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
});

export const DocumentStatus = Object.freeze({
  MISSING: "missing",
  REQUESTED: "requested",
  UPLOADED: "uploaded",
  UNDER_REVIEW: "under_review",
  VERIFIED: "verified",
  REJECTED: "rejected",
  EXPIRED: "expired",
  WAIVED: "waived",
});

export const InterviewStatus = Object.freeze({
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  RESCHEDULE_REQUIRED: "reschedule_required",
});

export const DecisionStatus = Object.freeze({
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  PUBLISHED: "published",
  SUPERSEDED: "superseded",
  WITHDRAWN: "withdrawn",
});

export const AdmissionDecision = Object.freeze({
  APPROVED: "approved",
  CONDITIONALLY_APPROVED: "conditionally_approved",
  WAITLISTED: "waitlisted",
  REJECTED: "rejected",
  DEFERRED: "deferred",
  ADDITIONAL_REVIEW: "additional_review",
});

export const OfferStatus = Object.freeze({
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  SENT: "sent",
  VIEWED: "viewed",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  EXPIRED: "expired",
  WITHDRAWN: "withdrawn",
  SUPERSEDED: "superseded",
});

export const EnrollmentConversionStatus = Object.freeze({
  PENDING: "pending",
  VALIDATING: "validating",
  READY: "ready",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REVERSED: "reversed",
});
