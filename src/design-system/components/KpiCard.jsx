const tones = {
  slate: {
    shell: "border-slate-200 bg-white",
    icon: "bg-slate-100 text-slate-700",
    label: "text-slate-500",
  },
  blue: {
    shell: "border-blue-200 bg-blue-50/70",
    icon: "bg-blue-100 text-blue-700",
    label: "text-blue-700",
  },
  emerald: {
    shell: "border-emerald-200 bg-emerald-50/70",
    icon: "bg-emerald-100 text-emerald-700",
    label: "text-emerald-700",
  },
  amber: {
    shell: "border-amber-200 bg-amber-50/70",
    icon: "bg-amber-100 text-amber-700",
    label: "text-amber-700",
  },
  red: {
    shell: "border-red-200 bg-red-50/70",
    icon: "bg-red-100 text-red-700",
    label: "text-red-700",
  },
  violet: {
    shell: "border-violet-200 bg-violet-50/70",
    icon: "bg-violet-100 text-violet-700",
    label: "text-violet-700",
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
        "rounded-3xl border p-5 shadow-sm transition duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        style.shell,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={[
              "text-xs font-black uppercase tracking-[0.16em]",
              style.label,
            ].join(" ")}
          >
            {label}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        {Icon && (
          <div className={["rounded-2xl p-3", style.icon].join(" ")}>
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