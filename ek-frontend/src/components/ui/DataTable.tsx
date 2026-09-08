import type { ReactNode } from "react";
import type { PageMeta, SortDir } from "../../mock/types";
import { cn } from "../../lib/cn";
import { EmptyState } from "./EmptyState";
import { Icon } from "./Icon";
import { Pagination } from "./Pagination";
import { Skeleton } from "./Skeleton";
import s from "./DataTable.module.css";

export type Column<T> = {
  key: string;
  header: string;
  /** Set when the column maps to a sortable backend field. */
  sortable?: boolean;
  numeric?: boolean;
  width?: number | string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns, rows, loading, meta, sort, dir, onSort, onPage, onRowClick,
  rowKey, emptyTitle = "Nothing here yet", emptyDescription, unit = "rows",
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  meta?: PageMeta;
  sort?: string;
  dir?: SortDir;
  onSort?: (key: string, dir: SortDir) => void;
  onPage?: (page: number) => void;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  unit?: string;
}) {
  const toggle = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    onSort(col.key, sort === col.key && dir === "asc" ? "desc" : "asc");
  };

  return (
    <>
      <div className={s.scroll}>
        <table className={s.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}
                    className={cn(s.th, c.sortable && s.sortable, c.numeric && s.num)}
                    style={{ width: c.width }}
                    onClick={() => toggle(c)}
                    aria-sort={sort === c.key ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                  <span className={s.thInner}>
                    {c.header}
                    {c.sortable && (
                      <Icon name={sort === c.key && dir === "desc" ? "arrowDown" : "arrowUp"}
                            size={11} strokeWidth={2.5}
                            className={cn(s.arrow, sort === c.key && s.arrowOn)} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }, (_, i) => (
              <tr key={`sk${i}`} className={s.skelRow}>
                {columns.map((c) => <td key={c.key}><Skeleton h={13} /></td>)}
              </tr>
            ))}

            {!loading && rows.map((row) => (
              <tr key={rowKey(row)}
                  className={cn(s.tr, onRowClick && s.clickable)}
                  onClick={() => onRowClick?.(row)}>
                {columns.map((c) => (
                  <td key={c.key} className={cn(s.td, c.numeric && s.num)}>{c.render(row)}</td>
                ))}
              </tr>
            ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={s.empty}>
                  <EmptyState icon={<Icon name="list" size={20} />}
                              title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {meta && onPage && meta.total > 0 && (
        <Pagination meta={meta} onPage={onPage} unit={unit} />
      )}
    </>
  );
}
