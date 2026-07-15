import {
  CalendarDays,
  ChevronDown,
  Pencil,
  Plus,
} from "lucide-react";

import {
  useAdmissions,
} from "../hooks";

const STATUS_STYLES = {
  open:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft:
    "border-slate-200 bg-slate-100 text-slate-700",
  closed:
    "border-amber-200 bg-amber-50 text-amber-700",
  archived:
    "border-red-200 bg-red-50 text-red-700",
};

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

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

function CycleDetail({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white">
        {value || "Not set"}
      </p>
    </div>
  );
}

export default function AdmissionCycleSelector({
  onCreateCycle,
  onEditCycle,
}) {
  const {
    admissionCycles,
    admissionCyclesLoading,
    admissionCyclesError,

    selectedAdmissionCycle,
    selectedAdmissionCycleId,
    selectAdmissionCycle,

    canCreateAdmissions,
    canEditAdmissions,

    admissionCycleMutationLoading,
    refreshAdmissionCycles,
  } = useAdmissions();

  const selectedStatus =
    selectedAdmissionCycle?.status ||
    "draft";

  const statusClass =
    STATUS_STYLES[selectedStatus] ||
    STATUS_STYLES.draft;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CalendarDays
              size={17}
              className="text-indigo-300"
            />

            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-200">
              Admission cycle
            </p>
          </div>

          <div className="relative mt-3 max-w-xl">
            <select
              value={
                selectedAdmissionCycleId ||
                ""
              }
              onChange={(event) =>
                selectAdmissionCycle(
                  event.target.value ||
                    null,
                )
              }
              disabled={
                admissionCyclesLoading ||
                admissionCycleMutationLoading ||
                admissionCycles.length ===
                  0
              }
              className="min-h-12 w-full appearance-none rounded-xl border border-white/15 bg-slate-900 px-4 pr-11 text-sm font-black text-white outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {admissionCycles.length ===
                0 && (
                <option value="">
                  {admissionCyclesLoading
                    ? "Loading admission cycles..."
                    : "No admission cycles available"}
                </option>
              )}

              {admissionCycles.map(
                (cycle) => (
                  <option
                    key={cycle.id}
                    value={cycle.id}
                  >
                    {cycle.name ||
                      cycle.code ||
                      "Unnamed cycle"}
                    {cycle.academic_year_label
                      ? ` · ${cycle.academic_year_label}`
                      : ""}
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {admissionCyclesError && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3"
            >
              <p className="text-sm font-bold text-red-200">
                {admissionCyclesError}
              </p>

              <button
                type="button"
                onClick={
                  refreshAdmissionCycles
                }
                className="mt-2 text-xs font-black uppercase tracking-wide text-white underline decoration-white/40 underline-offset-4"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {canEditAdmissions &&
            selectedAdmissionCycle && (
              <button
                type="button"
                onClick={onEditCycle}
                disabled={
                  admissionCycleMutationLoading
                }
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Pencil size={17} />

                Edit cycle
              </button>
            )}

          {canCreateAdmissions && (
            <button
              type="button"
              onClick={onCreateCycle}
              disabled={
                admissionCycleMutationLoading
              }
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-black text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={17} />

              New cycle
            </button>
          )}
        </div>
      </div>

      {selectedAdmissionCycle ? (
        <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">
              Status
            </p>

            <span
              className={[
                "mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black",
                statusClass,
              ].join(" ")}
            >
              {formatStatus(
                selectedAdmissionCycle.status,
              )}
            </span>
          </div>

          <CycleDetail
            label="Academic year"
            value={
              selectedAdmissionCycle
                .academic_year_label
            }
          />

          <CycleDetail
            label="Cycle code"
            value={
              selectedAdmissionCycle.code
            }
          />

          <CycleDetail
            label="Opens"
            value={formatDate(
              selectedAdmissionCycle
                .opens_at,
            )}
          />

          <CycleDetail
            label="Closes"
            value={formatDate(
              selectedAdmissionCycle
                .closes_at,
            )}
          />
        </div>
      ) : (
        !admissionCyclesLoading &&
        !admissionCyclesError && (
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-sm font-semibold text-slate-300">
              No admission cycle has been
              selected.
            </p>
          </div>
        )
      )}
    </section>
  );
}