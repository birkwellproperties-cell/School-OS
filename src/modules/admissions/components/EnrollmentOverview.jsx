import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileCheck2,
  GraduationCap,
  Loader2,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  UserRoundCheck,
  XCircle,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  getAdmissionStatusLabel,
} from "../constants";

import EnrollmentWorkflowDialog
  from "./EnrollmentWorkflowDialog";

function formatDate(
  value,
  {
    includeTime = false,
  } = {},
) {
  if (!value) {
    return "Not recorded";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    includeTime
      ? {
          dateStyle: "medium",
          timeStyle: "short",
        }
      : {
          dateStyle: "medium",
        },
  ).format(date);
}

function getStatusTone(
  status,
) {
  if (
    status === "completed"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "ready",
      "processing",
      "validating",
    ].includes(status)
  ) {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (
    status === "pending"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    [
      "failed",
      "cancelled",
      "reversed",
    ].includes(status)
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatusBadge({
  status,
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        getStatusTone(
          status,
        ),
      ].join(" ")}
    >
      {getAdmissionStatusLabel(
        status,
      )}
    </span>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-black text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  value,
  complete,
}) {
  return (
    <div className="flex gap-3">
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
          complete
            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
            : "border-slate-200 bg-slate-50 text-slate-400",
        ].join(" ")}
      >
        <Icon size={16} />
      </div>

      <div className="min-w-0 pt-1">
        <p className="text-sm font-black text-slate-800">
          {label}
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          {value}
        </p>
      </div>
    </div>
  );
}

function normalizeValidationErrors(
  value,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        typeof item ===
        "string"
      ) {
        return item;
      }

      return (
        item?.message ||
        item?.error ||
        JSON.stringify(item)
      );
    })
    .filter(Boolean);
}

