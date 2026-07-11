export default function Card({
  children,
  className = "",
  padding = "default",
}) {
  const paddingClasses = {
    none: "",
    small: "p-4",
    default: "p-5 sm:p-6",
    large: "p-6 sm:p-8",
  };

  return (
    <div
      className={[
        "rounded-3xl border border-slate-200 bg-white shadow-sm",
        paddingClasses[padding] || paddingClasses.default,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}