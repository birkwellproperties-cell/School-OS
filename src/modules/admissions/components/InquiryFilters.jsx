import {
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  useAdmissions,
} from "../hooks";

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60";

export default function InquiryFilters() {
  const {
    inquiryFilters,
    inquiriesLoading,

    setInquiryFilters,
    resetInquiryFilters,
    refreshInquiries,
  } = useAdmissions();

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
      <label className="relative">
        <span className="sr-only">
          Search inquiries
        </span>

        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={
            inquiryFilters.search || ""
          }
          onChange={(event) =>
            setInquiryFilters({
              search:
                event.target.value,
            })
          }
          placeholder="Search student, contact, email, phone, or inquiry number..."
          className={`${INPUT_CLASSES} pl-11`}
        />
      </label>

      <label>
        <span className="sr-only">
          Filter by status
        </span>

        <select
          value={
            inquiryFilters.status || ""
          }
          onChange={(event) =>
            setInquiryFilters({
              status:
                event.target.value,
            })
          }
          className={INPUT_CLASSES}
        >
          <option value="">
            All statuses
          </option>

          <option value="new">
            New
          </option>

          <option value="contacted">
            Contacted
          </option>

          <option value="qualified">
            Qualified
          </option>

          <option value="unqualified">
            Unqualified
          </option>

          <option value="converted">
            Converted
          </option>

          <option value="closed">
            Closed
          </option>
        </select>
      </label>

      <button
        type="button"
        onClick={resetInquiryFilters}
        disabled={inquiriesLoading}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RotateCcw size={16} />

        Reset
      </button>

      <button
        type="button"
        onClick={() =>
          refreshInquiries()
        }
        disabled={inquiriesLoading}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw
          size={16}
          className={
            inquiriesLoading
              ? "animate-spin"
              : ""
          }
        />

        {inquiriesLoading
          ? "Refreshing"
          : "Refresh"}
      </button>
    </div>
  );
}