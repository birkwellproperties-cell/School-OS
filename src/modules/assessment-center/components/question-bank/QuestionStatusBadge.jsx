const STATUS_STYLES = {
  draft:
    "bg-slate-100 text-slate-700 ring-slate-200",

  review:
    "bg-amber-50 text-amber-700 ring-amber-200",

  approved:
    "bg-blue-50 text-blue-700 ring-blue-200",

  active:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",

  paused:
    "bg-orange-50 text-orange-700 ring-orange-200",

  retired:
    "bg-rose-50 text-rose-700 ring-rose-200",

  archived:
    "bg-slate-100 text-slate-500 ring-slate-200",
};

function formatStatus(value) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function QuestionStatusBadge({
  status,
}) {
  const style =
    STATUS_STYLES[status] ||
    STATUS_STYLES.draft;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {formatStatus(status)}
    </span>
  );
}