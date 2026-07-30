import {
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FilePlus2,
  FileText,
  History,
  Loader2,
  MessageSquareText,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  getAdmissionStatusLabel,
} from "../constants";

import {
  useAdmissions,
} from "../hooks";

import {
  createApplicationDocumentSignedUrl,
  downloadApplicationDocumentFile,
} from "../services";

import DocumentUploaderDialog
  from "./DocumentUploaderDialog";

const EMPTY_REVIEW_DIALOG = {
  open: false,
  action: null,
  document: null,
  reason: "",
  notes: "",
  error: "",
};

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatFileSize(value) {
  const bytes = Number(value);

  if (
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return "Not available";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatReviewer(value) {
  if (!value) {
    return "Not recorded";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value.full_name ||
    value.display_name ||
    value.preferred_name ||
    value.email ||
    value.id ||
    "Recorded reviewer"
  );
}

function DocumentStatusBadge({
  status,
}) {
  const tone =
    status === "verified"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "uploaded" ||
          status === "under_review"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : status === "rejected" ||
            status === "expired"
          ? "border-red-200 bg-red-50 text-red-700"
          : status === "waived"
            ? "border-slate-200 bg-slate-100 text-slate-700"
            : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        tone,
      ].join(" ")}
    >
      {getAdmissionStatusLabel(
        status,
      )}
    </span>
  );
}

function RequirementBadge({
  status,
}) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
      {getAdmissionStatusLabel(
        status,
      )}
    </span>
  );
}

function getDocumentIcon(
  status,
) {
  if (status === "verified") {
    return CheckCircle2;
  }

  if (
    status === "uploaded" ||
    status === "under_review"
  ) {
    return Clock3;
  }

  if (
    status === "rejected" ||
    status === "expired"
  ) {
    return AlertCircle;
  }

  return FileText;
}

function getReviewDialogContent(
  action,
) {
  switch (action) {
    case "verify":
      return {
        title: "Verify document",
        description:
          "Confirm that this document is valid and meets the application requirement.",
        confirmLabel:
          "Verify document",
        confirmTone:
          "bg-emerald-600 hover:bg-emerald-500",
        Icon: BadgeCheck,
        requiresReason: false,
        showsNotes: true,
      };

    case "reject":
      return {
        title: "Reject document",
        description:
          "Provide the reason this document cannot be accepted.",
        confirmLabel:
          "Reject document",
        confirmTone:
          "bg-red-600 hover:bg-red-500",
        Icon: Ban,
        requiresReason: true,
        showsNotes: true,
      };

    case "request_replacement":
      return {
        title:
          "Request replacement",
        description:
          "Explain why a new version of this document is required.",
        confirmLabel:
          "Request replacement",
        confirmTone:
          "bg-amber-600 hover:bg-amber-500",
        Icon: RotateCcw,
        requiresReason: true,
        showsNotes: false,
      };

    default:
      return {
        title:
          "Review document",
        description:
          "Complete the document review action.",
        confirmLabel:
          "Continue",
        confirmTone:
          "bg-indigo-600 hover:bg-indigo-500",
        Icon: FileCheck2,
        requiresReason: false,
        showsNotes: false,
      };
  }
}

