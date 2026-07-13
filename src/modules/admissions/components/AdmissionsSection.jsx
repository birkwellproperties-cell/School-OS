export default function AdmissionsSection({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={[
        "rounded-3xl border border-slate-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      <header className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {action}
      </header>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}
