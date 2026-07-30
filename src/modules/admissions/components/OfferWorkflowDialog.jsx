import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Eye,
  Loader2,
  Send,
  ShieldCheck,
  Undo2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

const TEXTAREA_CLASSES =
  "min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

function toDateInputValue(
  value,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function toDateTimeInputValue(
  value,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset * 60 * 1000,
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function getActionConfiguration(
  action,
) {
  const configurations = {
    submit_for_approval: {
      title:
        "Submit Offer for Approval",
      description:
        "Move this draft offer into the approval queue.",
      confirmLabel:
        "Submit for approval",
      icon:
        ShieldCheck,
      tone:
        "indigo",
    },

    approve: {
      title:
        "Approve Admission Offer",
      description:
        "Approve the offer so it can be sent to the applicant.",
      confirmLabel:
        "Approve offer",
      icon:
        CheckCircle2,
      tone:
        "indigo",
    },

    send: {
      title:
        "Send Admission Offer",
      description:
        "Record the offer date and expiry before sending it to the applicant.",
      confirmLabel:
        "Send offer",
      icon:
        Send,
      tone:
        "indigo",
    },

    record_viewed: {
      title:
        "Mark Offer as Viewed",
      description:
        "Record that the applicant has opened or reviewed the offer.",
      confirmLabel:
        "Mark as viewed",
      icon:
        Eye,
      tone:
        "indigo",
    },

    accept: {
      title:
        "Record Offer Acceptance",
      description:
        "Record that the applicant accepted this admission offer.",
      confirmLabel:
        "Record acceptance",
      icon:
        UserCheck,
      tone:
        "emerald",
    },

    decline: {
      title:
        "Record Offer Decline",
      description:
        "Record that the applicant declined this admission offer.",
      confirmLabel:
        "Record decline",
      icon:
        UserX,
      tone:
        "red",
    },

    withdraw: {
      title:
        "Withdraw Admission Offer",
      description:
        "Withdraw this offer from the admissions process.",
      confirmLabel:
        "Withdraw offer",
      icon:
        Undo2,
      tone:
        "red",
    },
  };

  return (
    configurations[action] || {
      title:
        "Update Admission Offer",
      description:
        "Confirm this admission offer action.",
      confirmLabel:
        "Confirm action",
      icon:
        AlertTriangle,
      tone:
        "indigo",
    }
  );
}

export default function OfferWorkflowDialog({
  open = false,
  action = "",
  offer,
  loading = false,
  error = "",
  onClose,
  onConfirm,
}) {
  const [
    offeredOn,
    setOfferedOn,
  ] = useState("");

  const [
    expiresAt,
    setExpiresAt,
  ] = useState("");

  const [
    responseNotes,
    setResponseNotes,
  ] = useState("");

  const [
    withdrawalReason,
    setWithdrawalReason,
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

    setOfferedOn(
      toDateInputValue(
        offer?.offered_on ||
          new Date(),
      ),
    );

    setExpiresAt(
      toDateTimeInputValue(
        offer?.expires_at,
      ),
    );

    setResponseNotes("");
    setWithdrawalReason("");
    setLocalError("");
  }, [
    open,
    action,
    offer?.offered_on,
    offer?.expires_at,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (
      event,
    ) => {
      if (
        event.key === "Escape" &&
        !loading
      ) {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    loading,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const ActionIcon =
    configuration.icon;

  const requiresSendDates =
    action === "send";

  const requiresResponseNotes =
    [
      "accept",
      "decline",
    ].includes(action);

  const requiresWithdrawalReason =
    action === "withdraw";

  const handleSubmit =
    async (event) => {
      event.preventDefault();
      setLocalError("");

      if (
        requiresSendDates &&
        !offeredOn
      ) {
        setLocalError(
          "Offer date is required before sending.",
        );
        return;
      }

      if (
        requiresSendDates &&
        expiresAt
      ) {
        const offeredDate =
          new Date(
            `${offeredOn}T00:00:00`,
          );

        const expiryDate =
          new Date(expiresAt);

        if (
          Number.isNaN(
            expiryDate.getTime(),
          )
        ) {
          setLocalError(
            "Offer expiry date and time is invalid.",
          );
          return;
        }

        if (
          expiryDate <
          offeredDate
        ) {
          setLocalError(
            "Offer expiry cannot be earlier than the offer date.",
          );
          return;
        }
      }

      if (
        requiresWithdrawalReason &&
        !withdrawalReason.trim()
      ) {
        setLocalError(
          "Withdrawal reason is required.",
        );
        return;
      }

      try {
        await onConfirm?.({
          offeredOn:
            offeredOn ||
            undefined,

          expiresAt:
            expiresAt
              ? new Date(
                  expiresAt,
                ).toISOString()
              : undefined,

          responseNotes:
            responseNotes.trim() ||
            undefined,

          withdrawalReason:
            withdrawalReason.trim() ||
            undefined,
        });
      } catch {
        // Mutation errors are surfaced by offer state.
      }
    };

  const confirmClasses =
    configuration.tone ===
    "red"
      ? "bg-red-600 text-white hover:bg-red-700"
      : configuration.tone ===
          "emerald"
        ? "bg-emerald-600 text-white hover:bg-emerald-700"
        : "bg-indigo-600 text-white hover:bg-indigo-700";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-workflow-dialog-title"
        className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <ActionIcon
                size={22}
              />
            </div>

            <div>
              <h2
                id="offer-workflow-dialog-title"
                className="text-xl font-black text-slate-950"
              >
                {configuration.title}
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {configuration.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onClose?.()
            }
            disabled={loading}
            aria-label="Close offer workflow dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="space-y-5 p-5 sm:p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Admission offer
              </p>

              <p className="mt-2 font-black text-slate-950">
                {offer?.offer_number ||
                  "Offer number unavailable"}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Entry grade{" "}
                {offer?.entry_grade_level ||
                  "not set"}
              </p>
            </div>

            {requiresSendDates && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Offer date
                  </span>

                  <div className="relative">
                    <CalendarDays
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      value={
                        offeredOn
                      }
                      onChange={(
                        event,
                      ) =>
                        setOfferedOn(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        loading
                      }
                      className={`${INPUT_CLASSES} pl-11`}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Offer expiry
                  </span>

                  <input
                    type="datetime-local"
                    value={
                      expiresAt
                    }
                    onChange={(
                      event,
                    ) =>
                      setExpiresAt(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      INPUT_CLASSES
                    }
                  />
                </label>
              </div>
            )}

            {requiresResponseNotes && (
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  Response notes
                </span>

                <textarea
                  value={
                    responseNotes
                  }
                  onChange={(
                    event,
                  ) =>
                    setResponseNotes(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    loading
                  }
                  placeholder={
                    action ===
                    "accept"
                      ? "Optional notes about the applicant's acceptance."
                      : "Optional notes about the applicant's decline."
                  }
                  className={
                    TEXTAREA_CLASSES
                  }
                />
              </label>
            )}

            {requiresWithdrawalReason && (
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  Withdrawal reason
                </span>

                <textarea
                  value={
                    withdrawalReason
                  }
                  onChange={(
                    event,
                  ) =>
                    setWithdrawalReason(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    loading
                  }
                  placeholder="Explain why this offer is being withdrawn."
                  className={
                    TEXTAREA_CLASSES
                  }
                />
              </label>
            )}

            {(localError ||
              error) && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <p className="text-sm font-black leading-6 text-red-800">
                    {localError ||
                      error}
                  </p>
                </div>
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:p-6">
            <button
              type="button"
              onClick={() =>
                onClose?.()
              }
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
                confirmClasses,
              ].join(" ")}
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <ActionIcon
                  size={17}
                />
              )}

              {loading
                ? "Processing..."
                : configuration.confirmLabel}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
