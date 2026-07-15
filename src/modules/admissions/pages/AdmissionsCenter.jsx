import {
  useState,
} from "react";

import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FilePlus2,
  GraduationCap,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  Users,
} from "lucide-react";

import {
  AdmissionCycleDialog,
  AdmissionCycleSelector,
  AdmissionsMetricCard,
  AdmissionsSection,
  AdmissionsTable,
  ApplicantDialog,
  ApplicantQueue,
  ApplicationWorkspace,
  ConvertInquiryDialog,
  InquiryDialog,
  InquiryQueue,
  QuickActionCard,
  ApplicationDialog,
} from "../components";

import {
  AdmissionsPermission,
  getAdmissionStatusLabel,
} from "../constants";

import {
  AdmissionsProvider,
} from "../context";

import {
  useAdmissions,
} from "../hooks";

import {
  useAuthorization,
} from "../../../platform/authorization";

function StatusBadge({ status }) {
  const tone =
    status === "approved" ||
    status === "accepted" ||
    status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "rejected" ||
          status === "cancelled" ||
          status === "declined"
        ? "bg-red-50 text-red-700"
        : status === "waitlisted" ||
            status === "documents_pending"
          ? "bg-amber-50 text-amber-700"
          : "bg-indigo-50 text-indigo-700";

  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-black",
        tone,
      ].join(" ")}
    >
      {getAdmissionStatusLabel(status)}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function getApplicantName(record) {
  return [
    record?.prospective_student_first_name,
    record?.prospective_student_middle_name,
    record?.prospective_student_last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

function AdmissionsWorkspace() {

  const [
    cycleDialogMode,
    setCycleDialogMode,
  ] = useState(false);

  const [
    inquiryDialogMode,
    setInquiryDialogMode,
  ] = useState(null);

  const [
    applicantDialogMode,
    setApplicantDialogMode,
  ] = useState(null);

  const [
    applicationDialogMode,
    setApplicationDialogMode,
  ] = useState(null);

  const [
    selectedApplicationRecord,
    setSelectedApplicationRecord,
  ] = useState(null);

  const [
    applicationApplicant,
    setApplicationApplicant,
  ] = useState(null);

  const [
    conversionInquiry,
    setConversionInquiry,
  ] = useState(null);

  const closeApplicationDialog = () => {
    setApplicationDialogMode(null);
    setApplicationApplicant(null);
    setSelectedApplicationRecord(null);
  };

  const {
    loading,
    error,
    metrics,
    recentInquiries,
    priorityApplications,
    upcomingInterviews,
    loadedAt,
    selectedAdmissionCycle,
    selectedInquiry,
    selectedApplicant,
    refreshDashboard,
  } = useAdmissions();

  const {
    hasPermission,
  } = useAuthorization();

  const canCreate =
    hasPermission(
      AdmissionsPermission.CREATE,
    );

  const canReview =
    hasPermission(
      AdmissionsPermission.REVIEW,
    );

  const canApprove =
    hasPermission(
      AdmissionsPermission.APPROVE,
    );

  const conversionPercentage =
    `${Math.round(
      (metrics.conversionRate || 0) * 100,
    )}%`;

  const inquiryColumns = [
    {
      key: "student",
      label: "Prospective student",
      render: (row) => (
        <div>
          <p className="font-black text-slate-900">
            {getApplicantName(row) ||
              "Unnamed prospect"}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {row.inquiry_number || "No inquiry number"}
          </p>
        </div>
      ),
    },
    {
      key: "contact_name",
      label: "Primary contact",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: "created_at",
      label: "Received",
      render: (row) =>
        formatDate(row.created_at),
    },
  ];

  const applicationColumns = [
    {
      key: "application_number",
      label: "Application",
      render: (row) => (
        <div>
          <p className="font-black text-slate-900">
            {row.application_number}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {row.entry_grade_level || "Grade not set"}
          </p>
        </div>
      ),
    },
    {
      key: "application_type",
      label: "Type",
      render: (row) =>
        getAdmissionStatusLabel(
          row.application_type,
        ),
    },
    {
      key: "status",
      label: "Stage",
      render: (row) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (row) =>
        getAdmissionStatusLabel(row.priority),
    },
    {
      key: "submitted_at",
      label: "Submitted",
      render: (row) =>
        formatDate(row.submitted_at),
    },
  ];

  const interviewColumns = [
    {
      key: "interview_type",
      label: "Interview",
      render: (row) => (
        <div>
          <p className="font-black text-slate-900">
            {getAdmissionStatusLabel(
              row.interview_type,
            )}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {row.location_details ||
              getAdmissionStatusLabel(
                row.location_type,
              )}
          </p>
        </div>
      ),
    },
    {
      key: "scheduled_start_at",
      label: "Scheduled",
      render: (row) =>
        formatDate(
          row.scheduled_start_at,
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge status={row.status} />
      ),
    },
  ];

  return (
    <main className="space-y-6">
      <header className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">
              Student lifecycle
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              Admissions Center
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
              Govern inquiries, applicants, applications,
              documents, interviews, decisions, offers, and
              enrollment conversion from one workspace.
            </p>
            <div className="mt-6">
              <AdmissionCycleSelector
                onCreateCycle={() =>
                  setCycleDialogMode("create")
                }
                onEditCycle={() =>
                  setCycleDialogMode("edit")
                }
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => refreshDashboard()}
            disabled={loading}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {loadedAt && (
          <p className="mt-5 text-xs font-semibold text-slate-500">
            Last refreshed {formatDate(loadedAt)}
          </p>
        )}
      </header>

      <AdmissionCycleDialog
        open={Boolean(cycleDialogMode)}
        mode={
          cycleDialogMode || "create"
        }
        cycle={
          cycleDialogMode === "edit"
            ? selectedAdmissionCycle
            : null
        }
        onClose={() =>
          setCycleDialogMode(null)
        }
      />

      <InquiryDialog
        open={Boolean(inquiryDialogMode)}
        mode={
          inquiryDialogMode || "create"
        }
        inquiry={
          inquiryDialogMode === "edit"
            ? selectedInquiry
            : null
        }
        onClose={() =>
          setInquiryDialogMode(null)
        }
      />

      <ApplicantDialog
        open={Boolean(
          applicantDialogMode,
        )}
        mode={
          applicantDialogMode ||
          "create"
        }
        applicant={
          applicantDialogMode ===
            "edit"
              ? selectedApplicant
              : null
        }
        onClose={() =>
          setApplicantDialogMode(null)
        }
      />

      <ApplicationDialog
        open={Boolean(
          applicationDialogMode,
        )}
        mode={
          applicationDialogMode ||
          "create"
        }
        applicant={
          applicationApplicant
        }
        application={selectedApplicationRecord}
        onClose={
          closeApplicationDialog
        }
        onSaved={() => {
          closeApplicationDialog();
        }}
      />

      <ConvertInquiryDialog
        open={Boolean(
          conversionInquiry,
        )}
        inquiry={conversionInquiry}
        onClose={() =>
          setConversionInquiry(null)
        }
        onConverted={() =>
          setConversionInquiry(null)
        }
      />

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <p className="font-black text-red-800">
            Admissions data could not be loaded.
          </p>

          <p className="mt-2 text-sm font-semibold text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => refreshDashboard()}
            className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white"
          >
            Try again
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdmissionsMetricCard
          label="Open inquiries"
          value={metrics.openInquiries}
          helper="Prospective families requiring follow-up."
          icon={Search}
          tone="blue"
        />

        <AdmissionsMetricCard
          label="Applicants"
          value={metrics.totalApplicants}
          helper="Prospective students in the Admissions lifecycle."
          icon={Users}
          tone="indigo"
        />

        <AdmissionsMetricCard
          label="Open applications"
          value={metrics.openApplications}
          helper="Applications currently moving through review."
          icon={ClipboardList}
          tone="amber"
        />

        <AdmissionsMetricCard
          label="Enrollment conversion"
          value={conversionPercentage}
          helper={`${metrics.completedEnrollments} completed enrollment conversions.`}
          icon={GraduationCap}
          tone="emerald"
        />

        <AdmissionsMetricCard
          label="Pending documents"
          value={metrics.pendingDocuments}
          icon={FileCheck2}
        />

        <AdmissionsMetricCard
          label="Upcoming interviews"
          value={metrics.upcomingInterviews}
          icon={CalendarClock}
          tone="blue"
        />

        <AdmissionsMetricCard
          label="Pending decisions"
          value={metrics.pendingDecisions}
          icon={CheckCircle2}
          tone="amber"
        />

        <AdmissionsMetricCard
          label="Open offers"
          value={metrics.openOffers}
          icon={Send}
          tone="indigo"
        />
      </section>

      <ApplicationWorkspace
        onEditApplication={(application) => {
          setSelectedApplicationRecord(application);
          setApplicationDialogMode("edit");
        }}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdmissionsSection
          title="Recent inquiries"
          description="Newest prospective-family contacts entering the admissions pipeline."
        >
          <AdmissionsTable
            columns={inquiryColumns}
            rows={
              recentInquiries.items || []
            }
            emptyTitle="No admission inquiries"
            emptyDescription="Create the first inquiry to begin tracking prospective families."
          />
        </AdmissionsSection>

        <AdmissionsSection
          title="Upcoming interviews"
          description="Scheduled applicant interviews and assessments requiring coordination."
        >
          <AdmissionsTable
            columns={interviewColumns}
            rows={
              upcomingInterviews.items || []
            }
            emptyTitle="No upcoming interviews"
            emptyDescription="Scheduled interviews will appear here."
          />
        </AdmissionsSection>
      </div>

      <AdmissionsSection
        title="Priority applications"
        description="Active applications requiring review, documentation, decisions, or offer action."
      >
        <AdmissionsTable
          columns={applicationColumns}
          rows={
            priorityApplications.items || []
          }
          emptyTitle="No active applications"
          emptyDescription="Submitted and in-progress applications will appear here."
        />
      </AdmissionsSection>
      
      <InquiryQueue
        onCreateInquiry={() =>
          setInquiryDialogMode("create")
        }
        onEditInquiry={() =>
          setInquiryDialogMode("edit")
        }
        onConvertInquiry={(inquiry) =>
          setConversionInquiry(inquiry)
        }
      />

      <ApplicantQueue
        onCreateApplicant={() =>
          setApplicantDialogMode(
            "create",
          )
        }
        onEditApplicant={() =>
          setApplicantDialogMode(
            "edit",
          )
        }
        onCreateApplication={(
          applicant,
        ) => {
          setApplicationApplicant(
            applicant,
          );

          setApplicationDialogMode(
            "create",
          );
        }}
      />

      <section>
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Quick actions
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Start common Admissions workflows.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionCard
            title="New applicant"
            description="Create a prospective student record and guardian relationships."
            icon={Users}
            disabled={!canCreate}
            onClick={() =>
              setApplicantDialogMode(
                "create",
              )
            }
          />

          <QuickActionCard
            title="New applicant"
            description="Create a prospective student record and guardian relationships."
            icon={Users}
            disabled={!canCreate}
          />

          <QuickActionCard
            title="Review applications"
            description="Open the active application review queue."
            icon={ClipboardList}
            disabled={!canReview}
          />

          <QuickActionCard
            title="Decision queue"
            description="Review and approve pending admission decisions."
            icon={FilePlus2}
            disabled={!canApprove}
          />
        </div>
      </section>
    </main>
  );
}

export default function AdmissionsCenter() {
  return (
    <AdmissionsProvider>
      <AdmissionsWorkspace />
    </AdmissionsProvider>
  );
}
