import markDark from "../../assets/branding/marks/schoolos-mark-dark.svg";
import markLight from "../../assets/branding/marks/schoolos-mark-light.svg";
import markPrimary from "../../assets/branding/marks/schoolos-mark-primary.svg";

const MARKS = Object.freeze({
  primary: markPrimary,
  light: markLight,
  dark: markDark,
});

const MARK_SIZES = Object.freeze({
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
  "2xl": 144,
});

export default function BrandMark({
  variant = "primary",
  size = "md",
  className = "",
  decorative = false,
  alt = "SchoolOS",
  ...props
}) {
  const source = MARKS[variant] || MARKS.primary;
  const dimension =
    typeof size === "number" ? size : MARK_SIZES[size] || MARK_SIZES.md;

  return (
    <img
      src={source}
      width={dimension}
      height={dimension}
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? "true" : undefined}
      className={`block shrink-0 object-contain ${className}`.trim()}
      {...props}
    />
  );
}
