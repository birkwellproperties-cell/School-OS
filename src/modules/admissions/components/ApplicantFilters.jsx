import {
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  useAdmissions,
} from "../hooks";

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

export default function ApplicantFilters() {
  const {
    applicantFilters,
    applicantsLoading,

    setApplicantFilters,
    resetApplicantFilters,
    refreshApplicants,
  } = useAdmissions();

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
      <label className="relative">
        <span className="sr-only">
          Search applicants
        </span>

        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={
            applicantFilters.search || ""
          }
          onChange={(event) =>
            setApplicantFilters({
              search:
                event.target.value,
            })
          }
          placeholder="Search name, applicant number, email, phone, or school..."
          className={`${INPUT_CLASSES} pl-11`}
        />
      </label>

      <label>
        <span className="sr-only">
          Filter applicants by status
        </span>

        <select
          value={
            applicantFilters.status || ""
          }
          onChange={(event) =>
            setApplicantFilters({
              status:
                event.target.value,
            })
          }
          className={INPUT_CLASSES}
        >
          <option value="">
            All statuses
          </option>

          <option value="prospect">
            Prospect
          </option>

          <option value="applicant">
            Applicant
          </option>

          <option value="offered">
            Offered
          </option>

          <option value="accepted">
            Accepted
          </option>

          <option value="enrolled">
            Enrolled
          </option>

          <option value="withdrawn">
            Withdrawn
          </option>

          <option value="archived">
            Archived
          </option>
        </select>
      </label>

      <button
        type="button"
        onClick={resetApplicantFilters}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RotateCcw size={16} />

        Reset
      </button>

      <button
        type="button"
        onClick={() =>
          refreshApplicants()
        }

        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw
          size={16}
          className={
            applicantsLoading
              ? "animate-spin"
              : ""
          }
        />

        {applicantsLoading
          ? "Refreshing"
          : "Refresh"}
      </button>
    </div>
  );
}