function ReviewActionDialog({
  state,
  loading,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!state.open) {
    return null;
  }

  const content =
    getReviewDialogContent(
      state.action,
    );

  const Icon = content.Icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-review-dialog-title"
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <Icon
                size={20}
                aria-hidden="true"
              />
            </div>

            <div>
              <h3
                id="document-review-dialog-title"
                className="text-lg font-black text-slate-950"
              >
                {content.title}
              </h3>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                {content.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close review dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              size={18}
              aria-hidden="true"
            />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 px-6 py-6"
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Selected document
            </p>

            <p className="mt-2 font-black text-slate-900">
              {state.document
                ?.document_label ||
                state.document
                  ?.document_type ||
                "Application document"}
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-500">
              {state.document
                ?.file_name ||
                "No file name recorded"}
            </p>
          </div>

          {content.requiresReason && (
            <label className="block">
              <span className="text-sm font-black text-slate-800">
                Reason
                <span className="text-red-600">
                  {" "}
                  *
                </span>
              </span>

              <textarea
                value={state.reason}
                onChange={(event) =>
                  onChange({
                    reason:
                      event.target
                        .value,
                    error: "",
                  })
                }
                rows={4}
                autoFocus
                disabled={loading}
                placeholder={
                  state.action ===
                  "reject"
                    ? "Explain why the document is being rejected."
                    : "Explain why a replacement is required."
                }
                className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>
          )}

          {content.showsNotes && (
            <label className="block">
              <span className="text-sm font-black text-slate-800">
                Review notes
                <span className="ml-2 text-xs font-semibold text-slate-400">
                  Optional
                </span>
              </span>

              <textarea
                value={state.notes}
                onChange={(event) =>
                  onChange({
                    notes:
                      event.target
                        .value,
                    error: "",
                  })
                }
                rows={4}
                autoFocus={
                  !content.requiresReason
                }
                disabled={loading}
                placeholder="Add internal reviewer notes."
                className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>
          )}

          {state.error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <p className="font-black text-red-800">
                Review action failed
              </p>

              <p className="mt-1 text-sm font-semibold text-red-700">
                {state.error}
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={[
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                content.confirmTone,
              ].join(" ")}
            >
              {loading ? (
                <Loader2
                  size={16}
                  aria-hidden="true"
                  className="animate-spin"
                />
              ) : (
                <Icon
                  size={16}
                  aria-hidden="true"
                />
              )}

              {loading
                ? "Saving..."
                : content.confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewerActionPanel({
  document,
  loading,
  lastAction,
  onStartReview,
  onOpenDialog,
}) {
  const status =
    document.status;

  const canStartReview = [
    "uploaded",
    "rejected",
    "requested",
  ].includes(status);

  const canVerify = [
    "uploaded",
    "under_review",
    "rejected",
  ].includes(status);

  const canReject = [
    "uploaded",
    "under_review",
    "verified",
  ].includes(status);

  const canRequestReplacement = [
    "uploaded",
    "under_review",
    "verified",
    "rejected",
  ].includes(status);

  return (
    <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <ShieldCheck
            size={18}
            aria-hidden="true"
          />
        </div>

        <div>
          <p className="font-black text-slate-950">
            Reviewer actions
          </p>

          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
            Review, verify, reject, or
            request a replacement for
            the selected document.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStartReview}
          disabled={
            loading ||
            !canStartReview
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-xs font-black text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading &&
          lastAction ===
            "under_review" ? (
            <Loader2
              size={14}
              aria-hidden="true"
              className="animate-spin"
            />
          ) : (
            <PlayCircle
              size={14}
              aria-hidden="true"
            />
          )}

          {status === "under_review"
            ? "Under review"
            : "Start review"}
        </button>

        <button
          type="button"
          onClick={() =>
            onOpenDialog(
              "verify",
            )
          }
          disabled={
            loading ||
            !canVerify
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BadgeCheck
            size={14}
            aria-hidden="true"
          />

          Verify
        </button>

        <button
          type="button"
          onClick={() =>
            onOpenDialog(
              "reject",
            )
          }
          disabled={
            loading ||
            !canReject
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Ban
            size={14}
            aria-hidden="true"
          />

          Reject
        </button>

        <button
          type="button"
          onClick={() =>
            onOpenDialog(
              "request_replacement",
            )
          }
          disabled={
            loading ||
            !canRequestReplacement
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-xs font-black text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw
            size={14}
            aria-hidden="true"
          />

          Request replacement
        </button>
      </div>
    </div>
  );
}

function VerificationHistory({
  document,
  reviewerProfilesById,
}) {
  const hasVerification =
    Boolean(
      document.verified_at ||
        document.verified_by,
    );

  const hasRejection =
    Boolean(
      document.rejected_at ||
        document.rejected_by ||
        document.rejection_reason,
    );

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <History
            size={18}
            aria-hidden="true"
          />
        </div>

        <div>
          <p className="font-black text-slate-950">
            Verification history
          </p>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Recorded reviewer and
            decision details.
          </p>
        </div>
      </div>

      {!hasVerification &&
      !hasRejection ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">
            No verification or
            rejection decision has
            been recorded.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {hasVerification && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <BadgeCheck
                  size={16}
                  aria-hidden="true"
                />

                <p className="text-xs font-black uppercase tracking-[0.1em]">
                  Verification
                </p>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <UserRound
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />

                  <p className="font-semibold text-emerald-800">
                    <span className="font-black">
                      Reviewer:
                    </span>{" "}
                    {formatReviewer(
                      reviewerProfilesById?.[
                        document.verified_by
                      ] ||
                        document.verified_by,
                    )}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <Clock3
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />

                  <p className="font-semibold text-emerald-800">
                    <span className="font-black">
                      Verified:
                    </span>{" "}
                    {formatDateTime(
                      document.verified_at,
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasRejection && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-800">
                <Ban
                  size={16}
                  aria-hidden="true"
                />

                <p className="text-xs font-black uppercase tracking-[0.1em]">
                  Rejection
                </p>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <UserRound
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-red-700"
                  />

                  <p className="font-semibold text-red-800">
                    <span className="font-black">
                      Reviewer:
                    </span>{" "}
                    {formatReviewer(
                      reviewerProfilesById?.[
                        document.rejected_by
                      ] ||
                        document.rejected_by,
                    )}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <Clock3
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-red-700"
                  />

                  <p className="font-semibold text-red-800">
                    <span className="font-black">
                      Rejected:
                    </span>{" "}
                    {formatDateTime(
                      document.rejected_at,
                    )}
                  </p>
                </div>

                {document.rejection_reason && (
                  <div className="flex items-start gap-2">
                    <MessageSquareText
                      size={15}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-red-700"
                    />

                    <p className="font-semibold leading-6 text-red-800">
                      <span className="font-black">
                        Reason:
                      </span>{" "}
                      {
                        document.rejection_reason
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentAuditTimeline({
  document,
}) {
  const events = useMemo(() => {
    const nextEvents = [];

    if (
      document.created_at ||
      document.uploaded_at
    ) {
      nextEvents.push({
        key: "uploaded",
        label: "Document uploaded",
        description:
          document.file_name ||
          "Document metadata created.",
        timestamp:
          document.uploaded_at ||
          document.created_at,
        tone:
          "border-blue-200 bg-blue-50 text-blue-700",
      });
    }

    if (
      document.status ===
      "under_review"
    ) {
      nextEvents.push({
        key: "under_review",
        label:
          "Review in progress",
        description:
          "The document is currently under reviewer assessment.",
        timestamp:
          document.updated_at,
        tone:
          "border-indigo-200 bg-indigo-50 text-indigo-700",
      });
    }

    if (
      document.rejected_at ||
      document.rejected_by
    ) {
      nextEvents.push({
        key: "rejected",
        label:
          "Document rejected",
        description:
          document.rejection_reason ||
          "The document did not meet the requirement.",
        timestamp:
          document.rejected_at,
        tone:
          "border-red-200 bg-red-50 text-red-700",
      });
    }

    if (
      document.status ===
      "requested"
    ) {
      nextEvents.push({
        key: "requested",
        label:
          "Replacement requested",
        description:
          "A replacement version of this document is required.",
        timestamp:
          document.updated_at,
        tone:
          "border-amber-200 bg-amber-50 text-amber-700",
      });
    }

    if (
      document.verified_at ||
      document.status ===
        "verified"
    ) {
      nextEvents.push({
        key: "verified",
        label:
          "Document verified",
        description:
          "The document was accepted as meeting the application requirement.",
        timestamp:
          document.verified_at ||
          document.updated_at,
        tone:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      });
    }

    if (
      document.status === "waived"
    ) {
      nextEvents.push({
        key: "waived",
        label:
          "Requirement waived",
        description:
          "The document requirement was waived.",
        timestamp:
          document.updated_at,
        tone:
          "border-slate-200 bg-slate-100 text-slate-700",
      });
    }

    return nextEvents;
  }, [
    document,
  ]);

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
          <History
            size={18}
            aria-hidden="true"
          />
        </div>

        <div>
          <p className="font-black text-slate-950">
            Document audit timeline
          </p>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Current lifecycle events
            recorded on this document.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-0">
        {events.map(
          (
            event,
            index,
          ) => (
            <div
              key={event.key}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {index <
                events.length -
                  1 && (
                <div className="absolute left-[17px] top-9 h-[calc(100%-1rem)] w-px bg-slate-300" />
              )}

              <div
                className={[
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  event.tone,
                ].join(" ")}
              >
                <CheckCircle2
                  size={15}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 pt-1">
                <p className="text-sm font-black text-slate-900">
                  {event.label}
                </p>

                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  {event.description}
                </p>

                <p className="mt-1 text-xs font-black text-slate-400">
                  {formatDateTime(
                    event.timestamp,
                  )}
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default function ApplicationDocuments() {
  const {
    applicationDocuments,
    reviewerProfilesById,

    documentRequirementItems,
    activeDocumentRequirements,
    documentRequirementsLoading,
    documentRequirementsError,

    selectedApplicationDocumentId,
    selectedApplicationDocument,

    applicationDocumentsLoading,
    applicationDocumentsError,

    canUploadApplicationDocuments,
    canReviewApplicationDocuments,

    documentMutationLoading,

    documentReviewLoading,
    documentReviewError,
    lastDocumentReviewAction,

    refreshApplicationDocuments,
    refreshDocumentRequirements,

    selectApplicationDocument,

    markApplicationDocumentUnderReview,
    verifyApplicationDocument,
    rejectApplicationDocument,
    requestApplicationDocumentReplacement,

    clearDocumentReviewError,
  } = useAdmissions();

  const [
    uploaderOpen,
    setUploaderOpen,
  ] = useState(false);

  const [
    uploadRequirement,
    setUploadRequirement,
  ] = useState(null);

  const [
    reviewDialog,
    setReviewDialog,
  ] = useState(
    EMPTY_REVIEW_DIALOG,
  );

  const [
    localReviewError,
    setLocalReviewError,
  ] = useState("");

  const [
    fileActionLoading,
    setFileActionLoading,
  ] = useState({
    documentId: null,
    action: null,
  });

  const [
    fileActionError,
    setFileActionError,
  ] = useState("");

  const documents =
    applicationDocuments.items || [];

  const requirements =
    activeDocumentRequirements ||
    documentRequirementItems ||
    [];

  const documentsByRequirementId =
    useMemo(() => {
      const map = new Map();

      documents.forEach(
        (document) => {
          if (!document.requirement_id) {
            return;
          }

          const current =
            map.get(
              document.requirement_id,
            ) || [];

          current.push(document);

          map.set(
            document.requirement_id,
            current,
          );
        },
      );

      map.forEach(
        (requirementDocuments) => {
          requirementDocuments.sort(
            (left, right) => {
              const leftDate =
                new Date(
                  left.uploaded_at ||
                    left.created_at ||
                    0,
                ).getTime();

              const rightDate =
                new Date(
                  right.uploaded_at ||
                    right.created_at ||
                    0,
                ).getTime();

              return (
                rightDate -
                leftDate
              );
            },
          );
        },
      );

      return map;
    }, [
      documents,
    ]);

  const checklistItems =
    useMemo(
      () =>
        requirements
          .filter(
            (requirement) =>
              requirement?.is_active !==
                false &&
              !requirement?.deleted_at,
          )
          .slice()
          .sort(
            (left, right) => {
              const orderDifference =
                Number(
                  left.display_order ||
                    0,
                ) -
                Number(
                  right.display_order ||
                    0,
                );

              if (
                orderDifference !== 0
              ) {
                return orderDifference;
              }

              return String(
                left.document_label ||
                  "",
              ).localeCompare(
                String(
                  right.document_label ||
                    "",
                ),
              );
            },
          )
          .map(
            (requirement) => {
              const matchedDocuments =
                documentsByRequirementId.get(
                  requirement.id,
                ) || [];

              const currentDocument =
                matchedDocuments[0] ||
                null;

              const completed =
                Boolean(
                  currentDocument &&
                    (
                      currentDocument.status ===
                        "verified" ||
                      currentDocument.status ===
                        "waived" ||
                      (
                        requirement.review_required ===
                          false &&
                        [
                          "uploaded",
                          "under_review",
                          "verified",
                        ].includes(
                          currentDocument.status,
                        )
                      )
                    ),
                );

              return {
                requirement,
                documents:
                  matchedDocuments,
                currentDocument,
                completed,
              };
            },
          ),
      [
        requirements,
        documentsByRequirementId,
      ],
    );

  const requiredChecklistItems =
    checklistItems.filter(
      ({ requirement }) =>
        requirement.requirement_status ===
          "required" ||
        requirement.requirement_status ===
          "conditionally_required",
    );

  const completedRequiredItems =
    requiredChecklistItems.filter(
      (item) => item.completed,
    );

  const completionPercentage =
    requiredChecklistItems.length > 0
      ? Math.round(
          (
            completedRequiredItems.length /
            requiredChecklistItems.length
          ) * 100,
        )
      : 0;

  const requiredDocumentsComplete =
    requiredChecklistItems.length > 0 &&
    completedRequiredItems.length ===
      requiredChecklistItems.length;

  const unlinkedDocuments =
    documents.filter(
      (document) =>
        !document.requirement_id,
    );
  const handleOpenUploader = (
    requirement = null,
  ) => {
    if (
      !canUploadApplicationDocuments ||
      documentMutationLoading
    ) {
      return;
    }

    setUploadRequirement(
      requirement,
    );

    setUploaderOpen(true);
  };

  const handleCloseUploader = () => {
    if (documentMutationLoading) {
      return;
    }

    setUploaderOpen(false);
    setUploadRequirement(null);
  };

  const validateStoredDocument = (
    document,
  ) => {
    if (
      !document?.storage_bucket ||
      !document?.storage_path
    ) {
      throw new Error(
        "This document does not have an uploaded file.",
      );
    }
  };

  const handleViewDocument =
    async (
      event,
      document,
    ) => {
      event.stopPropagation();

      setFileActionError("");

      let previewWindow = null;

      try {
        validateStoredDocument(
          document,
        );

        previewWindow =
          window.open(
            "",
            "_blank",
          );

        if (!previewWindow) {
          throw new Error(
            "The browser blocked the document window. Allow pop-ups for SchoolOS and try again.",
          );
        }

        previewWindow.opener = null;

        setFileActionLoading({
          documentId:
            document.id,
          action: "view",
        });

        const signedUrl =
          await createApplicationDocumentSignedUrl({
            bucket:
              document.storage_bucket,

            path:
              document.storage_path,

            expiresIn: 300,
          });

        previewWindow.location.replace(
          signedUrl,
        );
      } catch (error) {
        previewWindow?.close();

        setFileActionError(
          error?.message ||
            "Unable to open the document.",
        );
      } finally {
        setFileActionLoading({
          documentId: null,
          action: null,
        });
      }
    };

  const handleDownloadDocument =
    async (
      event,
      document,
    ) => {
      event.stopPropagation();

      setFileActionError("");

      try {
        validateStoredDocument(
          document,
        );

        setFileActionLoading({
          documentId:
            document.id,
          action: "download",
        });

        const blob =
          await downloadApplicationDocumentFile({
            bucket:
              document.storage_bucket,

            path:
              document.storage_path,
          });

        const objectUrl =
          URL.createObjectURL(
            blob,
          );

        try {
          const anchor =
            window.document.createElement(
              "a",
            );

          anchor.href = objectUrl;

          anchor.download =
            document.file_name ||
            "application-document";

          anchor.style.display =
            "none";

          window.document.body.appendChild(
            anchor,
          );

          anchor.click();
          anchor.remove();
        } finally {
          window.setTimeout(
            () => {
              URL.revokeObjectURL(
                objectUrl,
              );
            },
            1000,
          );
        }
      } catch (error) {
        setFileActionError(
          error?.message ||
            "Unable to download the document.",
        );
      } finally {
        setFileActionLoading({
          documentId: null,
          action: null,
        });
      }
    };

  const isDocumentFileActionLoading = (
    documentId,
  ) =>
    fileActionLoading.documentId ===
    documentId;

  const clearReviewErrors = () => {
    setLocalReviewError("");

    if (
      typeof clearDocumentReviewError ===
      "function"
    ) {
      clearDocumentReviewError();
    }
  };

  const handleStartReview =
    async (document) => {
      if (
        !document ||
        documentReviewLoading
      ) {
        return;
      }

      clearReviewErrors();

      try {
        await markApplicationDocumentUnderReview(
          document.id,
        );
      } catch (error) {
        setLocalReviewError(
          error?.message ||
            "Unable to start the document review.",
        );
      }
    };

  const handleOpenReviewDialog = (
    action,
    document,
  ) => {
    if (
      !document ||
      documentReviewLoading
    ) {
      return;
    }

    clearReviewErrors();

    setReviewDialog({
      open: true,
      action,
      document,
      reason: "",
      notes:
        action === "verify"
          ? document.notes || ""
          : "",
      error: "",
    });
  };

  const handleCloseReviewDialog =
    () => {
      if (documentReviewLoading) {
        return;
      }

      setReviewDialog(
        EMPTY_REVIEW_DIALOG,
      );
    };

  const handleReviewDialogChange =
    (updates) => {
      setReviewDialog(
        (current) => ({
          ...current,
          ...updates,
        }),
      );
    };

  const handleSubmitReviewAction =
    async (event) => {
      event.preventDefault();

      if (
        documentReviewLoading ||
        !reviewDialog.document
      ) {
        return;
      }

      const reason =
        reviewDialog.reason.trim();

      const notes =
        reviewDialog.notes.trim();

      if (
        (
          reviewDialog.action ===
            "reject" ||
          reviewDialog.action ===
            "request_replacement"
        ) &&
        !reason
      ) {
        setReviewDialog(
          (current) => ({
            ...current,
            error:
              "A reason is required.",
          }),
        );

        return;
      }

      clearReviewErrors();

      try {
        if (
          reviewDialog.action ===
          "verify"
        ) {
          await verifyApplicationDocument(
            reviewDialog.document.id,
            {
              notes:
                notes || null,
            },
          );
        } else if (
          reviewDialog.action ===
          "reject"
        ) {
          await rejectApplicationDocument(
            reviewDialog.document.id,
            {
              reason,
              notes:
                notes || null,
            },
          );
        } else if (
          reviewDialog.action ===
          "request_replacement"
        ) {
          await requestApplicationDocumentReplacement(
            reviewDialog.document.id,
            {
              reason,
            },
          );
        } else {
          throw new Error(
            "The document review action is not supported.",
          );
        }

        setReviewDialog(
          EMPTY_REVIEW_DIALOG,
        );
      } catch (error) {
        setReviewDialog(
          (current) => ({
            ...current,
            error:
              error?.message ||
              "Unable to complete the document review action.",
          }),
        );
      }
    };

  const visibleReviewError =
    localReviewError ||
    documentReviewError;

  return (
    <>
      <section
        id="application-documents"
        className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <FileCheck2
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <h4 className="font-black text-slate-950">
                Application documents
              </h4>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Required and optional
                records associated with
                this application.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() =>
                handleOpenUploader(null)
              }
              disabled={
                !canUploadApplicationDocuments ||
                documentMutationLoading
              }
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {documentMutationLoading ? (
                <Loader2
                  size={16}
                  aria-hidden="true"
                  className="animate-spin"
                />
              ) : (
                <FilePlus2
                  size={16}
                  aria-hidden="true"
                />
              )}

              {documentMutationLoading
                ? "Uploading..."
                : "Upload document"}
            </button>

            <button
              type="button"
              onClick={() => {
                setFileActionError("");
                clearReviewErrors();

                void Promise.all([
                  refreshApplicationDocuments(),
                  refreshDocumentRequirements?.(),
                ]);
              }}
              disabled={
                applicationDocumentsLoading ||
                documentRequirementsLoading ||
                documentMutationLoading ||
                documentReviewLoading ||
                Boolean(
                  fileActionLoading.documentId,
                )
              }
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                aria-hidden="true"
                className={
                  applicationDocumentsLoading ||
                  documentRequirementsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Total documents
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {documents.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Required complete
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {
                completedRequiredItems.length
              }
              {" / "}
              {requiredChecklistItems.length}
            </p>
          </div>

          <div
            className={[
              "rounded-2xl border p-4",
              requiredDocumentsComplete
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <p
              className={[
                "text-xs font-black uppercase tracking-[0.12em]",
                requiredDocumentsComplete
                  ? "text-emerald-700"
                  : "text-slate-500",
              ].join(" ")}
            >
              Document completion
            </p>

            <p
              className={[
                "mt-2 text-2xl font-black",
                requiredDocumentsComplete
                  ? "text-emerald-700"
                  : "text-indigo-700",
              ].join(" ")}
            >
              {completionPercentage}%
            </p>

            {requiredDocumentsComplete && (
              <p className="mt-1 text-xs font-black text-emerald-700">
                All required documents
                complete
              </p>
            )}
          </div>
        </div>

        {applicationDocumentsError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <p className="font-black text-red-800">
              Documents could not be
              loaded.
            </p>

            <p className="mt-1 text-sm font-semibold text-red-700">
              {
                applicationDocumentsError
              }
            </p>
          </div>
        )}

        {documentRequirementsError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <p className="font-black text-red-800">
              Document requirements could not
              be loaded.
            </p>

            <p className="mt-1 text-sm font-semibold text-red-700">
              {documentRequirementsError}
            </p>
          </div>
        )}

        {fileActionError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <p className="font-black text-red-800">
              Document file action
              failed.
            </p>

            <p className="mt-1 text-sm font-semibold text-red-700">
              {fileActionError}
            </p>
          </div>
        )}

        {visibleReviewError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <p className="font-black text-red-800">
              Document review action
              failed.
            </p>

            <p className="mt-1 text-sm font-semibold text-red-700">
              {visibleReviewError}
            </p>
          </div>
        )}

        {checklistItems.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h5 className="font-black text-slate-950">
                  Document requirements
                </h5>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Complete each configured
                  requirement for this
                  application.
                </p>
              </div>

              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                {completedRequiredItems.length}
                {" of "}
                {requiredChecklistItems.length}
                {" required complete"}
              </p>
            </div>

            {checklistItems.map(
              ({
                requirement,
                documents:
                  requirementDocuments,
                currentDocument,
                completed,
              }) => {
                const selected =
                  Boolean(
                    currentDocument &&
                      currentDocument.id ===
                        selectedApplicationDocumentId,
                  );

                const Icon =
                  currentDocument
                    ? getDocumentIcon(
                        currentDocument.status,
                      )
                    : FileText;

                const hasStoredFile =
                  Boolean(
                    currentDocument
                      ?.storage_bucket &&
                    currentDocument
                      ?.storage_path,
                  );

                const viewing =
                  Boolean(
                    currentDocument &&
                      fileActionLoading.documentId ===
                        currentDocument.id &&
                      fileActionLoading.action ===
                        "view",
                  );

                const downloading =
                  Boolean(
                    currentDocument &&
                      fileActionLoading.documentId ===
                        currentDocument.id &&
                      fileActionLoading.action ===
                        "download",
                  );

                const requirementIsRequired =
                  requirement.requirement_status ===
                    "required" ||
                  requirement.requirement_status ===
                    "conditionally_required";

                return (
                  <article
                    key={requirement.id}
                    className={[
                      "rounded-2xl border p-4 transition",
                      selected
                        ? "border-indigo-300 bg-indigo-50"
                        : completed
                          ? "border-emerald-200 bg-emerald-50/40"
                          : requirementIsRequired
                            ? "border-amber-200 bg-amber-50/30"
                            : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <button
                        type="button"
                        disabled={
                          !currentDocument
                        }
                        onClick={() => {
                          if (
                            currentDocument
                          ) {
                            selectApplicationDocument(
                              currentDocument,
                            );
                          }
                        }}
                        className="min-w-0 flex-1 text-left disabled:cursor-default"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={[
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                              completed
                                ? "bg-emerald-100 text-emerald-700"
                                : currentDocument
                                  ? currentDocument.status ===
                                    "rejected" ||
                                  currentDocument.status ===
                                    "expired"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                                : requirementIsRequired
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            <Icon
                              size={19}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black text-slate-950">
                                {requirement.document_label ||
                                  getAdmissionStatusLabel(
                                    requirement.document_type,
                                  ) ||
                                  "Document requirement"}
                              </p>

                              {completed && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                                  <CheckCircle2
                                    size={12}
                                    aria-hidden="true"
                                  />

                                  Complete
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {currentDocument
                                ? currentDocument.file_name ||
                                  "Document uploaded"
                                : "No document uploaded"}
                            </p>

                            {requirement.description && (
                              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                                {
                                  requirement.description
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        {currentDocument ? (
                          <DocumentStatusBadge
                            status={
                              currentDocument.status
                            }
                          />
                        ) : (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                            Missing
                          </span>
                        )}

                        <RequirementBadge
                          status={
                            requirement.requirement_status
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-xs font-semibold text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                      <p>
                        Type:{" "}
                        <span className="font-black text-slate-700">
                          {getAdmissionStatusLabel(
                            requirement.document_type,
                          )}
                        </span>
                      </p>

                      <p>
                        Uploaded:{" "}
                        <span className="font-black text-slate-700">
                          {formatDate(
                            currentDocument
                              ?.uploaded_at,
                          )}
                        </span>
                      </p>

                      <p>
                        Review required:{" "}
                        <span className="font-black text-slate-700">
                          {requirement.review_required ===
                          false
                            ? "No"
                            : "Yes"}
                        </span>
                      </p>

                      <p>
                        Versions:{" "}
                      <span className="font-black text-slate-700">
                        {
                          requirementDocuments.length
                        }
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                    {canUploadApplicationDocuments && (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenUploader(
                            requirement,
                          )
                        }
                        disabled={
                          documentMutationLoading
                        }
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {documentMutationLoading ? (
                          <Loader2
                            size={14}
                            aria-hidden="true"
                            className="animate-spin"
                          />
                        ) : (
                          <FilePlus2
                            size={14}
                            aria-hidden="true"
                          />
                        )}

                        {currentDocument
                          ? "Upload new version"
                          : "Upload document"}
                      </button>
                    )}

                    {hasStoredFile && (
                      <>
                        <button
                          type="button"
                          onClick={(event) =>
                            handleViewDocument(
                              event,
                              currentDocument,
                            )
                          }
                          disabled={isDocumentFileActionLoading(
                            currentDocument.id,
                          )}
                          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-xs font-black text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {viewing ? (
                            <Loader2
                              size={14}
                              aria-hidden="true"
                              className="animate-spin"
                            />
                          ) : (
                            <ExternalLink
                              size={14}
                              aria-hidden="true"
                            />
                          )}

                          {viewing
                            ? "Opening..."
                            : "View file"}
                        </button>

                        <button
                          type="button"
                          onClick={(event) =>
                            handleDownloadDocument(
                              event,
                              currentDocument,
                            )
                          }
                          disabled={isDocumentFileActionLoading(
                            currentDocument.id,
                          )}
                          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {downloading ? (
                            <Loader2
                              size={14}
                              aria-hidden="true"
                              className="animate-spin"
                            />
                          ) : (
                            <Download
                              size={14}
                              aria-hidden="true"
                            />
                          )}

                          {downloading
                            ? "Downloading..."
                            : "Download"}
                        </button>
                      </>
                    )}
                  </div>

                  {currentDocument?.notes && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                        Notes
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">
                        {currentDocument.notes}
                      </p>
                    </div>
                  )}

                  {currentDocument
                    ?.rejection_reason && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-red-700">
                        Rejection reason
                      </p>

                      <p className="mt-1 text-sm font-semibold text-red-700">
                        {
                          currentDocument.rejection_reason
                        }
                      </p>
                    </div>
                  )}

                  {selected &&
                    currentDocument &&
                    canReviewApplicationDocuments && (
                      <ReviewerActionPanel
                        document={
                          currentDocument
                        }
                        loading={
                          documentReviewLoading
                        }
                        lastAction={
                          lastDocumentReviewAction
                        }
                        onStartReview={() =>
                          handleStartReview(
                            currentDocument,
                          )
                        }
                        onOpenDialog={(
                          action,
                        ) =>
                          handleOpenReviewDialog(
                            action,
                            currentDocument,
                          )
                        }
                      />
                    )}

                  {selected &&
                    currentDocument && (
                      <>
                        <VerificationHistory
                          document={
                            currentDocument
                          }
                          reviewerProfilesById={
                            reviewerProfilesById
                          }
                        />

                        <DocumentAuditTimeline
                          document={
                            currentDocument
                          }
                        />
                      </>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}

        {(
          applicationDocumentsLoading ||
          documentRequirementsLoading
        ) &&
        !documents.length &&
        !checklistItems.length ? (
          <div className="mt-5 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <Loader2
                size={22}
                aria-hidden="true"
                className="mx-auto animate-spin text-indigo-600"
              />

              <p className="mt-3 text-sm font-black text-slate-700">
                Loading documents...
              </p>
            </div>
          </div>
        ) : !checklistItems.length &&
            !unlinkedDocuments.length ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <FileText
              size={25}
              aria-hidden="true"
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 font-black text-slate-800">
              No application documents
            </p>

            <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">
              Upload the first document
              or add document
              requirements for this
              application.
            </p>

            {canUploadApplicationDocuments && (
              <button
                type="button"
                onClick={() =>
                handleOpenUploader(null)
              }
                disabled={
                  documentMutationLoading
                }
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FilePlus2
                  size={16}
                  aria-hidden="true"
                />

                Upload first document
              </button>
            )}
          </div>
        ) : (
          <div
            className={[
              "space-y-3",
              checklistItems.length
                ? "mt-8 border-t border-slate-200 pt-6"
                : "mt-5",
            ].join(" ")}
          >
            {unlinkedDocuments.length > 0 && (
              <div>
                <h5 className="font-black text-slate-950">
                  Unlinked documents
                </h5>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Legacy or manually uploaded
                  documents not associated with
                  a configured requirement.
                </p>
              </div>
            )}

            {unlinkedDocuments.map(
              (document) => {
                const Icon =
                  getDocumentIcon(
                    document.status,
                  );

                const selected =
                  document.id ===
                  selectedApplicationDocumentId;

                const hasStoredFile =
                  Boolean(
                    document.storage_bucket &&
                      document.storage_path,
                  );

                const viewing =
                  fileActionLoading.documentId ===
                    document.id &&
                  fileActionLoading.action ===
                    "view";

                const downloading =
                  fileActionLoading.documentId ===
                    document.id &&
                  fileActionLoading.action ===
                    "download";

                return (
                  <article
                    key={document.id}
                    className={[
                      "rounded-2xl border p-4 transition",
                      selected
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        selectApplicationDocument(
                          document,
                        )
                      }
                      className="w-full text-left"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={[
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                              document.status ===
                                "verified"
                                ? "bg-emerald-100 text-emerald-700"
                                : document.status ===
                                      "rejected" ||
                                    document.status ===
                                      "expired"
                                  ? "bg-red-100 text-red-700"
                                  : document.status ===
                                        "uploaded" ||
                                      document.status ===
                                        "under_review"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            <Icon
                              size={18}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-950">
                              {document.document_label ||
                                document.document_type}
                            </p>

                            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                              {document.file_name ||
                                "No file uploaded"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <DocumentStatusBadge
                            status={
                              document.status
                            }
                          />

                          <RequirementBadge
                            status={
                              document
                                .requirement_status
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-xs font-semibold text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                        <p>
                          Type:{" "}
                          <span className="font-black text-slate-700">
                            {getAdmissionStatusLabel(
                              document.document_type,
                            )}
                          </span>
                        </p>

                        <p>
                          Uploaded:{" "}
                          <span className="font-black text-slate-700">
                            {formatDate(
                              document.uploaded_at,
                            )}
                          </span>
                        </p>

                        <p>
                          Verified:{" "}
                          <span className="font-black text-slate-700">
                            {formatDate(
                              document.verified_at,
                            )}
                          </span>
                        </p>

                        <p>
                          Size:{" "}
                          <span className="font-black text-slate-700">
                            {formatFileSize(
                              document.file_size_bytes,
                            )}
                          </span>
                        </p>
                      </div>
                    </button>

                    {hasStoredFile && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                        <button
                          type="button"
                          onClick={(
                            event,
                          ) =>
                            handleViewDocument(
                              event,
                              document,
                            )
                          }
                          disabled={isDocumentFileActionLoading(
                            document.id,
                          )}
                          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-xs font-black text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {viewing ? (
                            <Loader2
                              size={14}
                              aria-hidden="true"
                              className="animate-spin"
                            />
                          ) : (
                            <ExternalLink
                              size={14}
                              aria-hidden="true"
                            />
                          )}

                          {viewing
                            ? "Opening..."
                            : "View file"}
                        </button>

                        <button
                          type="button"
                          onClick={(
                            event,
                          ) =>
                            handleDownloadDocument(
                              event,
                              document,
                            )
                          }
                          disabled={isDocumentFileActionLoading(
                            document.id,
                          )}
                          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {downloading ? (
                            <Loader2
                              size={14}
                              aria-hidden="true"
                              className="animate-spin"
                            />
                          ) : (
                            <Download
                              size={14}
                              aria-hidden="true"
                            />
                          )}

                          {downloading
                            ? "Downloading..."
                            : "Download"}
                        </button>
                      </div>
                    )}

                    {document.notes && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                          Notes
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">
                          {document.notes}
                        </p>
                      </div>
                    )}

                    {document.rejection_reason && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-red-700">
                          Rejection reason
                        </p>

                        <p className="mt-1 text-sm font-semibold text-red-700">
                          {
                            document.rejection_reason
                          }
                        </p>
                      </div>
                    )}

                    {document.status ===
                      "verified" && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-black text-emerald-700">
                        <ShieldCheck
                          size={15}
                          aria-hidden="true"
                        />

                        Verified document
                      </div>
                    )}

                    {selected &&
                      canReviewApplicationDocuments && (
                        <ReviewerActionPanel
                          document={
                            document
                          }
                          loading={
                            documentReviewLoading
                          }
                          lastAction={
                            lastDocumentReviewAction
                          }
                          onStartReview={() =>
                            handleStartReview(
                              document,
                            )
                          }
                          onOpenDialog={(
                            action,
                          ) =>
                            handleOpenReviewDialog(
                              action,
                              document,
                            )
                          }
                        />
                      )}

                    {selected && (
                      <>
                        <VerificationHistory
                          document={
                            document
                          }
                          reviewerProfilesById={
                            reviewerProfilesById
                          }
                        />

                        <DocumentAuditTimeline
                          document={
                            document
                          }
                        />
                      </>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}

        {selectedApplicationDocument &&
          !canReviewApplicationDocuments && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-slate-500"
                />

                <div>
                  <p className="font-black text-slate-800">
                    Review access is
                    restricted
                  </p>

                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    You may view this
                    document, but your
                    role does not permit
                    document review
                    decisions.
                  </p>
                </div>
              </div>
            </div>
          )}
      </section>

      <DocumentUploaderDialog
        open={uploaderOpen}
        requirement={
          uploadRequirement
        }
        onClose={
          handleCloseUploader
        }
      />

      <ReviewActionDialog
        state={reviewDialog}
        loading={
          documentReviewLoading
        }
        onChange={
          handleReviewDialogChange
        }
        onClose={
          handleCloseReviewDialog
        }
        onSubmit={
          handleSubmitReviewAction
        }
      />
    </>
  );
}