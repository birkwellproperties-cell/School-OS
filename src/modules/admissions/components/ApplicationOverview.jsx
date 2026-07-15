import {
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  FileText,
  Gavel,
  GraduationCap,
  Pencil,
  Send,
  Upload,
  UserRound,
} from "lucide-react";

import {
  getAdmissionStatusLabel,
} from "../constants";

import ApplicationDocuments
  from "./ApplicationDocuments";

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

function ApplicationStatusBadge({
  status,
}) {
  const tone =
    status === "approved" ||
    status === "offer_accepted" ||
    status === "enrolled"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "rejected" ||
          status === "withdrawn" ||
          status === "cancelled" ||
          status === "offer_declined"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "waitlisted" ||
            status === "documents_pending" ||
            status === "assessment_pending" ||
            status === "interview_pending" ||
            status === "decision_pending"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-indigo-200 bg-indigo-50 text-indigo-700";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        tone,
      ].join(" ")}
    >
      {getAdmissionStatusLabel(status)}
    </span>
  );
}

function PriorityBadge({
  priority,
}) {
  const tone =
    priority === "urgent"
      ? "border-red-200 bg-red-50 text-red-700"
      : priority === "high"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : priority === "low"
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        tone,
      ].join(" ")}
    >
      {getAdmissionStatusLabel(priority)}
    </span>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-950">
        {value || "Not set"}
      </p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
        <Icon size={18} />
      </div>

      <div>
        <h4 className="font-black text-slate-950">
          {title}
        </h4>

        {description && (
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptySelection() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <ClipboardList size={25} />
        </div>

        <h3 className="mt-5 text-lg font-black text-slate-950">
          Select an application
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
          Choose an application from the queue to review its
          overview and continue the admissions workflow.
        </p>
      </div>
    </div>
  );
}

function ProgressStage({
  label,
  complete,
}) {
  const Icon = complete
    ? CheckCircle2
    : Circle;

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-2xl border p-3",
        complete
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <Icon
        size={19}
        className={
          complete
            ? "text-emerald-600"
            : "text-slate-400"
        }
      />

      <p
        className={[
          "text-sm font-black",
          complete
            ? "text-emerald-800"
            : "text-slate-600",
        ].join(" ")}
      >
        {label}
      </p>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  last = false,
}) {
  return (
    <div className="relative flex gap-4">
      {!last && (
        <div className="absolute left-[7px] top-5 h-[calc(100%+0.5rem)] w-px bg-slate-200" />
      )}

      <div className="relative mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-indigo-100 bg-indigo-600" />

      <div className="pb-5">
        <p className="text-sm font-black text-slate-900">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          {value}
        </p>
      </div>
    </div>
  );
}

function LifecycleAction({
  icon: Icon,
  label,
  disabled = false,
  onClick,
  primary = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition",
        primary
          ? "bg-indigo-600 text-white hover:bg-indigo-500"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        "disabled:cursor-not-allowed disabled:opacity-45",
      ].join(" ")}
    >
      <Icon size={16} />

      {label}
    </button>
  );
}

