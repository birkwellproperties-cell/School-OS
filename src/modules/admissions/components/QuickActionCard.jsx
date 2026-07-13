import { ArrowRight } from "lucide-react";

export default function QuickActionCard({
  title,
  description,
  icon: Icon,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex min-h-36 w-full flex-col items-start rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
        {Icon && <Icon size={21} />}
      </span>

      <p className="mt-4 font-black text-slate-950">
        {title}
      </p>

      <p className="mt-1 flex-1 text-sm font-medium leading-6 text-slate-500">
        {description}
      </p>

      <span className="mt-4 flex items-center gap-2 text-sm font-black text-indigo-700">
        Open
        <ArrowRight
          size={16}
          className="transition group-hover:translate-x-1"
        />
      </span>
    </button>
  );
}
