import type { ApiPaged, ListQuery, SortDir } from "../types";

export const DEFAULT_PER_PAGE = 12;

/** Server-shaped pagination. The UI never slices arrays itself — it asks
 *  for a page, exactly as it will against the real API. */
export function paginate<T>(rows: T[], query: ListQuery = {}): ApiPaged<T> {
  const per_page = Math.min(Math.max(query.per_page ?? DEFAULT_PER_PAGE, 1), 100);
  const total = rows.length;
  const total_pages = Math.max(Math.ceil(total / per_page), 1);
  const page = Math.min(Math.max(query.page ?? 1, 1), total_pages);
  const start = (page - 1) * per_page;

  return {
    success: true,
    data: rows.slice(start, start + per_page),
    meta: {
      page,
      per_page,
      total,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
    },
  };
}

export function sortRows<T>(rows: T[], key: keyof T | string, dir: SortDir = "asc"): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return rows.slice().sort((a, b) => {
    const av = (a as Record<string, unknown>)[key as string];
    const bv = (b as Record<string, unknown>)[key as string];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
    return String(av ?? "").localeCompare(String(bv ?? "")) * sign;
  });
}

/** Naive relevance search — Postgres full-text search replaces this. */
export function search<T>(rows: T[], q: string | undefined, fields: (keyof T)[]): T[] {
  if (!q?.trim()) return rows;
  const needle = q.trim().toLowerCase();
  return rows.filter((row) =>
    fields.some((f) => String(row[f] ?? "").toLowerCase().includes(needle)),
  );
}
