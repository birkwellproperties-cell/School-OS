import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  useEffect,
} from "react";

import {
  getAdmissionStatusLabel,
} from "../constants";

import {
  useAdmissions,
} from "../hooks";

import ApplicationOverview
  from "./ApplicationOverview";

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

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
      {getAdmissionStatusLabel(
        status,
      )}
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
      {getAdmissionStatusLabel(
        priority,
      )}
    </span>
  );
}

export default function ApplicationWorkspace({
  onEditApplication,
}) {
  const {
    applications,
    applicationFilters,

    selectedApplicationId,
    selectedApplication,

    applicationsLoading,
    applicationsError,

    canEditApplications,

    setApplicationFilters,
    resetApplicationFilters,

    refreshApplications,
    selectApplication,

    selectedAdmissionCycle,
  } = useAdmissions();

  useEffect(() => {
    if (
      selectedApplicationId ||
      !applications.items.length
    ) {
      return;
    }

    selectApplication(
      applications.items[0],
    );
  }, [
    applications.items,
    selectedApplicationId,
    selectApplication,
  ]);

  const handleSearchChange = (
    event,
  ) => {
    setApplicationFilters({
      search:
        event.target.value,
    });
  };

  const handleStatusChange = (
    event,
  ) => {
    setApplicationFilters({
      status:
        event.target.value,
    });
  };

  const handlePriorityChange = (
    event,
  ) => {
    setApplicationFilters({
      priority:
        event.target.value,
    });
  };

  const goToPreviousPage = () => {
    if (applications.page <= 1) {
      return;
    }

    setApplicationFilters(
      {
        page:
          applications.page - 1,
      },
      {
        resetPage: false,
      },
    );
  };

  const goToNextPage = () => {
    if (
      applications.page >=
      applications.pageCount
    ) {
      return;
    }

    setApplicationFilters(
      {
        page:
          applications.page + 1,
      },
      {
        resetPage: false,
      },
    );
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-700">
              <ClipboardList
                size={18}
              />

              <p className="text-xs font-black uppercase tracking-[0.16em]">
                Operational workspace
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Application Workspace
            </h2>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Search, filter, select,
              and review applications
              for{" "}
              <span className="font-black text-slate-700">
                {selectedAdmissionCycle
                  ?.name ||
                  "the selected admission cycle"}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              refreshApplications()
            }
            disabled={
              applicationsLoading
            }
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                applicationsLoading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh applications
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={
                applicationFilters.search
              }
              onChange={
                handleSearchChange
              }
              placeholder="Search application number, grade, type, statement, or notes"
              className={`${INPUT_CLASSES} pl-11`}
            />
          </label>

          <select
            value={
              applicationFilters.status
            }
            onChange={
              handleStatusChange
            }
            className={INPUT_CLASSES}
          >
            <option value="">
              All statuses
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="submitted">
              Submitted
            </option>

            <option value="documents_pending">
              Documents pending
            </option>

            <option value="under_review">
              Under review
            </option>

            <option value="assessment_pending">
              Assessment pending
            </option>

            <option value="interview_pending">
              Interview pending
            </option>

            <option value="decision_pending">
              Decision pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="waitlisted">
              Waitlisted
            </option>

            <option value="rejected">
              Rejected
            </option>

            <option value="offer_sent">
              Offer sent
            </option>

            <option value="offer_accepted">
              Offer accepted
            </option>

            <option value="offer_declined">
              Offer declined
            </option>

            <option value="enrolled">
              Enrolled
            </option>

            <option value="withdrawn">
              Withdrawn
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

          <select
            value={
              applicationFilters.priority
            }
            onChange={
              handlePriorityChange
            }
            className={INPUT_CLASSES}
          >
            <option value="">
              All priorities
            </option>

            <option value="urgent">
              Urgent
            </option>

            <option value="high">
              High
            </option>

            <option value="normal">
              Normal
            </option>

            <option value="low">
              Low
            </option>
          </select>

          <button
            type="button"
            onClick={
              resetApplicationFilters
            }
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100"
          >
            <SlidersHorizontal
              size={16}
            />

            Reset
          </button>
        </div>
      </header>

      {applicationsError && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-4">
          <p className="font-black text-red-800">
            Applications could not
            be loaded.
          </p>

          <p className="mt-1 text-sm font-semibold text-red-700">
            {applicationsError}
          </p>
        </div>
      )}

      <div className="grid min-h-[620px] xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/70 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-black text-slate-950">
                Application queue
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {applications.total}{" "}
                application
                {applications.total === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            {applicationsLoading && (
              <Loader2
                size={18}
                className="animate-spin text-indigo-600"
              />
            )}
          </div>

          <div className="max-h-[620px] overflow-y-auto p-3">
            {!applicationsLoading &&
              !applications.items
                .length && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                  <FileText
                    size={24}
                    className="mx-auto text-slate-400"
                  />

                  <p className="mt-3 font-black text-slate-800">
                    No applications found
                  </p>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    Adjust the filters
                    or start an
                    application from the
                    Applicant Queue.
                  </p>
                </div>
              )}

            <div className="space-y-2">
              {applications.items.map(
                (application) => {
                  const selected =
                    application.id ===
                    selectedApplicationId;

                  return (
                    <button
                      key={
                        application.id
                      }
                      type="button"
                      onClick={() =>
                        selectApplication(
                          application,
                        )
                      }
                      className={[
                        "w-full rounded-2xl border p-4 text-left transition",
                        selected
                          ? "border-indigo-300 bg-indigo-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {application
                              .application_number ||
                              "Unnumbered application"}
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            {application
                              .entry_grade_level ||
                              "Grade not set"}
                            {" · "}
                            {getAdmissionStatusLabel(
                              application
                                .application_type,
                            )}
                          </p>
                        </div>

                        <PriorityBadge
                          priority={
                            application.priority
                          }
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <ApplicationStatusBadge
                          status={
                            application.status
                          }
                        />

                        <span className="text-xs font-bold text-slate-500">
                          {
                            application
                              .completion_percentage
                          }
                          % complete
                        </span>
                      </div>

                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        Updated{" "}
                        {formatDate(
                          application.updated_at ||
                            application.created_at,
                        )}
                      </p>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={
                goToPreviousPage
              }
              disabled={
                applications.page <=
                  1 ||
                applicationsLoading
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <p className="text-xs font-black text-slate-600">
              Page{" "}
              {applications.page} of{" "}
              {Math.max(
                applications.pageCount,
                1,
              )}
            </p>

            <button
              type="button"
              onClick={
                goToNextPage
              }
              disabled={
                applications.page >=
                  applications.pageCount ||
                applicationsLoading
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight
                size={17}
              />
            </button>
          </footer>
        </aside>

        <ApplicationOverview
          application={selectedApplication}
          canEditApplication={
            canEditApplications
          }
          onEditApplication={
            onEditApplication
          }
        />
      </div>
    </section>
  );
}