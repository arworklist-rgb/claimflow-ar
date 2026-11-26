import { useState } from "react";

export type SortDir = "asc" | "desc";

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  className?: string;
  headClassName?: string;
  /** Pins the column to the left while the table scrolls sideways. Value is its offset in px (0 for the first). */
  stickyLeft?: number;
  /** Pins the column to the right edge (used for the row actions). */
  stickyRight?: boolean;
}

export const PAGE_SIZES = [10, 25, 50] as const;

interface UseDataTableOptions<T> {
  data: T[];
  columns: Column<T>[];
  /** Text a row is matched against by the search box. */
  searchText?: (row: T) => string;
  /** Extra predicate for page-specific filters (status, category, ...). */
  filter?: (row: T) => boolean;
  /** Changes whenever `filter` changes, so the table can jump back to page 1. */
  filterKey?: string;
  initialSort?: { id: string; dir: SortDir };
  initialPageSize?: number;
}

export function useDataTable<T>({
  data,
  columns,
  searchText,
  filter,
  filterKey = "",
  initialSort,
  initialPageSize = 10,
}: UseDataTableOptions<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ id: string; dir: SortDir } | null>(initialSort ?? null);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Page is tied to a key; when search/filter/sort/page size change the key changes
  // and the page falls back to 1 without needing an effect.
  const resetKey = `${query}|${filterKey}|${sort?.id}:${sort?.dir}|${pageSize}`;
  const [pageState, setPageState] = useState({ page: 1, key: resetKey });
  const requestedPage = pageState.key === resetKey ? pageState.page : 1;

  // Plain derivation (no memo): the datasets in this demo are small, and this keeps
  // `filter` / `searchText` closures from ever going stale.
  const filtered = (() => {
    const q = query.trim().toLowerCase();
    let rows = data;
    if (q && searchText) rows = rows.filter((r) => searchText(r).toLowerCase().includes(q));
    if (filter) rows = rows.filter(filter);

    const sortColumn = sort && columns.find((c) => c.id === sort.id);
    if (sort && sortColumn?.sortValue) {
      const get = sortColumn.sortValue;
      const dir = sort.dir === "asc" ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = get(a);
        const bv = get(b);
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
        return cmp * dir;
      });
    }
    return rows;
  })();

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return {
    query,
    setQuery,
    sort,
    toggleSort: (id: string) =>
      setSort((cur) => (cur?.id === id ? { id, dir: cur.dir === "asc" ? "desc" : "asc" } : { id, dir: "asc" })),
    page,
    setPage: (p: number) => setPageState({ page: Math.min(Math.max(1, p), pageCount), key: resetKey }),
    pageSize,
    setPageSize,
    pageCount,
    rows,
    filtered,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}

export type DataTableState<T> = ReturnType<typeof useDataTable<T>>;