export default function EnrollmentOverview({
  conversion,

  canEditEnrollment = false,

  mutationLoading = false,
  mutationError = "",

  onEditEnrollment,
  onValidateEnrollment,
  onMarkEnrollmentReady,
  onStartEnrollmentProcessing,
  onCompleteEnrollment,
  onFailEnrollment,
  onCancelEnrollment,
  onReverseEnrollment,
  onClearMutationError,
}) {
  const [
    workflowAction,
    setWorkflowAction,
  ] = useState("");

  const [
    workflowDialogOpen,
    setWorkflowDialogOpen,
  ] = useState(false);

  if (!conversion) {
    return (
      <div className="flex min-h-[620px] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <GraduationCap
            size={36}
            className="mx-auto text-slate-400"
          />

          <h3 className="mt-4 text-lg font-black text-slate-900">
            Select an enrollment
          </h3>

          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Choose an enrollment
            conversion from the
            queue to review its
            readiness and workflow.
          </p>
        </div>
      </div>
    );
  }

  const status =
    conversion.status ||
    "pending";

  const validationErrors =
    normalizeValidationErrors(
      conversion
        .validation_errors,
    );

  const canEdit =
    canEditEnrollment &&
    [
      "pending",
      "validating",
      "ready",
    ].includes(status);

  const availableActions = [];

  if (
    canEditEnrollment &&
    status === "pending"
  ) {
    availableActions.push({
      id: "validate",
      label:
        "Validate",
      icon:
        ShieldCheck,
    });
  }

  if (
    canEditEnrollment &&
    status === "validating"
  ) {
    availableActions.push({
      id: "mark_ready",
      label:
        "Mark ready",
      icon:
        CheckCircle2,
    });
  }

  if (
    canEditEnrollment &&
    status === "ready"
  ) {
    availableActions.push({
      id:
        "start_processing",
      label:
        "Start processing",
      icon:
        PlayCircle,
    });
  }

  if (
    canEditEnrollment &&
    status === "processing"
  ) {
    availableActions.push(
      {
        id: "complete",
        label:
          "Complete",
        icon:
          CheckCircle2,
      },
      {
        id: "fail",
        label:
          "Mark failed",
        icon:
          XCircle,
      },
    );
  }

  if (
    canEditEnrollment &&
    [
      "pending",
      "validating",
      "ready",
      "processing",
    ].includes(status)
  ) {
    availableActions.push({
      id: "cancel",
      label:
        "Cancel",
      icon:
        Ban,
    });
  }

  if (
    canEditEnrollment &&
    status === "completed"
  ) {
    availableActions.push({
      id: "reverse",
      label:
        "Reverse",
      icon:
        RotateCcw,
    });
  }

  const openWorkflow = (
    action,
  ) => {
    onClearMutationError?.();
    setWorkflowAction(action);
    setWorkflowDialogOpen(
      true,
    );
  };

  const closeWorkflow = () => {
    if (mutationLoading) {
      return;
    }

    setWorkflowDialogOpen(
      false,
    );

    setWorkflowAction("");
  };

  const handleWorkflowConfirm =
    async (payload = {}) => {
      const conversionId =
        conversion.id;

      if (!conversionId) {
        return;
      }

      if (
        workflowAction ===
        "validate"
      ) {
        await onValidateEnrollment?.(
          conversionId,
        );
      }

      if (
        workflowAction ===
        "mark_ready"
      ) {
        await onMarkEnrollmentReady?.(
          conversionId,
        );
      }

      if (
        workflowAction ===
        "start_processing"
      ) {
        await onStartEnrollmentProcessing?.(
          conversionId,
        );
      }

      if (
        workflowAction ===
        "complete"
      ) {
        await onCompleteEnrollment?.(
          conversionId,
          payload,
        );
      }

      if (
        workflowAction ===
        "fail"
      ) {
        await onFailEnrollment?.(
          conversionId,
          payload,
        );
      }

      if (
        workflowAction ===
        "cancel"
      ) {
        await onCancelEnrollment?.(
          conversionId,
          payload,
        );
      }

      if (
        workflowAction ===
        "reverse"
      ) {
        await onReverseEnrollment?.(
          conversionId,
          payload,
        );
      }

      closeWorkflow();
    };

  return (
    <>
      <div className="min-h-[620px]">
        <header className="border-b border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="truncate text-2xl font-black text-slate-950">
                  Enrollment conversion
                </h3>

                <StatusBadge
                  status={status}
                />
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Application{" "}
                {conversion
                  .application_number ||
                  conversion
                    .application
                    ?.application_number ||
                  "not loaded"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Grade{" "}
                  {conversion
                    .target_grade_level ||
                    "not set"}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Start{" "}
                  {formatDate(
                    conversion
                      .enrollment_start_date,
                  )}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Errors{" "}
                  {
                    validationErrors
                      .length
                  }
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() =>
                    onEditEnrollment?.(
                      conversion,
                    )
                  }
                  disabled={
                    mutationLoading
                  }
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
              )}

              {availableActions.map(
                ({
                  id,
                  label,
                  icon: Icon,
                }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      openWorkflow(
                        id,
                      )
                    }
                    disabled={
                      mutationLoading
                    }
                    className={[
                      "flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                      [
                        "fail",
                        "cancel",
                        "reverse",
                      ].includes(id)
                        ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-indigo-600 text-white hover:bg-indigo-700",
                    ].join(" ")}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          {mutationError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <XCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="font-black text-red-800">
                    Enrollment action failed
                  </p>

                  <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
                    {mutationError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <div className="flex items-center gap-2">
              <GraduationCap
                size={18}
                className="text-indigo-700"
              />

              <h4 className="text-lg font-black text-slate-950">
                Enrollment details
              </h4>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailCard
                icon={
                  GraduationCap
                }
                label="Target grade"
                value={
                  conversion
                    .target_grade_level ||
                  "Not set"
                }
              />

              <DetailCard
                icon={
                  CalendarDays
                }
                label="Start date"
                value={formatDate(
                  conversion
                    .enrollment_start_date,
                )}
              />

              <DetailCard
                icon={
                  FileCheck2
                }
                label="Application"
                value={
                  conversion
                    .application_number ||
                  conversion
                    .application
                    ?.application_number ||
                  conversion
                    .application_id ||
                  "Not loaded"
                }
              />

              <DetailCard
                icon={
                  UserRoundCheck
                }
                label="Student ID"
                value={
                  conversion.student_id ||
                  "Pending Student domain"
                }
              />

              <DetailCard
                icon={
                  UserRoundCheck
                }
                label="Enrollment ID"
                value={
                  conversion
                    .enrollment_id ||
                  "Pending Student domain"
                }
              />

              <DetailCard
                icon={
                  Clock3
                }
                label="Requested"
                value={formatDate(
                  conversion
                    .requested_at,
                  {
                    includeTime:
                      true,
                  },
                )}
              />
            </div>
          </section>

          {validationErrors.length >
            0 && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={18}
                  className="text-amber-700"
                />

                <h4 className="font-black text-amber-900">
                  Validation issues
                </h4>
              </div>

              <ul className="mt-4 space-y-2">
                {validationErrors.map(
                  (
                    item,
                    index,
                  ) => (
                    <li
                      key={`${item}-${index}`}
                      className="rounded-xl border border-amber-200 bg-white/70 px-4 py-3 text-sm font-semibold leading-6 text-amber-900"
                    >
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Clock3
                size={18}
                className="text-indigo-700"
              />

              <h4 className="font-black text-slate-950">
                Enrollment timeline
              </h4>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <TimelineItem
                icon={
                  FileCheck2
                }
                label="Requested"
                value={formatDate(
                  conversion
                    .requested_at,
                  {
                    includeTime:
                      true,
                  },
                )}
                complete={Boolean(
                  conversion
                    .requested_at,
                )}
              />

              <TimelineItem
                icon={
                  ShieldCheck
                }
                label="Processing started"
                value={formatDate(
                  conversion
                    .processing_started_at,
                  {
                    includeTime:
                      true,
                  },
                )}
                complete={Boolean(
                  conversion
                    .processing_started_at,
                )}
              />

              <TimelineItem
                icon={
                  CheckCircle2
                }
                label="Completed"
                value={formatDate(
                  conversion
                    .completed_at,
                  {
                    includeTime:
                      true,
                  },
                )}
                complete={Boolean(
                  conversion
                    .completed_at,
                )}
              />

              <TimelineItem
                icon={
                  XCircle
                }
                label="Failed"
                value={formatDate(
                  conversion
                    .failed_at,
                  {
                    includeTime:
                      true,
                  },
                )}
                complete={Boolean(
                  conversion.failed_at,
                )}
              />

              <TimelineItem
                icon={Ban}
                label="Cancelled"
                value={formatDate(
                  conversion
                    .cancelled_at,
                  {
                    includeTime:
                      true,
                  },
                )}
                complete={Boolean(
                  conversion
                    .cancelled_at,
                )}
              />

              <TimelineItem
                icon={
                  RotateCcw
                }
                label="Reversed"
                value={formatDate(
                  conversion
                    .reversed_at,
                  {
                    includeTime:
                      true,
                  },
                )}
                complete={Boolean(
                  conversion
                    .reversed_at,
                )}
              />
            </div>
          </section>

          {conversion
            .failure_reason && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h4 className="font-black text-red-900">
                Failure reason
              </h4>

              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-red-800">
                {
                  conversion
                    .failure_reason
                }
              </p>
            </section>
          )}

          {conversion
            .cancellation_reason && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h4 className="font-black text-red-900">
                Cancellation reason
              </h4>

              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-red-800">
                {
                  conversion
                    .cancellation_reason
                }
              </p>
            </section>
          )}

          {conversion
            .reversal_reason && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h4 className="font-black text-red-900">
                Reversal reason
              </h4>

              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-red-800">
                {
                  conversion
                    .reversal_reason
                }
              </p>
            </section>
          )}

          {mutationLoading && (
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <Loader2
                size={18}
                className="animate-spin text-indigo-700"
              />

              <p className="text-sm font-black text-indigo-800">
                Updating enrollment conversion...
              </p>
            </div>
          )}
        </div>
      </div>

      <EnrollmentWorkflowDialog
        open={
          workflowDialogOpen
        }
        action={
          workflowAction
        }
        conversion={
          conversion
        }
        loading={
          mutationLoading
        }
        error={
          mutationError
        }
        onClose={
          closeWorkflow
        }
        onConfirm={
          handleWorkflowConfirm
        }
      />
    </>
  );
}