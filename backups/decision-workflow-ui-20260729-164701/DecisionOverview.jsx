import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Gavel,
  Pencil,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  getAdmissionDecisionLabel,
  getAdmissionStatusLabel,
} from "../constants";

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
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
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function DecisionStatusBadge({
  status,
}) {
  const tone =
    status === "approved" ||
    status === "published"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "withdrawn" ||
          status === "superseded"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "pending_approval"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-indigo-200 bg-indigo-50 text-indigo-700";

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

function DecisionOutcomeBadge({
  decision,
}) {
  const tone =
    decision === "approved" ||
    decision ===
      "conditionally_approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : decision === "rejected"
        ? "border-red-200 bg-red-50 text-red-700"
        : decision === "waitlisted" ||
            decision === "deferred" ||
            decision ===
              "additional_review"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        tone,
      ].join(" ")}
    >
      {getAdmissionDecisionLabel(
        decision,
      )}
    </span>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {Icon && (
          <Icon
            size={15}
          />
        )}

        <p className="text-xs font-black uppercase tracking-[0.12em]">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-black leading-6 text-slate-900">
        {value ||
          "Not recorded"}
      </p>
    </div>
  );
}

function TextSection({
  title,
  value,
  emptyText,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h4 className="font-black text-slate-950">
        {title}
      </h4>

      <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
        {value ||
          emptyText}
      </p>
    </section>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  value,
  complete,
}) {
  return (
    <div className="flex gap-3">
      <div
        className={[
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
          complete
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-slate-50 text-slate-400",
        ].join(" ")}
      >
        <Icon
          size={16}
        />
      </div>

      <div>
        <p className="text-sm font-black text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DecisionOverview({
  decision,
  canEditDecision,
  onEditDecision,
}) {
  if (!decision) {
    return (
      <div className="flex min-h-[620px] items-center justify-center bg-white p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Gavel
              size={26}
            />
          </div>

          <h3 className="mt-4 text-xl font-black text-slate-950">
            Select a decision
          </h3>

          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Choose a decision from
            the queue to review its
            outcome, rationale,
            conditions, approval
            status, and publication
            history.
          </p>
        </div>
      </div>
    );
  }

  const applicationNumber =
    decision
      .application_number ||
    decision
      .application
      ?.application_number ||
    "Admission decision";

  return (
    <article className="min-w-0 bg-white">
      <header className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DecisionStatusBadge
                status={
                  decision.status
                }
              />

              <DecisionOutcomeBadge
                decision={
                  decision.decision
                }
              />
            </div>

            <h3 className="mt-4 break-words text-2xl font-black text-slate-950">
              {applicationNumber}
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Decision record for
              application review,
              approval, and applicant
              publication.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onEditDecision?.(
                decision,
              )
            }
            disabled={
              !canEditDecision ||
              ![
                "draft",
                "pending_approval",
              ].includes(
                decision.status,
              )
            }
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil
              size={16}
            />

            Edit decision
          </button>
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        <section>
          <div className="flex items-center gap-2">
            <FileCheck2
              size={18}
              className="text-indigo-600"
            />

            <h4 className="font-black text-slate-950">
              Decision details
            </h4>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem
              icon={Gavel}
              label="Outcome"
              value={
                getAdmissionDecisionLabel(
                  decision.decision,
                )
              }
            />

            <DetailItem
              icon={ShieldCheck}
              label="Workflow status"
              value={
                getAdmissionStatusLabel(
                  decision.status,
                )
              }
            />

            <DetailItem
              icon={CalendarClock}
              label="Effective date"
              value={
                formatDate(
                  decision.effective_on,
                )
              }
            />

            <DetailItem
              icon={Clock3}
              label="Expiration date"
              value={
                formatDate(
                  decision.expires_on,
                )
              }
            />

            <DetailItem
              icon={UserRound}
              label="Recommended by"
              value={
                decision
                  .recommended_by_name ||
                decision
                  .recommended_by ||
                "Not recorded"
              }
            />

            <DetailItem
              icon={CheckCircle2}
              label="Approved by"
              value={
                decision
                  .approved_by_name ||
                decision
                  .approved_by ||
                "Not recorded"
              }
            />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <TextSection
            title="Decision rationale"
            value={
              decision
                .decision_reason
            }
            emptyText="No decision rationale has been recorded."
          />

          <TextSection
            title="Review summary"
            value={
              decision
                .review_summary
            }
            emptyText="No review summary has been recorded."
          />

          <TextSection
            title="Conditions"
            value={
              decision.conditions
            }
            emptyText="This decision has no recorded conditions."
          />

          <TextSection
            title="Internal notes"
            value={
              decision
                .internal_notes
            }
            emptyText="No internal notes have been recorded."
          />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <FileText
              size={18}
              className="text-indigo-600"
            />

            <h4 className="font-black text-slate-950">
              Decision timeline
            </h4>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <TimelineItem
              icon={FileText}
              title="Decision created"
              value={
                formatDateTime(
                  decision.created_at,
                )
              }
              complete={
                Boolean(
                  decision.created_at,
                )
              }
            />

            <TimelineItem
              icon={Gavel}
              title="Submitted for approval"
              value={
                formatDateTime(
                  decision.recommended_at,
                )
              }
              complete={
                Boolean(
                  decision.recommended_at,
                )
              }
            />

            <TimelineItem
              icon={CheckCircle2}
              title="Decision approved"
              value={
                formatDateTime(
                  decision.approved_at,
                )
              }
              complete={
                Boolean(
                  decision.approved_at,
                )
              }
            />

            <TimelineItem
              icon={Send}
              title="Decision published"
              value={
                formatDateTime(
                  decision.published_at,
                )
              }
              complete={
                Boolean(
                  decision.published_at,
                )
              }
            />
          </div>
        </section>
      </div>
    </article>
  );
}