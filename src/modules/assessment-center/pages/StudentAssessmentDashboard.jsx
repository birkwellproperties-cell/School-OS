import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  LoaderCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

import {
  useAssessment,
  useStudentAssessmentState,
} from "../context";

import StudentAssessmentSection from "../components/runtime/StudentAssessmentSection";

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="text-center">
        <LoaderCircle
          className="mx-auto h-8 w-8 animate-spin text-blue-600"
          aria-hidden="true"
        />

        <h2 className="mt-4 text-base font-semibold text-slate-950">
          Loading your assessments
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Your assignments and attempt history are being prepared.
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  refreshing,
  onRetry,
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
          <AlertCircle
            className="h-5 w-5"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-red-900">
            Your assessments could not be loaded
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-700">
            {message ||
              "An unexpected error occurred while loading your assessments."}
          </p>

          <button
            type="button"
            onClick={onRetry}
            disabled={refreshing}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
              aria-hidden="true"
            />

            Try again
          </button>
        </div>
      </div>
    </section>
  );
}

function PermissionState() {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
          <ShieldAlert
            className="h-5 w-5"
            aria-hidden="true"
          />
        </span>

        <div>
          <h2 className="text-base font-semibold text-amber-950">
            Assessment access is unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            Your account does not currently have permission to take
            assessments. Contact your school administrator if you believe this
            is incorrect.
          </p>
        </div>
      </div>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <ClipboardCheck
          className="h-7 w-7"
          aria-hidden="true"
        />
      </span>

      <h2 className="mt-5 text-lg font-semibold text-slate-950">
        No assessments have been assigned
      </h2>

      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
        New assessments will appear here after they are assigned and released
        by your school.
      </p>
    </section>
  );
}

function LaunchNotice({
  notice,
  onDismiss,
}) {
  if (!notice) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
          <PlayCircle
            className="h-4 w-4"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-blue-950">
            {notice.title}
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            {notice.message}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}

