const STATUS_STYLES = {
  draft:
    "bg-slate-100 text-slate-700 ring-slate-200",

  active:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",

  archived:
    "bg-rose-50 text-rose-700 ring-rose-200",
};

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function AssessmentBankStatusBadge({
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