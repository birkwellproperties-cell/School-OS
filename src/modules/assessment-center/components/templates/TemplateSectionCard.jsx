import {
  Clock3,
  Hash,
  Pencil,
  Shuffle,
  Trash2,
} from "lucide-react";

function formatValue(value) {
  return String(value || "standard")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export default function TemplateSectionCard({
  section,
  selected = false,
  busy = false,
  canEdit = false,
  onSelect,
  onEdit,
  onDelete,
}) {
  return (
    <article
      className={`rounded-2xl border bg-white transition ${
        selected
          ? "border-blue-400 ring-2 ring-blue-100"
          : "border-slate-200 hover:border-blue-200"
      }`}
    >
      <button
        type="button"
        onClick={() =>
          onSelect?.(section.id)
        }
        className="w-full p-4 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white">
            {section.section_number}
          </span>

          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            {formatValue(
              section.section_type,
            )}
          </span>

          <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            {formatValue(section.status)}
          </span>
        </div>

        <h4 className="mt-3 font-semibold text-slate-950">
          {section.title}
        </h4>

        {section.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {section.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Hash size={14} />
            {section.question_count ?? 0} questions
          </span>

          <span>
            {section.marks ?? 0} marks
          </span>

          <span className="inline-flex items-center gap-1">
            <Clock3 size={14} />
            {section.duration_minutes ?? 0} min
          </span>

          {section.randomize_questions && (
            <span className="inline-flex items-center gap-1 text-blue-600">
              <Shuffle size={14} />
              Randomized
            </span>
          )}
        </div>
      </button>

      {canEdit && (
        <footer className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={() =>
              onEdit?.(section)
            }
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <Pencil size={14} />
            Edit
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete?.(section)
            }
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </footer>
      )}
    </article>
  );
}
