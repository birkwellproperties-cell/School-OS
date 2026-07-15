const STATUS_STYLES = {
  new:
    "border-blue-200 bg-blue-50 text-blue-700",
  contacted:
    "border-indigo-200 bg-indigo-50 text-indigo-700",
  qualified:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  unqualified:
    "border-red-200 bg-red-50 text-red-700",
  converted:
    "border-violet-200 bg-violet-50 text-violet-700",
  closed:
    "border-slate-200 bg-slate-100 text-slate-700",
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

export default function InquiryStatusBadge({
  status,
}) {
  const classes =
    STATUS_STYLES[status] ||
    STATUS_STYLES.closed;

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