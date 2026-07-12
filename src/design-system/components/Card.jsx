export default function Card({
  children,
  className = "",
  padding = "default",
  interactive = false,
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
        "rounded-3xl border border-slate-200/90 bg-white shadow-sm",
        interactive
          ? "transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          : "",
        paddingClasses[padding] || paddingClasses.default,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}