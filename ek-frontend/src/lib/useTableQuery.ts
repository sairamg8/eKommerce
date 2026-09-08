import { useCallback, useState } from "react";
import type { SortDir } from "../mock/types";

/**
 * Shared list-view state: page, search and sort. Any change to the search
 * term or the sort resets to page 1, which is what a server-paginated
 * table must do — otherwise you land on an out-of-range page.
 */
export function useTableQuery(initial?: { sort?: string; dir?: SortDir; perPage?: number }) {
  const [page, setPage] = useState(1);
  const [q, setQState] = useState("");
  const [sort, setSort] = useState<string | undefined>(initial?.sort);
  const [dir, setDir] = useState<SortDir>(initial?.dir ?? "desc");

  const setQ = useCallback((value: string) => {
    setQState(value);
    setPage(1);
  }, []);

  const onSort = useCallback((key: string, nextDir: SortDir) => {
    setSort(key);
    setDir(nextDir);
    setPage(1);
  }, []);

  /** Call when a filter chip or tab changes. */
  const resetPage = useCallback(() => setPage(1), []);

  return {
    page, setPage, resetPage,
    q, setQ,
    sort, dir, onSort,
    perPage: initial?.perPage ?? 12,
  };
}
