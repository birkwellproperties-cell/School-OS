import {
  RefreshCw,
  Search,
  X,
} from "lucide-react";

export default function TemplateQuestionFilters({
  search = "",
  required = "",
  loading = false,
  onSearchChange,
  onRequiredChange,
  onReset,
  onRefresh,
}) {
  const hasFilters =
    Boolean(search) ||
    required !== "";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">
          Search assigned questions
        </span>

        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={search}
          onChange={(event) =>
            onSearchChange?.(
              event.target.value,
            )
          }
          placeholder="Search assigned questions"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <label className="min-w-[180px]">
        <span className="sr-only">
          Required status
        </span>

        <select
          value={required}
          onChange={(event) =>
            onRequiredChange?.(
              event.target.value,
            )
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">
            All questions
          </option>

          <option value="true">
            Required only
          </option>

          <option value="false">
            Optional only
          </option>
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={
            loading || !hasFilters
          }
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={16} />
          Reset
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>
    </div>
  );
}