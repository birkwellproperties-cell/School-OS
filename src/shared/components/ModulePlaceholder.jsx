import { Card } from "../../design-system";

export default function ModulePlaceholder({
  eyebrow = "SchoolOS Enterprise",
  title,
  description,
}) {
  return (
    <Card padding="large">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">
        {eyebrow}
      </p>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {title}
      </h1>

      <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
        {description}
      </p>
    </Card>
  );
}