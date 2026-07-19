import {
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

const STATUSES = [
  "",
  "draft",
  "review",
  "approved",
  "active",
  "published",
  "paused",
  "retired",
  "archived",
];

function formatLabel(value) {
  if (!value) {
    return "All statuses";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function TemplateToolbar({
  filters,
  loading,
  canCreate,
  onChange,
  onReset,
  onRefresh,
  onCreate,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-2xl">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={filters.search}
            onChange={(event) =>
              onChange({
                search:
                  event.target.value,
              })
            }
            placeholder="Search template number, name, code, or description"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={17} />
              New template
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
        <label className="w-full space-y-1.5 sm:max-w-xs">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>

          <select
            value={filters.status}
            onChange={(event) =>
              onChange({
                status:
                  event.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {STATUSES.map(
              (status) => (
                <option
                  key={
                    status ||
                    "all"
                  }
                  value={status}
                >
                  {formatLabel(
                    status,
                  )}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
