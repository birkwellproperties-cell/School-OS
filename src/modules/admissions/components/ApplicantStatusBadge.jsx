const STATUS_STYLES = {
  prospect:
    "border-slate-200 bg-slate-100 text-slate-700",
  applicant:
    "border-indigo-200 bg-indigo-50 text-indigo-700",
  offered:
    "border-violet-200 bg-violet-50 text-violet-700",
  accepted:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  enrolled:
    "border-teal-200 bg-teal-50 text-teal-700",
  withdrawn:
    "border-red-200 bg-red-50 text-red-700",
  archived:
    "border-slate-300 bg-slate-200 text-slate-700",
};

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function ApplicantStatusBadge({
  status,
}) {
  const classes =
    STATUS_STYLES[status] ||
    STATUS_STYLES.prospect;

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        classes,
      ].join(" ")}
    >
      {formatStatus(status)}
    </span>
  );
}