export default function ApplicationOverview({
  application,
  canEditApplication,
  onEditApplication,
}) {
  if (!application) {
    return (
      <div className="p-4 sm:p-6">
        <EmptySelection />
      </div>
    );
  }

  const completionPercentage = Math.min(
    100,
    Math.max(
      0,
      Number(
        application.completion_percentage,
      ) || 0,
    ),
  );

  const progressStages = [
    {
      label: "Applicant created",
      complete: Boolean(
        application.applicant_id,
      ),
    },
    {
      label: "Application started",
      complete: Boolean(application.id),
    },
    {
      label: "Documents",
      complete:
        completionPercentage >= 20,
    },
    {
      label: "Assessment",
      complete:
        completionPercentage >= 40,
    },
    {
      label: "Interview",
      complete:
        completionPercentage >= 60,
    },
    {
      label: "Decision",
      complete:
        completionPercentage >= 80,
    },
    {
      label: "Offer",
      complete:
        completionPercentage >= 90,
    },
    {
      label: "Enrollment",
      complete:
        completionPercentage >= 100 ||
        application.status ===
          "enrolled",
    },
  ];

  const scrollToDocuments = () => {
    document
      .getElementById(
        "application-documents",
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ApplicationStatusBadge
                status={application.status}
              />

              <PriorityBadge
                priority={application.priority}
              />
            </div>

            <h3 className="mt-4 text-2xl font-black text-slate-950">
              {application.application_number ||
                "Unnumbered application"}
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Application for{" "}
              <span className="font-black text-slate-700">
                {application.entry_grade_level ||
                  "an unspecified grade"}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onEditApplication?.(
                application,
              )
            }
            disabled={!canEditApplication}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil size={16} />

            Edit application
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-black text-slate-800">
              Application completion
            </p>

            <p className="text-sm font-black text-indigo-700">
              {completionPercentage}%
            </p>
          </div>

          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader
          icon={ClipboardList}
          title="Application overview"
          description="Core application identity, ownership, and lifecycle dates."
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DetailItem
            label="Application number"
            value={
              application.application_number
            }
          />

          <DetailItem
            label="Application type"
            value={getAdmissionStatusLabel(
              application.application_type,
            )}
          />

          <DetailItem
            label="Entry grade"
            value={
              application.entry_grade_level
            }
          />

          <DetailItem
            label="Intended start"
            value={formatDate(
              application.intended_start_date,
            )}
          />

          <DetailItem
            label="Applicant ID"
            value={application.applicant_id}
          />

          <DetailItem
            label="Admission cycle ID"
            value={
              application.admission_cycle_id
            }
          />

          <DetailItem
            label="Assigned reviewer"
            value={
              application.assigned_reviewer_id ||
              "Unassigned"
            }
          />

          <DetailItem
            label="Created"
            value={formatDate(
              application.created_at,
            )}
          />

          <DetailItem
            label="Submitted"
            value={formatDate(
              application.submitted_at,
            )}
          />

          <DetailItem
            label="Last updated"
            value={formatDate(
              application.updated_at,
            )}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader
          icon={CheckCircle2}
          title="Application progress"
          description="Current completion across the admission lifecycle."
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {progressStages.map(
            (stage) => (
              <ProgressStage
                key={stage.label}
                label={stage.label}
                complete={stage.complete}
              />
            ),
          )}
        </div>
      </section>

      <ApplicationDocuments />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={UserRound}
            title="Applicant summary"
            description="Application-linked applicant information."
          />

          <div className="mt-5 space-y-3">
            <DetailItem
              label="Applicant ID"
              value={application.applicant_id}
            />

            <DetailItem
              label="Grade applying for"
              value={
                application.entry_grade_level
              }
            />

            <DetailItem
              label="Application type"
              value={getAdmissionStatusLabel(
                application.application_type,
              )}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={Clock3}
            title="Timeline preview"
            description="Key dates from the current application record."
          />

          <div className="mt-5">
            <TimelineItem
              label="Application created"
              value={formatDate(
                application.created_at,
              )}
            />

            <TimelineItem
              label="Application submitted"
              value={formatDate(
                application.submitted_at,
              )}
            />

            <TimelineItem
              label="Application updated"
              value={formatDate(
                application.updated_at,
              )}
              last
            />
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader
          icon={FileText}
          title="Notes and statements"
          description="Applicant-provided context and internal admissions notes."
        />

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Applicant statement
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
              {application.applicant_statement ||
                "No applicant statement has been recorded."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Internal notes
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
              {application.internal_notes ||
                "No internal notes have been recorded."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader
          icon={ClipboardList}
          title="Lifecycle actions"
          description="Continue the selected application through the admissions workflow."
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <LifecycleAction
            icon={Pencil}
            label="Edit application"
            primary
            disabled={!canEditApplication}
            onClick={() =>
              onEditApplication?.(
                application,
              )
            }
          />

          <LifecycleAction
            icon={Upload}
            label="View documents"
            onClick={scrollToDocuments}
          />

          <LifecycleAction
            icon={CalendarClock}
            label="Schedule assessment"
            disabled
          />

          <LifecycleAction
            icon={CalendarClock}
            label="Schedule interview"
            disabled
          />

          <LifecycleAction
            icon={Gavel}
            label="Record decision"
            disabled
          />

          <LifecycleAction
            icon={Send}
            label="Generate offer"
            disabled
          />

          <LifecycleAction
            icon={GraduationCap}
            label="Enroll student"
            disabled
          />
        </div>

        <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
          Additional lifecycle actions will activate as Documents,
          Assessment, Interview, Decision, Offer, and Enrollment
          phases are implemented.
        </p>
      </section>
    </div>
  );
}