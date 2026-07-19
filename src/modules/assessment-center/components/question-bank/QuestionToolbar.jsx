import {
  useRef,
} from "react";

import {
  Download,
  FileDown,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";

export default function QuestionToolbar({
  search,
  loading,
  importing,
  canCreate,
  canExport,
  onSearchChange,
  onRefresh,
  onCreate,
  onImportFile,
  onExport,
  onDownloadTemplate,
}) {
  const fileInputRef =
    useRef(null);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(
    event,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    await onImportFile?.(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xl">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              onSearchChange(
                event.target.value,
              )
            }
            placeholder="Search question number, title, prompt, or learning outcome"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={
              loading ||
              importing
            }
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
              disabled={importing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={17} />

              New question
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={
            handleFileChange
          }
          className="hidden"
        />

        {canCreate && (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={importing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload
              size={16}
              className={
                importing
                  ? "animate-pulse"
                  : ""
              }
            />

            {importing
              ? "Importing..."
              : "Import CSV"}
          </button>
        )}

        <button
          type="button"
          onClick={
            onDownloadTemplate
          }
          disabled={importing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileDown size={16} />

          Download template
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={
            importing ||
            !canExport
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={16} />

          Export CSV
        </button>
      </div>
    </div>
  );
}
