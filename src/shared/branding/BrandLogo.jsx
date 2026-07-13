import BrandMark from "./BrandMark";

const LOGO_SIZES = Object.freeze({
  xs: {
    mark: 28,
    name: "text-lg",
    attribution: "text-[7px]",
    gap: "gap-2",
    surface: "h-9 w-9 rounded-xl",
  },
  sm: {
    mark: 34,
    name: "text-xl",
    attribution: "text-[8px]",
    gap: "gap-2.5",
    surface: "h-11 w-11 rounded-xl",
  },
  md: {
    mark: 42,
    name: "text-2xl",
    attribution: "text-[9px]",
    gap: "gap-3",
    surface: "h-13 w-13 rounded-2xl",
  },
  lg: {
    mark: 54,
    name: "text-3xl",
    attribution: "text-[10px]",
    gap: "gap-3.5",
    surface: "h-16 w-16 rounded-2xl",
  },
  xl: {
    mark: 76,
    name: "text-5xl",
    attribution: "text-xs",
    gap: "gap-5",
    surface: "h-24 w-24 rounded-[1.5rem]",
  },
});

export default function BrandLogo({
  variant = "primary",
  markVariant,
  size = "md",
  orientation = "horizontal",
  showAttribution = false,
  attribution = "Enterprise",
  markSurface = false,
  className = "",
  markClassName = "",
  textClassName = "",
  attributionClassName = "",
  priority = false,
}) {
  const resolvedSize = LOGO_SIZES[size] || LOGO_SIZES.md;
  const isLight = variant === "light";
  const isVertical = orientation === "vertical";

  const resolvedMarkVariant =
    markVariant || (isLight ? "light" : variant);

  const schoolTextColor = isLight
    ? "text-white"
    : "text-[#0D1B2A]";

  const attributionColor = isLight
    ? "text-blue-100"
    : "text-[#1D4ED8]";

  const mark = (
    <BrandMark
      variant={resolvedMarkVariant}
      size={resolvedSize.mark}
      decorative
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={markClassName}
    />
  );

  return (
    <div
      className={[
        "inline-flex w-fit",
        isVertical
          ? "flex-col items-center text-center"
          : `items-center ${resolvedSize.gap}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {markSurface ? (
        <span
          className={[
            "flex shrink-0 items-center justify-center bg-white shadow-lg shadow-slate-950/20 ring-1 ring-white/30",
            resolvedSize.surface,
          ].join(" ")}
        >
          {mark}
        </span>
      ) : (
        mark
      )}

      <div
        className={[
          "flex min-w-0 flex-col",
          isVertical ? "mt-3 items-center" : "items-start",
        ].join(" ")}
      >
        <div
          aria-label="SchoolOS"
          className={[
            "whitespace-nowrap font-extrabold leading-none tracking-[-0.045em]",
            resolvedSize.name,
            textClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className={schoolTextColor}>School</span>

          <span className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
            OS
          </span>
        </div>

        {showAttribution && (
          <span
            className={[
              "mt-1.5 whitespace-nowrap font-black uppercase tracking-[0.2em]",
              resolvedSize.attribution,
              attributionColor,
              attributionClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {attribution}
          </span>
        )}
      </div>
    </div>
  );
}