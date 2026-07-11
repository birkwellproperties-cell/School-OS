const variants = {
  primary:
    "bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-400",

  secondary:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus:ring-slate-300",

  teal:
    "bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-300",

  danger:
    "bg-red-700 text-white hover:bg-red-800 focus:ring-red-300",

  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300",
};

const sizes = {
  small: "min-h-9 px-3 py-2 text-sm",
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
        "transition focus:outline-none focus:ring-4",
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