const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function normalizePositiveInteger(
  value,
  fallback,
) {
  const number =
    Number(value);

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {
    return fallback;
  }

  return number;
}

export function normalizePagination(
  filters = {},
) {
  const page =
    normalizePositiveInteger(
      filters.page,
      DEFAULT_PAGE,
    );

  const requestedPageSize =
    normalizePositiveInteger(
      filters.pageSize,
      DEFAULT_PAGE_SIZE,
    );

  const pageSize =
    Math.min(
      requestedPageSize,
      MAX_PAGE_SIZE,
    );

  return {
    page,
    pageSize,
    from:
      (page - 1) *
      pageSize,

    to:
      page * pageSize -
      1,
  };
}

export function applyExactFilter(
  query,
  column,
  value,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return query;
  }

  return query.eq(
    column,
    value,
  );
}

export function applyArrayFilter(
  query,
  column,
  values,
) {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return query;
  }

  return query.in(
    column,
    values,
  );
}

export function applySearch(
  query,
  search,
  columns = [],
) {
  const normalizedSearch =
    String(
      search || "",
    ).trim();

  if (
    !normalizedSearch ||
    !Array.isArray(columns) ||
    columns.length === 0
  ) {
    return query;
  }

  const escapedSearch =
    normalizedSearch
      .replaceAll("\\", "\\\\")
      .replaceAll("%", "\\%")
      .replaceAll("_", "\\_");

  const searchExpression =
    columns
      .map(
        (column) =>
          `${column}.ilike.%${escapedSearch}%`,
      )
      .join(",");

  return query.or(
    searchExpression,
  );
}

export function applyOrdering(
  query,
  {
    sortBy = "created_at",
    ascending = false,
  } = {},
  allowedColumns = [],
) {
  const safeSortBy =
    allowedColumns.includes(
      sortBy,
    )
      ? sortBy
      : allowedColumns[0] ||
        "created_at";

  return query.order(
    safeSortBy,
    {
      ascending:
        Boolean(ascending),

      nullsFirst: false,
    },
  );
}

export function applyPagination(
  query,
  pagination,
) {
  return query.range(
    pagination.from,
    pagination.to,
  );
}

export function createPagedResult({
  data,
  count,
  page,
  pageSize,
}) {
  const items =
    Array.isArray(data)
      ? data
      : [];

  const total =
    Number(count) || 0;

  return {
    items,
    total,
    page,
    pageSize,

    pageCount:
      total > 0
        ? Math.ceil(
            total /
              pageSize,
          )
        : 0,
  };
}