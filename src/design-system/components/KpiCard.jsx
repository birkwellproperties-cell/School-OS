const tones = {
  slate: {
    border: "border-slate-200",
    background: "bg-white",
    label: "text-slate-500",
    value: "text-slate-950",
  },

  teal: {
    border: "border-teal-200",
    background: "bg-teal-50",
    label: "text-teal-700",
    value: "text-teal-950",
  },

  emerald: {
    border: "border-emerald-200",
    background: "bg-emerald-50",
    label: "text-emerald-700",
    value: "text-emerald-950",
  },

  amber: {
    border: "border-amber-200",
    background: "bg-amber-50",
    label: "text-amber-700",
    value: "text-amber-950",
  },

  red: {
    border: "border-red-200",
    background: "bg-red-50",
    label: "text-red-700",
    value: "text-red-950",
  },

  blue: {
    border: "border-blue-200",
    background: "bg-blue-50",
    label: "text-blue-700",
    value: "text-blue-950",
  },
};

export default function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "slate",
}) {
  const style = tones[tone] || tones.slate;

  return (
    <article
      className={[
        "rounded-3xl border p-5 shadow-sm",
        style.border,
        style.background,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={[
              "text-xs font-black uppercase tracking-[0.16em]",
              style.label,
            ].join(" ")}
          >
            {label}
          </p>

          <p
            className={[
              "mt-3 text-3xl font-black tracking-tight",
              style.value,
            ].join(" ")}
          >
            {value}
          </p>
        </div>

        {Icon && (
          <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
            <Icon size={22} />
          </div>
        )}
      </div>

      {helper && (
        <p className="mt-3 text-sm font-semibold leading-5 text-slate-500">
          {helper}
        </p>
      )}
    </article>
  );
}