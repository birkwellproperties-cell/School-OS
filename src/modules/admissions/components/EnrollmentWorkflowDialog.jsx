import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Loader2,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

function getActionConfiguration(
  action,
) {
  const configurations = {
    validate: {
      title:
        "Validate Enrollment Conversion",
      description:
        "Run enrollment readiness validation and record any blocking issues.",
      confirmLabel:
        "Validate conversion",
      busyLabel:
        "Validating...",
      icon:
        ShieldCheck,
      buttonClasses:
        "bg-indigo-600 text-white hover:bg-indigo-700",
    },

    mark_ready: {
      title:
        "Mark Enrollment Ready",
      description:
        "Confirm that all required enrollment information has been validated.",
      confirmLabel:
        "Mark ready",
      busyLabel:
        "Updating...",
      icon:
        CheckCircle2,
      buttonClasses:
        "bg-emerald-600 text-white hover:bg-emerald-700",
    },

    start_processing: {
      title:
        "Start Enrollment Processing",
      description:
        "Move this conversion into active enrollment processing.",
      confirmLabel:
        "Start processing",
      busyLabel:
        "Starting...",
      icon:
        PlayCircle,
      buttonClasses:
        "bg-indigo-600 text-white hover:bg-indigo-700",
    },

    complete: {
      title:
        "Complete Enrollment Conversion",
      description:
        "Record the future Student and Enrollment identifiers when available, then complete the conversion.",
      confirmLabel:
        "Complete conversion",
      busyLabel:
        "Completing...",
      icon:
        CheckCircle2,
      buttonClasses:
        "bg-emerald-600 text-white hover:bg-emerald-700",
    },

    fail: {
      title:
        "Fail Enrollment Conversion",
      description:
        "Record why this conversion could not be completed.",
      confirmLabel:
        "Mark failed",
      busyLabel:
        "Updating...",
      icon:
        XCircle,
      buttonClasses:
        "bg-red-600 text-white hover:bg-red-700",
    },

    cancel: {
      title:
        "Cancel Enrollment Conversion",
      description:
        "Cancel this conversion before enrollment processing is completed.",
      confirmLabel:
        "Cancel conversion",
      busyLabel:
        "Cancelling...",
      icon:
        Ban,
      buttonClasses:
        "bg-red-600 text-white hover:bg-red-700",
    },

    reverse: {
      title:
        "Reverse Enrollment Conversion",
      description:
        "Reverse a previously completed enrollment conversion and record the reason.",
      confirmLabel:
        "Reverse conversion",
      busyLabel:
        "Reversing...",
      icon:
        RotateCcw,
      buttonClasses:
        "bg-red-600 text-white hover:bg-red-700",
    },
  };

  return (
    configurations[action] ||
    configurations.validate
  );
}

function FieldLabel({
  children,
  required = false,
}) {
  return (
    <label className="mb-2 block text-sm font-black text-slate-800">
      {children}

      {required && (
        <span className="ml-1 text-red-600">
          *
        </span>
      )}
    </label>
  );
}

