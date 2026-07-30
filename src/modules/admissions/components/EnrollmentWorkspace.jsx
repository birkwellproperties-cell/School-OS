import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Plus,
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

import EnrollmentOverview
  from "./EnrollmentOverview";

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

function formatDate(
  value,
) {
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
    "en-US",
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function getStatusTone(
  status,
) {
  if (
    status === "completed"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "validating",
      "ready",
      "processing",
    ].includes(status)
  ) {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (
    status === "pending"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    [
      "failed",
      "cancelled",
      "reversed",
    ].includes(status)
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function EnrollmentStatusBadge({
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

export default function EnrollmentWorkspace({
  onCreateEnrollment,
  onEditEnrollment,
}) {
  const {
    enrollmentConversions = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
      pageCount: 0,
    },

    enrollmentFilters = {
      search: "",
      status: "",
      page: 1,
      pageSize: 25,
    },

    selectedEnrollmentConversion,
    selectedEnrollmentConversionId,

    enrollmentConversionsLoading,
    enrollmentConversionsError,

    enrollmentMutationLoading,
    enrollmentMutationError,

    canCreateEnrollments,
    canEditEnrollments,

    setEnrollmentFilters,
    resetEnrollmentFilters,

    selectEnrollmentConversion,
    refreshEnrollmentConversions,

    validateEnrollmentConversion,
    markEnrollmentReady,
    startEnrollmentProcessing,
    completeEnrollmentConversion,
    failEnrollmentConversion,
    cancelEnrollmentConversion,
    reverseEnrollmentConversion,

    clearEnrollmentMutationError,

    selectedAdmissionCycle,
  } = useAdmissions();

  const conversionItems =
    Array.isArray(
      enrollmentConversions
        ?.items,
    )
      ? enrollmentConversions
          .items
      : [];

  const currentPage =
    Number(
      enrollmentConversions
        ?.page,
    ) ||
    Number(
      enrollmentFilters.page,
    ) ||
    1;

  const pageCount =
    Number(
      enrollmentConversions
        ?.pageCount,
    ) ||
    0;

  useEffect(() => {
    if (
      conversionItems.length ===
      0
    ) {
      return;
    }

    const selectedExists =
      conversionItems.some(
        (conversion) =>
          conversion.id ===
          selectedEnrollmentConversionId,
      );

    if (!selectedExists) {
      selectEnrollmentConversion?.(
        conversionItems[0],
      );
    }
  }, [
    conversionItems,
    selectedEnrollmentConversionId,
    selectEnrollmentConversion,
  ]);

  const updateFilter = (
    key,
    value,
  ) => {
    setEnrollmentFilters?.({
      [key]: value,
      page: 1,
    });
  };

  const goToPreviousPage =
    () => {
      if (currentPage <= 1) {
        return;
      }

      setEnrollmentFilters?.({
        page:
          currentPage - 1,
      });
    };

  const goToNextPage =
    () => {
      if (
        currentPage >=
        pageCount
      ) {
        return;
      }

      setEnrollmentFilters?.({
        page:
          currentPage + 1,
      });
    };

  const selectedConversion =
    selectedEnrollmentConversion ||
    conversionItems.find(
      (conversion) =>
        conversion.id ===
        selectedEnrollmentConversionId,
    ) ||
    null;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <GraduationCap
                  size={21}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">
                  Student transition
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Enrollment Conversion
                </h2>
              </div>
            </div>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Validate accepted
              applicants and move
              approved admissions
              records into student
              enrollment processing.
            </p>

            {!selectedAdmissionCycle && (
              <p className="mt-3 text-sm font-black text-amber-700">
                Select an admission
                cycle to load enrollment
                conversions.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {canCreateEnrollments && (
              <button
                type="button"
                onClick={
                  onCreateEnrollment
                }
                disabled={
                  !selectedAdmissionCycle ||
                  !onCreateEnrollment
                }
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={17} />

                Create conversion
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                refreshEnrollmentConversions?.()
              }
              disabled={
                enrollmentConversionsLoading ||
                !selectedAdmissionCycle
              }
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  enrollmentConversionsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={
                enrollmentFilters
                  .search ||
                ""
              }
              onChange={(
                event,
              ) =>
                updateFilter(
                  "search",
                  event.target
                    .value,
                )
              }
              disabled={
                !selectedAdmissionCycle
              }
              placeholder="Search grade, failure, cancellation, or reversal details"
              className={`${INPUT_CLASSES} pl-11`}
            />
          </div>

          <select
            value={
              enrollmentFilters
                .status ||
              ""
            }
            onChange={(
              event,
            ) =>
              updateFilter(
                "status",
                event.target
                  .value,
              )
            }
            disabled={
              !selectedAdmissionCycle
            }
            className={INPUT_CLASSES}
          >
            <option value="">
              All statuses
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="validating">
              Validating
            </option>

            <option value="ready">
              Ready
            </option>

            <option value="processing">
              Processing
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="failed">
              Failed
            </option>

            <option value="cancelled">
              Cancelled
            </option>

            <option value="reversed">
              Reversed
            </option>
          </select>

          <button
            type="button"
            onClick={() =>
              resetEnrollmentFilters?.()
            }
            disabled={
              !selectedAdmissionCycle
            }
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SlidersHorizontal
              size={16}
            />

            Reset
          </button>
        </div>
      </header>

      <div className="grid xl:grid-cols-[390px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-50">
          {enrollmentConversionsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2
                className="animate-spin text-indigo-700"
                size={26}
              />
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {conversionItems.map(
                (conversion) => (
                  <button
                    key={
                      conversion.id
                    }
                    type="button"
                    onClick={() =>
                      selectEnrollmentConversion?.(
                        conversion,
                      )
                    }
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      conversion.id ===
                      selectedEnrollmentConversionId
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900">
                          {conversion
                            .application_number ||
                            conversion
                              .application
                              ?.application_number ||
                            "Enrollment conversion"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Grade{" "}
                          {conversion
                            .target_grade_level ||
                            "not set"}
                        </p>
                      </div>

                      <EnrollmentStatusBadge
                        status={
                          conversion.status
                        }
                      />
                    </div>

                    <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500">
                      <p>
                        Start:{" "}
                        {formatDate(
                          conversion
                            .enrollment_start_date,
                        )}
                      </p>

                      <p>
                        Requested:{" "}
                        {formatDate(
                          conversion
                            .requested_at,
                        )}
                      </p>
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
        </aside>

        <main className="min-w-0 bg-white">
          {enrollmentConversionsError && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-4">
              <p className="font-black text-red-800">
                Enrollment conversions
                could not be loaded.
              </p>

              <p className="mt-1 text-sm font-semibold text-red-700">
                {
                  enrollmentConversionsError
                }
              </p>
            </div>
          )}

          {!enrollmentConversionsLoading &&
          !conversionItems.length ? (
            <div className="flex min-h-[620px] items-center justify-center p-8">
              <div className="max-w-md text-center">
                <GraduationCap
                  size={34}
                  className="mx-auto text-slate-400"
                />

                <h3 className="mt-4 text-lg font-black text-slate-900">
                  No enrollment
                  conversions found
                </h3>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Enrollment conversions
                  will appear here after
                  an accepted admission
                  offer is moved into the
                  enrollment process.
                </p>
              </div>
            </div>
          ) : (
            <EnrollmentOverview
              conversion={
                selectedConversion
              }
              canEditEnrollment={
                canEditEnrollments
              }
              mutationLoading={
                enrollmentMutationLoading
              }
              mutationError={
                enrollmentMutationError
              }
              onEditEnrollment={
                onEditEnrollment
              }
              onValidateEnrollment={
                validateEnrollmentConversion
              }
              onMarkEnrollmentReady={
                markEnrollmentReady
              }
              onStartEnrollmentProcessing={
                startEnrollmentProcessing
              }
              onCompleteEnrollment={
                completeEnrollmentConversion
              }
              onFailEnrollment={
                failEnrollmentConversion
              }
              onCancelEnrollment={
                cancelEnrollmentConversion
              }
              onReverseEnrollment={
                reverseEnrollmentConversion
              }
              onClearMutationError={
                clearEnrollmentMutationError
              }
            />
          )}
        </main>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-800">
            {Number(
              enrollmentConversions
                .total,
            ) || 0}{" "}
            total conversions
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Page {currentPage} of{" "}
            {Math.max(
              pageCount,
              1,
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={
              goToPreviousPage
            }
            disabled={
              currentPage <= 1 ||
              enrollmentConversionsLoading
            }
            className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft
              size={16}
            />

            Previous
          </button>

          <button
            type="button"
            onClick={
              goToNextPage
            }
            disabled={
              currentPage >=
                pageCount ||
              enrollmentConversionsLoading
            }
            className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next

            <ChevronRight
              size={16}
            />
          </button>
        </div>
      </footer>
    </section>
  );
}