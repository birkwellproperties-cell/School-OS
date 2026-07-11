import Card from "./Card";

export default function Section({
  title,
  description,
  actions,
  children,
  className = "",
}) {
  return (
    <Card className={className}>
      {(title || description || actions) && (
        <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      {children}
    </Card>
  );
}