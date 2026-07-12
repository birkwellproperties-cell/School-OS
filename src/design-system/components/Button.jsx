const variants = {
  primary:
    "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-200",

  secondary:
    "border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-blue-200 hover:bg-blue-50 focus:ring-blue-100",

  accent:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-emerald-200",

  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-200",

  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",

  subtle:
    "bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-100",
};

const sizes = {
  small: "min-h-10 px-3.5 py-2 text-sm",
  medium: "min-h-11 px-4 py-2.5 text-sm",
  large: "min-h-12 px-5 py-3 text-base",
};

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold",
        "transition duration-200 focus:outline-none focus:ring-4",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant] || variants.primary,
        sizes[size] || sizes.medium,
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}