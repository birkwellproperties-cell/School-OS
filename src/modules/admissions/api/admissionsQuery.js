const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function normalizeInteger(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}

export function normalizePagination({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const normalizedPage = Math.max(
    1,
    normalizeInteger(page, 1),
  );

  const normalizedPageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      normalizeInteger(
        pageSize,
        DEFAULT_PAGE_SIZE,
      ),
    ),
  );

  const from =
    (normalizedPage - 1) *
    normalizedPageSize;

  const to =
    from + normalizedPageSize - 1;

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    from,
    to,
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

  return query.eq(column, value);
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

  return query.in(column, values);
}

export function applyDateRange(
  query,
  column,
  {
    from,
    to,
  } = {},
) {
  let nextQuery = query;

  if (from) {
    nextQuery = nextQuery.gte(column, from);
  }

  if (to) {
    nextQuery = nextQuery.lte(column, to);
  }

  return nextQuery;
}

export function applySearch(
  query,
  search,
  columns = [],
) {
  const normalizedSearch = search?.trim();

  if (
    !normalizedSearch ||
    columns.length === 0
  ) {
    return query;
  }

  const escapedSearch = normalizedSearch
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ");

  const searchExpression = columns
    .map(
      (column) =>
        `${column}.ilike.%${escapedSearch}%`,
    )
    .join(",");

  return query.or(searchExpression);
}

export function applyOrdering(
  query,
  {
    sortBy = "created_at",
    ascending = false,
  } = {},
  allowedSortColumns = [],
) {
  const normalizedSortBy =
    allowedSortColumns.includes(sortBy)
      ? sortBy
      : "created_at";

  return query.order(normalizedSortBy, {
    ascending: Boolean(ascending),
  });
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
  pagination,
}) {
  const total = count || 0;

  return {
    items: data || [],
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    pageCount:
      total === 0
        ? 0
        : Math.ceil(
            total / pagination.pageSize,
          ),
  };
}
