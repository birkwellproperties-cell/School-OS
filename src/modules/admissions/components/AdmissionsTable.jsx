export default function AdmissionsTable({
  columns = [],
  rows = [],
  rowKey = "id",
  emptyTitle = "No records found",
  emptyDescription =
    "Records will appear here when Admissions activity begins.",
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
        <p className="font-black text-slate-800">
          {emptyTitle}
        </p>

        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b border-slate-200 px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              className="transition hover:bg-slate-50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700"
                >
                  {column.render
                    ? column.render(row)
                    : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
