const toneClasses = {
  slate:
    "border-slate-200 bg-white text-slate-950",
  blue:
    "border-blue-200 bg-blue-50 text-blue-950",
  indigo:
    "border-indigo-200 bg-indigo-50 text-indigo-950",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-950",
  amber:
    "border-amber-200 bg-amber-50 text-amber-950",
  red:
    "border-red-200 bg-red-50 text-red-950",
};

export default function AdmissionsMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "slate",
}) {
  const classes =
    toneClasses[tone] ||
    toneClasses.slate;

  return (
    <article
      className={[
        "rounded-3xl border p-5 shadow-sm",
        classes,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] opacity-65">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black">
            {value}
          </p>
        </div>

        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
            <Icon size={21} />
          </span>
        )}
      </div>

      {helper && (
        <p className="mt-3 text-sm font-semibold leading-6 opacity-70">
          {helper}
        </p>
      )}
    </article>
  );
}
