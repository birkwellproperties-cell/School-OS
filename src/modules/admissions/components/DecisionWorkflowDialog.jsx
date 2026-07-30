import {
  CheckCircle2,
  Gavel,
  Loader2,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

const ACTION_CONFIGURATION = {
  submit: {
    title:
      "Submit decision for approval?",
    description:
      "This decision will move from Draft to Pending Approval. It can still be edited until it is approved.",
    confirmLabel:
      "Submit for approval",
    busyLabel:
      "Submitting decision...",
    icon:
      Gavel,
    iconClasses:
      "bg-amber-50 text-amber-700",
    buttonClasses:
      "bg-amber-600 text-white hover:bg-amber-700",
  },

  approve: {
    title:
      "Approve this decision?",
    description:
      "This confirms the admission decision and records you as the approving user. The decision must be published before it is released.",
    confirmLabel:
      "Approve decision",
    busyLabel:
      "Approving decision...",
    icon:
      ShieldCheck,
    iconClasses:
      "bg-emerald-50 text-emerald-700",
    buttonClasses:
      "bg-emerald-600 text-white hover:bg-emerald-700",
  },

  publish: {
    title:
      "Publish this decision?",
    description:
      "Publishing completes the decision workflow and records the publication date and publishing user.",
    confirmLabel:
      "Publish decision",
    busyLabel:
      "Publishing decision...",
    icon:
      Send,
    iconClasses:
      "bg-indigo-50 text-indigo-700",
    buttonClasses:
      "bg-indigo-600 text-white hover:bg-indigo-700",
  },
};

function getApplicationNumber(
  decision,
) {
  return (
    decision
      ?.application_number ||
    decision
      ?.application
      ?.application_number ||
    "Admission decision"
  );
}

export default function DecisionWorkflowDialog({
  open,
  action,
  decision,
  loading = false,
  error = "",
  onClose,
  onConfirm,
}) {
  if (
    !open ||
    !action ||
    !decision
  ) {
    return null;
  }

  const configuration =
    ACTION_CONFIGURATION[action];

  if (!configuration) {
    return null;
  }

  const Icon =
    configuration.icon;

  const handleBackdropClick = (
    event,
  ) => {
    if (
      event.target ===
        event.currentTarget &&
      !loading
    ) {
      onClose?.();
    }
  };

  return (
    <div
      role="presentation"
      onMouseDown={
        handleBackdropClick
      }
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-workflow-dialog-title"
        className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div className="flex min-w-0 gap-4">
            <div
              className={[
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                configuration
                  .iconClasses,
              ].join(" ")}
            >
              <Icon
                size={22}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Decision workflow
              </p>

              <h2
                id="decision-workflow-dialog-title"
                className="mt-2 text-xl font-black text-slate-950"
              >
                {
                  configuration
                    .title
                }
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              loading
            }
            aria-label="Close decision workflow dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              size={18}
            />
          </button>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Application
            </p>

            <p className="mt-2 break-words font-black text-slate-950">
              {getApplicationNumber(
                decision,
              )}
            </p>
          </div>

          <p className="text-sm font-medium leading-7 text-slate-600">
            {
              configuration
                .description
            }
          </p>

          {action ===
            "publish" && (
            <div className="flex gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-indigo-700"
              />

              <p className="text-sm font-semibold leading-6 text-indigo-800">
                Confirm that the
                outcome, rationale,
                conditions, and
                effective dates are
                final before
                publishing.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <p className="font-black text-red-800">
                The workflow action
                could not be completed.
              </p>

              <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
                {error}
              </p>
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              loading
            }
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              onConfirm
            }
            disabled={
              loading
            }
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
                <Icon
                  size={17}
                />

                {
                  configuration
                    .confirmLabel
                }
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}