export default function EnrollmentWorkflowDialog({
  open = false,
  action = "",
  conversion = null,
  loading = false,
  error = "",
  onClose,
  onConfirm,
}) {
  const [
    studentId,
    setStudentId,
  ] = useState("");

  const [
    enrollmentId,
    setEnrollmentId,
  ] = useState("");

  const [
    failureReason,
    setFailureReason,
  ] = useState("");

  const [
    validationErrorsText,
    setValidationErrorsText,
  ] = useState("");

  const [
    cancellationReason,
    setCancellationReason,
  ] = useState("");

  const [
    reversalReason,
    setReversalReason,
  ] = useState("");

  const [
    localError,
    setLocalError,
  ] = useState("");

  const configuration =
    useMemo(
      () =>
        getActionConfiguration(
          action,
        ),
      [
        action,
      ],
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    setStudentId(
      conversion?.student_id ||
        "",
    );

    setEnrollmentId(
      conversion?.enrollment_id ||
        "",
    );

    setFailureReason(
      conversion?.failure_reason ||
        "",
    );

    setValidationErrorsText(
      Array.isArray(
        conversion
          ?.validation_errors,
      )
        ? conversion
            .validation_errors
            .map((item) =>
              typeof item ===
              "string"
                ? item
                : item?.message ||
                  JSON.stringify(
                    item,
                  ),
            )
            .join("\n")
        : "",
    );

    setCancellationReason(
      conversion
        ?.cancellation_reason ||
        "",
    );

    setReversalReason(
      conversion?.reversal_reason ||
        "",
    );

    setLocalError("");
  }, [
    open,
    action,
    conversion,
  ]);

  if (!open) {
    return null;
  }

  const Icon =
    configuration.icon;

  const closeDialog = () => {
    if (loading) {
      return;
    }

    setLocalError("");
    onClose?.();
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setLocalError("");

      const payload = {};

      if (
        action === "complete"
      ) {
        payload.studentId =
          studentId.trim() ||
          undefined;

        payload.enrollmentId =
          enrollmentId.trim() ||
          undefined;
      }

      if (action === "fail") {
        const normalizedReason =
          failureReason.trim();

        if (!normalizedReason) {
          setLocalError(
            "A failure reason is required.",
          );

          return;
        }

        payload.failureReason =
          normalizedReason;

        payload.validationErrors =
          validationErrorsText
            .split(/\r?\n/)
            .map((item) =>
              item.trim(),
            )
            .filter(Boolean);
      }

      if (action === "cancel") {
        const normalizedReason =
          cancellationReason.trim();

        if (!normalizedReason) {
          setLocalError(
            "A cancellation reason is required.",
          );

          return;
        }

        payload.cancellationReason =
          normalizedReason;
      }

      if (action === "reverse") {
        const normalizedReason =
          reversalReason.trim();

        if (!normalizedReason) {
          setLocalError(
            "A reversal reason is required.",
          );

          return;
        }

        payload.reversalReason =
          normalizedReason;
      }

      try {
        await onConfirm?.(
          payload,
        );
      } catch {
        // Mutation error is managed
        // by the enrollment state.
      }
    };

  const displayedError =
    localError ||
    error;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <Icon size={21} />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-black text-slate-950">
                {
                  configuration
                    .title
                }
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                {
                  configuration
                    .description
                }
              </p>

              <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Application{" "}
                {conversion
                  ?.application_number ||
                  conversion
                    ?.application
                    ?.application_number ||
                  "not loaded"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close enrollment workflow dialog"
          >
            <X size={20} />
          </button>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="space-y-5 px-5 py-6 sm:px-6">
            {action ===
              "complete" && (
              <>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-700"
                    />

                    <p className="text-sm font-semibold leading-6 text-blue-800">
                      Student and
                      enrollment IDs
                      are optional until
                      the Student domain
                      is connected.
                    </p>
                  </div>
                </div>

                <div>
                  <FieldLabel>
                    Student ID
                  </FieldLabel>

                  <input
                    type="text"
                    value={
                      studentId
                    }
                    onChange={(
                      event,
                    ) =>
                      setStudentId(
                        event.target
                          .value,
                      )
                    }
                    disabled={loading}
                    placeholder="Future student UUID"
                    className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Enrollment ID
                  </FieldLabel>

                  <input
                    type="text"
                    value={
                      enrollmentId
                    }
                    onChange={(
                      event,
                    ) =>
                      setEnrollmentId(
                        event.target
                          .value,
                      )
                    }
                    disabled={loading}
                    placeholder="Future enrollment UUID"
                    className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                  />
                </div>
              </>
            )}

            {action === "fail" && (
              <>
                <div>
                  <FieldLabel
                    required
                  >
                    Failure reason
                  </FieldLabel>

                  <textarea
                    value={
                      failureReason
                    }
                    onChange={(
                      event,
                    ) =>
                      setFailureReason(
                        event.target
                          .value,
                      )
                    }
                    disabled={loading}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Validation errors
                  </FieldLabel>

                  <textarea
                    value={
                      validationErrorsText
                    }
                    onChange={(
                      event,
                    ) =>
                      setValidationErrorsText(
                        event.target
                          .value,
                      )
                    }
                    disabled={loading}
                    rows={5}
                    placeholder="Enter one validation error per line"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                  />
                </div>
              </>
            )}

            {action ===
              "cancel" && (
              <div>
                <FieldLabel
                  required
                >
                  Cancellation reason
                </FieldLabel>

                <textarea
                  value={
                    cancellationReason
                  }
                  onChange={(
                    event,
                  ) =>
                    setCancellationReason(
                      event.target
                        .value,
                    )
                  }
                  disabled={loading}
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                />
              </div>
            )}

            {action ===
              "reverse" && (
              <div>
                <FieldLabel
                  required
                >
                  Reversal reason
                </FieldLabel>

                <textarea
                  value={
                    reversalReason
                  }
                  onChange={(
                    event,
                  ) =>
                    setReversalReason(
                      event.target
                        .value,
                    )
                  }
                  disabled={loading}
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                />
              </div>
            )}

            {displayedError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <XCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="font-black text-red-800">
                      Enrollment action
                      failed
                    </p>

                    <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
                      {displayedError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={closeDialog}
              disabled={loading}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={[
                "flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                configuration
                  .buttonClasses,
              ].join(" ")}
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  {
                    configuration
                      .busyLabel
                  }
                </>
              ) : (
                <>
                  <Icon size={17} />

                  {
                    configuration
                      .confirmLabel
                  }
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}