import {
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  Loader2,
  MailCheck,
  Send,
  ShieldCheck,
  Undo2,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  getAdmissionStatusLabel,
} from "../constants";

import OfferWorkflowDialog
  from "./OfferWorkflowDialog";

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

function formatMoney(
  value,
  currencyCode = "USD",
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "Not set";
  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "Not set";
  }

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency:
          currencyCode ||
          "USD",
        maximumFractionDigits: 2,
      },
    ).format(amount);
  } catch {
    return `${amount.toFixed(
      2,
    )} ${currencyCode || "USD"}`;
  }
}

function getStatusTone(
  status,
) {
  if (
    status === "accepted"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "approved",
      "sent",
      "viewed",
    ].includes(status)
  ) {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (
    status ===
    "pending_approval"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    [
      "declined",
      "expired",
      "withdrawn",
      "superseded",
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

export default function OfferOverview({
  offer,

  canEditOffer = false,

  mutationLoading = false,
  mutationError = "",

  onEditOffer,
  onSubmitOffer,
  onApproveOffer,
  onSendOffer,
  onRecordViewed,
  onAcceptOffer,
  onDeclineOffer,
  onWithdrawOffer,
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

  const status =
    offer?.status ||
    "draft";

  const currencyCode =
    offer?.currency_code ||
    "USD";

  const netTuition =
    useMemo(() => {
      const tuition =
        Number(
          offer?.tuition_amount,
        ) || 0;

      const scholarship =
        Number(
          offer
            ?.scholarship_amount,
        ) || 0;

      const aid =
        Number(
          offer
            ?.financial_aid_amount,
        ) || 0;

      return Math.max(
        tuition -
          scholarship -
          aid,
        0,
      );
    }, [
      offer?.tuition_amount,
      offer?.scholarship_amount,
      offer?.financial_aid_amount,
    ]);

  if (!offer) {
    return (
      <div className="flex min-h-[620px] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <FileCheck2
            size={34}
            className="mx-auto text-slate-400"
          />

          <h3 className="mt-4 text-lg font-black text-slate-900">
            Select an offer
          </h3>

          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Choose an admission
            offer from the queue
            to review its financial
            terms and workflow.
          </p>
        </div>
      </div>
    );
  }

  const canEdit =
    canEditOffer &&
    [
      "draft",
      "pending_approval",
    ].includes(status);

  const availableActions = [];

  if (
    canEditOffer &&
    status === "draft"
  ) {
    availableActions.push({
      id:
        "submit_for_approval",
      label:
        "Submit for approval",
      icon:
        FileCheck2,
    });
  }

  if (
    canEditOffer &&
    status ===
      "pending_approval"
  ) {
    availableActions.push({
      id: "approve",
      label:
        "Approve offer",
      icon:
        ShieldCheck,
    });
  }

  if (
    canEditOffer &&
    status === "approved"
  ) {
    availableActions.push({
      id: "send",
      label:
        "Send offer",
      icon:
        Send,
    });
  }

  if (
    canEditOffer &&
    [
      "sent",
      "viewed",
    ].includes(status)
  ) {
    if (
      status === "sent"
    ) {
      availableActions.push({
        id:
          "record_viewed",
        label:
          "Mark as viewed",
        icon:
          Eye,
      });
    }

    availableActions.push(
      {
        id: "accept",
        label:
          "Record acceptance",
        icon:
          UserCheck,
      },
      {
        id: "decline",
        label:
          "Record decline",
        icon:
          UserX,
      },
    );
  }

  if (
    canEditOffer &&
    ![
      "accepted",
      "declined",
      "expired",
      "withdrawn",
      "superseded",
    ].includes(status)
  ) {
    availableActions.push({
      id: "withdraw",
      label:
        "Withdraw offer",
      icon:
        Undo2,
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
      if (
        !workflowAction ||
        !offer?.id
      ) {
        return;
      }

      if (
        workflowAction ===
        "submit_for_approval"
      ) {
        await onSubmitOffer?.(
          offer.id,
        );
      }

      if (
        workflowAction ===
        "approve"
      ) {
        await onApproveOffer?.(
          offer.id,
        );
      }

      if (
        workflowAction ===
        "send"
      ) {
        await onSendOffer?.(
          offer.id,
          {
            offeredOn:
              payload.offeredOn,
            expiresAt:
              payload.expiresAt,
          },
        );
      }

      if (
        workflowAction ===
        "record_viewed"
      ) {
        await onRecordViewed?.(
          offer.id,
        );
      }

      if (
        workflowAction ===
        "accept"
      ) {
        await onAcceptOffer?.(
          offer.id,
          {
            responseNotes:
              payload.responseNotes,
          },
        );
      }

      if (
        workflowAction ===
        "decline"
      ) {
        await onDeclineOffer?.(
          offer.id,
          {
            responseNotes:
              payload.responseNotes,
          },
        );
      }

      if (
        workflowAction ===
        "withdraw"
      ) {
        await onWithdrawOffer?.(
          offer.id,
          {
            withdrawalReason:
              payload.withdrawalReason,
          },
        );
      }

      setWorkflowDialogOpen(
        false,
      );

      setWorkflowAction("");
    };

  return (
    <>
      <div className="min-h-[620px]">
        <header className="border-b border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="truncate text-2xl font-black text-slate-950">
                  {offer.offer_number ||
                    "Admission offer"}
                </h3>

                <StatusBadge
                  status={status}
                />
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Application{" "}
                {offer.application_number ||
                  offer.application
                    ?.application_number ||
                  "not loaded"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Entry grade{" "}
                  {offer.entry_grade_level ||
                    "not set"}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Start{" "}
                  {formatDate(
                    offer.intended_start_date,
                  )}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Currency{" "}
                  {currencyCode}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() =>
                    onEditOffer?.(
                      offer,
                    )
                  }
                  disabled={
                    mutationLoading
                  }
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Edit3 size={16} />
                  Edit offer
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
                      id ===
                        "withdraw"
                        ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : id ===
                            "decline"
                          ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
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
                    Offer action failed
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
              <BadgeDollarSign
                size={18}
                className="text-indigo-700"
              />

              <h4 className="text-lg font-black text-slate-950">
                Financial terms
              </h4>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailCard
                icon={
                  BadgeDollarSign
                }
                label="Tuition"
                value={formatMoney(
                  offer.tuition_amount,
                  currencyCode,
                )}
              />

              <DetailCard
                icon={
                  CheckCircle2
                }
                label="Scholarship"
                value={formatMoney(
                  offer.scholarship_amount,
                  currencyCode,
                )}
              />

              <DetailCard
                icon={
                  ShieldCheck
                }
                label="Financial aid"
                value={formatMoney(
                  offer.financial_aid_amount,
                  currencyCode,
                )}
              />

              <DetailCard
                icon={
                  MailCheck
                }
                label="Deposit"
                value={formatMoney(
                  offer.deposit_amount,
                  currencyCode,
                )}
                description={
                  offer.deposit_due_on
                    ? `Due ${formatDate(
                        offer.deposit_due_on,
                      )}`
                    : "No deposit due date"
                }
              />

              <DetailCard
                icon={
                  BadgeDollarSign
                }
                label="Estimated net tuition"
                value={formatMoney(
                  netTuition,
                  currencyCode,
                )}
                description="Tuition less scholarship and financial aid."
              />

              <DetailCard
                icon={
                  CalendarDays
                }
                label="Offer expiry"
                value={formatDate(
                  offer.expires_at,
                  {
                    includeTime:
                      true,
                  },
                )}
              />
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <FileText
                  size={18}
                  className="text-indigo-700"
                />

                <h4 className="font-black text-slate-950">
                  Offer message
                </h4>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
                {offer.offer_message ||
                  "No offer message has been recorded."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <GraduationCap
                  size={18}
                  className="text-indigo-700"
                />

                <h4 className="font-black text-slate-950">
                  Conditions
                </h4>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
                {offer.conditions ||
                  "No conditions have been recorded."}
              </p>
            </div>
          </section>

          {offer.internal_notes && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h4 className="font-black text-amber-900">
                Internal notes
              </h4>

              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-amber-800">
                {offer.internal_notes}
              </p>
            </section>
          )}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Clock3
                size={18}
                className="text-indigo-700"
              />

              <h4 className="font-black text-slate-950">
                Offer timeline
              </h4>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <TimelineItem
                icon={FileText}
                label="Created"
                value={formatDate(
                  offer.created_at,
                  {
                    includeTime: true,
                  },
                )}
                complete={Boolean(
                  offer.created_at,
                )}
              />

              <TimelineItem
                icon={ShieldCheck}
                label="Approved"
                value={formatDate(
                  offer.approved_at,
                  {
                    includeTime: true,
                  },
                )}
                complete={Boolean(
                  offer.approved_at,
                )}
              />

              <TimelineItem
                icon={Send}
                label="Sent"
                value={formatDate(
                  offer.sent_at,
                  {
                    includeTime: true,
                  },
                )}
                complete={Boolean(
                  offer.sent_at,
                )}
              />

              <TimelineItem
                icon={Eye}
                label="Viewed"
                value={formatDate(
                  offer.viewed_at,
                  {
                    includeTime: true,
                  },
                )}
                complete={Boolean(
                  offer.viewed_at,
                )}
              />

              <TimelineItem
                icon={
                  status === "declined"
                    ? UserX
                    : UserCheck
                }
                label="Response"
                value={
                  offer.responded_at
                    ? `${getAdmissionStatusLabel(
                        status,
                      )} on ${formatDate(
                        offer.responded_at,
                        {
                          includeTime:
                            true,
                        },
                      )}`
                    : "No response recorded"
                }
                complete={Boolean(
                  offer.responded_at,
                )}
              />

              <TimelineItem
                icon={Undo2}
                label="Withdrawn"
                value={formatDate(
                  offer.withdrawn_at,
                  {
                    includeTime: true,
                  },
                )}
                complete={Boolean(
                  offer.withdrawn_at,
                )}
              />
            </div>
          </section>

          {offer.response_notes && (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="font-black text-slate-950">
                Response notes
              </h4>

              <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
                {offer.response_notes}
              </p>
            </section>
          )}

          {offer.withdrawal_reason && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h4 className="font-black text-red-900">
                Withdrawal reason
              </h4>

              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-red-800">
                {offer.withdrawal_reason}
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
                Updating admission offer...
              </p>
            </div>
          )}
        </div>
      </div>

      <OfferWorkflowDialog
        open={workflowDialogOpen}
        action={workflowAction}
        offer={offer}
        loading={mutationLoading}
        error={mutationError}
        onClose={closeWorkflow}
        onConfirm={handleWorkflowConfirm}
      />
    </>
  );
}