export default function StudentAssessmentDashboard() {
  const {
    service,
    currentUserId,
    workspaceReady,
    authorizationReady,
    canTakeAssessments,
  } = useAssessment();

  const {
    studentAssessments,
    studentAssessmentGroups,

    studentAssessmentsLoading,
    studentAssessmentsError,
    studentAssessmentsReady,

    selectedStudentAssessment,

    selectStudentAssessment,
    getStudentAssessmentLaunch,

    refreshStudentAssessments,
    clearStudentAssessmentsError,
  } = useStudentAssessmentState({
    service,
    currentUserId,
    workspaceReady,
    authorizationReady,
    canTakeAssessments,
  });

  const [
    launchNotice,
    setLaunchNotice,
  ] = useState(null);

  const summary = useMemo(
    () => ({
      available:
        studentAssessmentGroups.available.length,

      inProgress:
        studentAssessmentGroups.inProgress.length,

      upcoming:
        studentAssessmentGroups.upcoming.length,

      completed:
        studentAssessmentGroups.completed.length +
        studentAssessmentGroups.submitted.length,
    }),
    [
      studentAssessmentGroups,
    ],
  );

  const handleRefresh =
    useCallback(async () => {
      clearStudentAssessmentsError();
      setLaunchNotice(null);

      try {
        await refreshStudentAssessments();
      } catch {
        // The hook exposes the user-facing error state.
      }
    }, [
      clearStudentAssessmentsError,
      refreshStudentAssessments,
    ]);

  const handleSelect =
    useCallback(
      (assessment) => {
        selectStudentAssessment(
          assessment?.id,
        );
      },
      [
        selectStudentAssessment,
      ],
    );

  const handleLaunch =
    useCallback(
      (assessment) => {
        if (!assessment?.id) {
          return;
        }

        selectStudentAssessment(
          assessment.id,
        );

        const launch =
          getStudentAssessmentLaunch(
            assessment.id,
          );

        const assignmentTitle =
          assessment.assignment?.title ||
          assessment.assignment?.template?.name ||
          "Assessment";

        if (
          launch.action ===
          "resume"
        ) {
          setLaunchNotice({
            title: `Resume ${assignmentTitle}`,
            message:
              "The existing attempt was found successfully. The Assessment Player will be connected to this Resume action in the next implementation step.",
          });

          return;
        }

        if (
          launch.action ===
          "start"
        ) {
          setLaunchNotice({
            title: `Start ${assignmentTitle}`,
            message:
              "This assessment is ready to begin. The next implementation step will create the attempt, snapshot its questions, and open the Assessment Player.",
          });

          return;
        }

        if (
          assessment.availabilityStatus ===
            "submitted"
        ) {
          setLaunchNotice({
            title: `${assignmentTitle} submitted`,
            message:
              "Your attempt has been submitted and is waiting for grading or final review.",
          });

          return;
        }

        if (
          assessment.availabilityStatus ===
            "completed"
        ) {
          setLaunchNotice({
            title: `${assignmentTitle} completed`,
            message:
              "The results view will be connected after grading and result-release workflows are implemented.",
          });

          return;
        }

        setLaunchNotice({
          title: `${assignmentTitle} is unavailable`,
          message:
            "This assessment cannot currently be started or resumed. Review its availability dates and attempt limits.",
        });
      },
      [
        getStudentAssessmentLaunch,
        selectStudentAssessment,
      ],
    );

  const dashboardReady =
    workspaceReady &&
    authorizationReady;

  if (
    !dashboardReady
  ) {
    return (
      <LoadingState />
    );
  }

  if (
    !canTakeAssessments
  ) {
    return (
      <PermissionState />
    );
  }

  if (
    studentAssessmentsLoading &&
    !studentAssessmentsReady
  ) {
    return (
      <LoadingState />
    );
  }

  if (
    studentAssessmentsError &&
    !studentAssessmentsReady
  ) {
    return (
      <ErrorState
        message={
          studentAssessmentsError
        }
        refreshing={
          studentAssessmentsLoading
        }
        onRetry={
          handleRefresh
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-700">
              Assessment Center
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              My Assessments
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Review your available assessments, continue active attempts, and
              track submitted or completed work.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={
              studentAssessmentsLoading
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                studentAssessmentsLoading
                  ? "animate-spin"
                  : ""
              }`}
              aria-hidden="true"
            />

            Refresh
          </button>
        </div>

        {selectedStudentAssessment && (
          <p className="mt-4 border-t border-slate-200 pt-4 text-xs font-medium text-slate-500">
            Selected:{" "}
            <span className="font-semibold text-slate-700">
              {selectedStudentAssessment.assignment?.title ||
                selectedStudentAssessment.assignment?.template?.name ||
                "Assessment"}
            </span>
          </p>
        )}
      </header>

      {studentAssessmentsError && (
        <ErrorState
          message={
            studentAssessmentsError
          }
          refreshing={
            studentAssessmentsLoading
          }
          onRetry={
            handleRefresh
          }
        />
      )}

      <LaunchNotice
        notice={
          launchNotice
        }
        onDismiss={() =>
          setLaunchNotice(
            null,
          )
        }
      />

      {studentAssessments.length ===
      0 ? (
        <EmptyDashboard />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={
                PlayCircle
              }
              label="Available"
              value={
                summary.available
              }
              description="Ready to start"
            />

            <SummaryCard
              icon={
                RotateCcw
              }
              label="In Progress"
              value={
                summary.inProgress
              }
              description="Attempts you can resume"
            />

            <SummaryCard
              icon={
                CalendarClock
              }
              label="Upcoming"
              value={
                summary.upcoming
              }
              description="Scheduled for later"
            />

            <SummaryCard
              icon={
                CheckCircle2
              }
              label="Submitted or Completed"
              value={
                summary.completed
              }
              description="Finished assessment work"
            />
          </section>

          <StudentAssessmentSection
            title="In Progress"
            description="Continue assessments that already have an active attempt."
            assessments={
              studentAssessmentGroups.inProgress
            }
            emptyTitle="No assessments in progress"
            emptyDescription="Assessments you start will appear here until they are submitted."
            icon={
              RotateCcw
            }
            onLaunch={
              handleLaunch
            }
            onSelect={
              handleSelect
            }
          />

          <StudentAssessmentSection
            title="Available"
            description="These assessments are currently open and ready to begin."
            assessments={
              studentAssessmentGroups.available
            }
            emptyTitle="No assessments are ready"
            emptyDescription="There are no assessments available to start right now."
            icon={
              PlayCircle
            }
            onLaunch={
              handleLaunch
            }
            onSelect={
              handleSelect
            }
          />

          <StudentAssessmentSection
            title="Upcoming"
            description="These assessments have been assigned but their availability window has not opened."
            assessments={
              studentAssessmentGroups.upcoming
            }
            emptyTitle="No upcoming assessments"
            emptyDescription="You do not currently have any scheduled assessments waiting to open."
            icon={
              Clock3
            }
            onLaunch={
              handleLaunch
            }
            onSelect={
              handleSelect
            }
          />

          <StudentAssessmentSection
            title="Submitted"
            description="These attempts have been submitted and may still be awaiting grading."
            assessments={
              studentAssessmentGroups.submitted
            }
            emptyTitle="No submitted assessments"
            emptyDescription="Submitted attempts awaiting grading or review will appear here."
            icon={
              FileCheck2
            }
            onLaunch={
              handleLaunch
            }
            onSelect={
              handleSelect
            }
          />

          <StudentAssessmentSection
            title="Completed"
            description="These assessments have completed their submission and grading lifecycle."
            assessments={
              studentAssessmentGroups.completed
            }
            emptyTitle="No completed assessments"
            emptyDescription="Completed assessments and released results will appear here."
            icon={
              CheckCircle2
            }
            onLaunch={
              handleLaunch
            }
            onSelect={
              handleSelect
            }
          />

          <StudentAssessmentSection
            title="Expired or Unavailable"
            description="These assessments can no longer be started because their window closed, attempts were exhausted, or they were cancelled."
            assessments={[
              ...studentAssessmentGroups.expired,
              ...studentAssessmentGroups.unavailable,
            ]}
            emptyTitle="No expired assessments"
            emptyDescription="Assessments that become unavailable will appear here for reference."
            icon={
              ShieldAlert
            }
            onLaunch={
              handleLaunch
            }
            onSelect={
              handleSelect
            }
          />
        </>
      )}
    </div>
  );
}