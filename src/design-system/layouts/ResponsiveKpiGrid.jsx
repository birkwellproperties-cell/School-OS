export default function ResponsiveKpiGrid({
  children,
  columns = 4,
  className = "",
}) {
  const columnClasses = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 xl:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6",
  };

  return (
    <div
      className={[
        "grid grid-cols-1 gap-4",
        columnClasses[columns] || columnClasses[4],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}