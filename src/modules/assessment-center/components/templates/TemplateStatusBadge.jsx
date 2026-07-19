const STATUS_STYLES = {
  draft:
    "border-slate-200 bg-slate-100 text-slate-700",
  review:
    "border-amber-200 bg-amber-50 text-amber-700",
  approved:
    "border-blue-200 bg-blue-50 text-blue-700",
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  published:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  paused:
    "border-amber-200 bg-amber-50 text-amber-700",
  retired:
    "border-slate-300 bg-slate-100 text-slate-600",
  archived:
    "border-red-200 bg-red-50 text-red-700",
};

function formatLabel(value) {
  if (!value) {
    return "Draft";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function TemplateStatusBadge({
  status,
}) {
  const normalized =
    String(status || "draft")
      .trim()
      .toLowerCase();

  const style =
    STATUS_STYLES[normalized] ||
    STATUS_STYLES.draft;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {formatLabel(normalized)}
    </span>
  );
}
