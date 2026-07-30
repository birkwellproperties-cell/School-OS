import {
  ChevronLeft,
  ChevronRight,
  FileCheck2,
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
  getAdmissionDecisionLabel,
  getAdmissionStatusLabel,
} from "../constants";

import {
  useAdmissions,
} from "../hooks";

import DecisionOverview
  from "./DecisionOverview";

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

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

export default function DecisionWorkspace({
  onCreateDecision,
  onEditDecision,
}) {
  const {
    decisions = {
      items: [],
      total: 0,
      page: 1,
      pageCount: 0,
    },

    decisionFilters = {
      search: "",
      status: "",
      decision: "",
      page: 1,
    },

    selectedDecisionId,
    selectedDecision,

    decisionsLoading,
    decisionsError,

    canCreateDecisions,
    canEditDecisions,

    setDecisionFilters,
    resetDecisionFilters,

    refreshDecisions,
    selectDecision,

    selectedAdmissionCycle,
  } = useAdmissions();

  const decisionItems =
    Array.isArray(
      decisions?.items,
    )
      ? decisions.items
      : [];

  useEffect(() => {
    if (
      selectedDecisionId ||
      !decisionItems.length
    ) {
      return;
    }

    selectDecision?.(
      decisionItems[0],
    );
  }, [
    decisionItems,
    selectedDecisionId,
    selectDecision,
  ]);

  const updateFilters = (
    updates,
    options,
  ) => {
    setDecisionFilters?.(
      updates,
      options,
    );
  };

  const handleSearchChange = (
    event,
  ) => {
    updateFilters({
      search:
        event.target.value,
    });
  };

  const handleStatusChange = (
    event,
  ) => {
    updateFilters({
      status:
        event.target.value,
    });
  };

  const handleDecisionChange = (
    event,
  ) => {
    updateFilters({
      decision:
        event.target.value,
    });
  };

  const goToPreviousPage = () => {
    const currentPage =
      Number(
        decisions.page,
      ) || 1;

    if (currentPage <= 1) {
      return;
    }

    updateFilters(
      {
        page:
          currentPage - 1,
      },
      {
        resetPage: false,
      },
    );
  };

  const goToNextPage = () => {
    const currentPage =
      Number(
        decisions.page,
      ) || 1;

    const pageCount =
      Number(
        decisions.pageCount,
      ) || 0;

    if (
      currentPage >=
      pageCount
    ) {
      return;
    }

    updateFilters(
      {
        page:
          currentPage + 1,
      },
      {
        resetPage: false,
      },
    );
  };

  const currentPage =
    Number(
      decisions.page,
    ) || 1;

  const pageCount =
    Number(
      decisions.pageCount,
    ) || 0;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-700">
              <FileCheck2
                size={18}
              />

              <p className="text-xs font-black uppercase tracking-[0.16em]">
                Review workspace
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Decision Workspace
            </h2>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Prepare, review,
              approve, and publish
              admission decisions for{" "}
              <span className="font-black text-slate-700">
                {selectedAdmissionCycle
                  ?.name ||
                  "the selected admission cycle"}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                refreshDecisions?.()
              }
              disabled={
                decisionsLoading
              }
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  decisionsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh decisions
            </button>

            <button
              type="button"
              onClick={() =>
                onCreateDecision?.()
              }
              disabled={
                !canCreateDecisions ||
                !selectedAdmissionCycle
              }
              className="flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              New decision
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_240px_auto]">
          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={
                decisionFilters
                  ?.search || ""
              }
              onChange={
                handleSearchChange
              }
              placeholder="Search decision, reason, conditions, summary, or notes"
              className={`${INPUT_CLASSES} pl-11`}
            />
          </label>

          <select
            value={
              decisionFilters
                ?.status || ""
            }
            onChange={
              handleStatusChange
            }
            className={
              INPUT_CLASSES
            }
          >
            <option value="">
              All workflow statuses
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="pending_approval">
              Pending approval
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="published">
              Published
            </option>

            <option value="superseded">
              Superseded
            </option>

            <option value="withdrawn">
              Withdrawn
            </option>
          </select>

          <select
            value={
              decisionFilters
                ?.decision || ""
            }
            onChange={
              handleDecisionChange
            }
            className={
              INPUT_CLASSES
            }
          >
            <option value="">
              All decision outcomes
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="conditionally_approved">
              Conditionally approved
            </option>

            <option value="waitlisted">
              Waitlisted
            </option>

            <option value="rejected">
              Rejected
            </option>

            <option value="deferred">
              Deferred
            </option>

            <option value="additional_review">
              Additional review
            </option>
          </select>

          <button
            type="button"
            onClick={() =>
              resetDecisionFilters?.()
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

      {decisionsError && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-4">
          <p className="font-black text-red-800">
            Decisions could not
            be loaded.
          </p>

          <p className="mt-1 text-sm font-semibold text-red-700">
            {decisionsError}
          </p>
        </div>
      )}

      <div className="grid min-h-[620px] xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/70 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-black text-slate-950">
                Decision queue
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {Number(
                  decisions.total,
                ) || 0}{" "}
                decision
                {Number(
                  decisions.total,
                ) === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            {decisionsLoading && (
              <Loader2
                size={18}
                className="animate-spin text-indigo-600"
              />
            )}
          </div>

          <div className="max-h-[620px] overflow-y-auto p-3">
            {!decisionsLoading &&
              !decisionItems.length && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                  <FileText
                    size={24}
                    className="mx-auto text-slate-400"
                  />

                  <p className="mt-3 font-black text-slate-800">
                    No decisions found
                  </p>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    Adjust the filters
                    or create a decision
                    for an application
                    ready for review.
                  </p>
                </div>
              )}

            <div className="space-y-2">
              {decisionItems.map(
                (
                  decisionRecord,
                ) => {
                  const selected =
                    decisionRecord.id ===
                    selectedDecisionId;

                  return (
                    <button
                      key={
                        decisionRecord.id
                      }
                      type="button"
                      onClick={() =>
                        selectDecision?.(
                          decisionRecord,
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
                            {decisionRecord
                              .application_number ||
                              decisionRecord
                                .application
                                ?.application_number ||
                              "Admission decision"}
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            Effective{" "}
                            {formatDate(
                              decisionRecord
                                .effective_on,
                            )}
                          </p>
                        </div>

                        <DecisionStatusBadge
                          status={
                            decisionRecord.status
                          }
                        />
                      </div>

                      <div className="mt-3">
                        <DecisionOutcomeBadge
                          decision={
                            decisionRecord.decision
                          }
                        />
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                        {decisionRecord
                          .decision_reason ||
                          decisionRecord
                            .review_summary ||
                          "No decision summary has been recorded."}
                      </p>

                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        Updated{" "}
                        {formatDate(
                          decisionRecord
                            .updated_at ||
                            decisionRecord
                              .created_at,
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
                currentPage <= 1 ||
                decisionsLoading
              }
              aria-label="Previous decision page"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <p className="text-xs font-black text-slate-600">
              Page{" "}
              {currentPage} of{" "}
              {Math.max(
                pageCount,
                1,
              )}
            </p>

            <button
              type="button"
              onClick={
                goToNextPage
              }
              disabled={
                currentPage >=
                  pageCount ||
                decisionsLoading
              }
              aria-label="Next decision page"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight
                size={17}
              />
            </button>
          </footer>
        </aside>

        <DecisionOverview
          decision={
            selectedDecision
          }
          canEditDecision={
            canEditDecisions
          }
          onEditDecision={
            onEditDecision
          }
        />
      </div>
    </section>
  );
}