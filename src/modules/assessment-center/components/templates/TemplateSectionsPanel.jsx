import {
  FileQuestion,
  Plus,
  RefreshCw,
} from "lucide-react";

import TemplateSectionCard from "./TemplateSectionCard";

export default function TemplateSectionsPanel({
  template,
  sections = [],
  loading = false,
  error = "",
  mutationError = "",
  busy = false,
  canEdit = false,
  selectedSectionId = null,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onRefresh,
}) {
  if (!template) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <FileQuestion
          size={32}
          className="mx-auto text-slate-400"
        />

        <h3 className="mt-3 font-semibold text-slate-900">
          Select a template
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Select an assessment template to
          manage its sections.
        </p>
      </section>
    );
  }

  const orderedSections = [
    ...sections,
  ].sort(
    (left, right) =>
      Number(left.display_order ?? 0) -
      Number(right.display_order ?? 0),
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Assessment structure
          </p>

          <h3 className="mt-1 text-xl font-semibold text-slate-950">
            Template Sections
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {template.name} ·{" "}
            {sections.length} section
            {sections.length === 1
              ? ""
              : "s"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || busy}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
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

          {canEdit && (
            <button
              type="button"
              onClick={onCreate}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} />
              New section
            </button>
          )}
        </div>
      </header>

      {(error || mutationError) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {mutationError || error}
        </div>
      )}

      {loading && !sections.length ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading sections...
        </div>
      ) : orderedSections.length ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {orderedSections.map(
            (section) => (
              <TemplateSectionCard
                key={section.id}
                section={section}
                selected={
                  selectedSectionId ===
                  section.id
                }
                busy={busy}
                canEdit={canEdit}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ),
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <FileQuestion
            size={30}
            className="mx-auto text-slate-400"
          />

          <h4 className="mt-3 font-semibold text-slate-900">
            No sections yet
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Create the first section for
            this assessment template.
          </p>
        </div>
      )}
    </section>
  );
}
