import type { PageMeta } from "../../mock/types";
import { cn } from "../../lib/cn";
import { num } from "../../lib/format";
import { Icon } from "./Icon";
import s from "./Pagination.module.css";

/** Windowed page list: 1 … 4 5 [6] 7 8 … 20 */
function windowed(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(total - 1, page + 1);
  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push("gap");
  out.push(total);
  return out;
}

export function Pagination({ meta, onPage, unit = "results" }: {
  meta: PageMeta; onPage: (page: number) => void; unit?: string;
}) {
  const first = (meta.page - 1) * meta.per_page + 1;
  const last = Math.min(meta.page * meta.per_page, meta.total);

  return (
    <div className={s.bar}>
      <span className={s.info}>
        {meta.total === 0
          ? `No ${unit}`
          : `${num(first)}–${num(last)} of ${num(meta.total)} ${unit}`}
      </span>
      <div className={s.pages}>
        <button className={s.pg} disabled={!meta.has_prev}
                onClick={() => onPage(meta.page - 1)} aria-label="Previous page">
          <Icon name="chevronLeft" size={15} />
        </button>
        {windowed(meta.page, meta.total_pages).map((p, i) =>
          p === "gap"
            ? <span key={`g${i}`} className={s.gap}>…</span>
            : <button key={p} className={cn(s.pg, p === meta.page && s.active)}
                      onClick={() => onPage(p)}
                      aria-current={p === meta.page ? "page" : undefined}>{p}</button>,
        )}
        <button className={s.pg} disabled={!meta.has_next}
                onClick={() => onPage(meta.page + 1)} aria-label="Next page">
          <Icon name="chevronRight" size={15} />
        </button>
      </div>
    </div>
  );
}
