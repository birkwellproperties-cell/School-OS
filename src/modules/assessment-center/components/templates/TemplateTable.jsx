import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import TemplateStatusBadge from "./TemplateStatusBadge";

function formatLabel(value) {
  if (!value) {
    return "?";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function TemplateTable({
  templates,
  result,
  loading,
  selectedTemplateId,
  onSelect,
  onPageChange,
}) {
  if (
    loading &&
    templates.length === 0
  ) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading templates?
          </p>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          No templates found
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Adjust the current filters or create
          the first assessment template.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Template
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Delivery
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Duration
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marks
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {templates.map(
              (template) => {
                const selected =
                  selectedTemplateId ===
                  template.id;

                return (
                  <tr
                    key={template.id}
                    onClick={() =>
                      onSelect(
                        template.id,
                      )
                    }
                    className={`cursor-pointer transition ${
                      selected
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="max-w-md truncate text-sm font-semibold text-slate-900">
                        {template.name ||
                          "Untitled template"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {template.template_number ||
                          template.code ||
                          "Number pending"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatLabel(
                        template.assessment_type,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatLabel(
                        template.delivery_mode,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {template.duration_minutes
                        ? `${template.duration_minutes} min`
                        : "?"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                      {template.total_marks ??
                        "?"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <TemplateStatusBadge
                        status={
                          template.status
                        }
                      />
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {result.total || 0} template
          {(result.total || 0) === 1
            ? ""
            : "s"}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={
              loading ||
              result.page <= 1
            }
            onClick={() =>
              onPageChange(
                result.page - 1,
              )
            }
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span className="px-2 text-sm font-medium text-slate-600">
            Page {result.page || 1} of{" "}
            {Math.max(
              result.totalPages || 1,
              1,
            )}
          </span>

          <button
            type="button"
            disabled={
              loading ||
              result.page >=
                Math.max(
                  result.totalPages ||
                    1,
                  1,
                )
            }
            onClick={() =>
              onPageChange(
                result.page + 1,
              )
            }
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}
