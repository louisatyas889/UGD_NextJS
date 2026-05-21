export type SearchSelector<T> = (item: T) => string | number | null | undefined;

export function filterItemsByQuery<T>(
  items: T[],
  query: string,
  selectors: SearchSelector<T>[],
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) =>
    selectors.some((selector) =>
      String(selector(item) ?? "").toLowerCase().includes(normalizedQuery),
    ),
  );
}

export function paginateItems<T>(
  items: T[],
  requestedPage: number,
  pageSize: number,
) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage,
    endIndex,
    items: items.slice(startIndex, endIndex),
    startIndex,
    totalItems,
    totalPages,
  };
}
