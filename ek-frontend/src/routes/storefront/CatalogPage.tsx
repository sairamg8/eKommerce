import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "../../lib/cn";
import { num } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as catalogApi from "../../mock/api/catalog";
import { categories, merchantBySlug } from "../../mock/db";
import { ProductCard } from "../../components/product/ProductCard";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { Pagination } from "../../components/ui/Pagination";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import s from "./CatalogPage.module.css";

const ROOTS = categories.filter((c) => c.depth === 0);

const SORTS = [
  { value: "relevance", label: "Most relevant" },
  { value: "popular", label: "Best selling" },
  { value: "newest", label: "Newest first" },
  { value: "price:asc", label: "Price: low to high" },
  { value: "price:desc", label: "Price: high to low" },
  { value: "rating", label: "Highest rated" },
];

const PRICE_BANDS = [
  { label: "Under ₹2,000", min: 0, max: 2000 },
  { label: "₹2,000 – ₹10,000", min: 2000, max: 10000 },
  { label: "₹10,000 – ₹50,000", min: 10000, max: 50000 },
  { label: "Above ₹50,000", min: 50000, max: undefined },
];

export function CatalogPage() {
  const [params, setParams] = useSearchParams();

  const category = params.get("category") ?? undefined;
  const merchant = params.get("merchant") ?? undefined;
  const q = params.get("q") ?? undefined;
  const page = Number(params.get("page") ?? 1);
  const sortRaw = params.get("sort") ?? "relevance";
  const minPrice = params.get("min") ? Number(params.get("min")) : undefined;
  const maxPrice = params.get("max") ? Number(params.get("max")) : undefined;
  const inStock = params.get("in_stock") === "1";
  const minRating = params.get("rating") ? Number(params.get("rating")) : undefined;

  const [sort, dir] = sortRaw.split(":") as [string, "asc" | "desc" | undefined];

  const query = useMemo(() => ({
    category, merchant, q, page, sort, dir, in_stock_only: inStock,
    min_price: minPrice, max_price: maxPrice, min_rating: minRating,
    per_page: 12,
  }), [category, merchant, q, page, sort, dir, inStock, minPrice, maxPrice, minRating]);

  const { data, loading, error, refetch } = useApi(
    () => catalogApi.listProducts(query),
    [JSON.stringify(query)],
  );

  const patch = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "") p.delete(k);
      else p.set(k, v);
    }
    if (!("page" in next)) p.delete("page");
    setParams(p);
  };

  const activeCat = ROOTS.find((c) => c.slug === category);
  const activeMerchant = merchantBySlug(merchant ?? "");
  const chips: { label: string; clear: () => void }[] = [];
  if (activeMerchant) {
    chips.push({
      label: `Sold by ${activeMerchant.business_name}`,
      clear: () => patch({ merchant: undefined }),
    });
  }
  if (q) chips.push({ label: `Search: "${q}"`, clear: () => patch({ q: undefined }) });
  if (activeCat) chips.push({ label: activeCat.name, clear: () => patch({ category: undefined }) });
  if (minPrice != null || maxPrice != null) {
    chips.push({
      label: `₹${num(minPrice ?? 0)} – ${maxPrice ? `₹${num(maxPrice)}` : "any"}`,
      clear: () => patch({ min: undefined, max: undefined }),
    });
  }
  if (inStock) chips.push({ label: "In stock only", clear: () => patch({ in_stock: undefined }) });
  if (minRating) chips.push({ label: `${minRating}★ & up`, clear: () => patch({ rating: undefined }) });

  return (
    <div className={s.wrap}>
      <aside className={s.rail}>
        <div className={s.group}>
          <span className={s.gh}>Category</span>
          <button className={cn(s.opt, !category && s.optOn)} onClick={() => patch({ category: undefined })}>
            All categories
          </button>
          {ROOTS.map((c) => (
            <button key={c.id} className={cn(s.opt, category === c.slug && s.optOn)}
                    onClick={() => patch({ category: c.slug })}>
              {c.name} <span className={s.pill}>{c.product_count}</span>
            </button>
          ))}
        </div>

        <div className={s.group}>
          <span className={s.gh}>Price</span>
          {PRICE_BANDS.map((b) => {
            const on = minPrice === b.min && maxPrice === b.max;
            return (
              <button key={b.label} className={cn(s.opt, on && s.optOn)}
                      onClick={() => patch(on
                        ? { min: undefined, max: undefined }
                        : { min: String(b.min), max: b.max ? String(b.max) : undefined })}>
                {b.label}
              </button>
            );
          })}
        </div>

        <div className={s.group}>
          <span className={s.gh}>Rating</span>
          {[4, 3].map((r) => (
            <button key={r} className={cn(s.opt, minRating === r && s.optOn)}
                    onClick={() => patch({ rating: minRating === r ? undefined : String(r) })}>
              {r}★ &amp; up
            </button>
          ))}
        </div>

        <div className={s.group}>
          <span className={s.gh}>Availability</span>
          <label className={s.check}>
            <input type="checkbox" checked={inStock}
                   onChange={(e) => patch({ in_stock: e.target.checked ? "1" : undefined })} />
            In stock only
          </label>
        </div>
      </aside>

      <section>
        <div className={s.head}>
          <div className={s.title}>
            <h1 style={{ fontSize: "var(--fs-2xl)" }}>
              {activeMerchant ? activeMerchant.business_name
                : activeCat ? activeCat.name
                : q ? `Results for “${q}”` : "All products"}
            </h1>
            <span className={s.count}>
              {loading ? "Searching…" : `${num(data?.meta.total ?? 0)} products from verified merchants`}
            </span>
          </div>
          <div className={s.tools}>
            <Select
              dense
              options={SORTS}
              value={sortRaw}
              onChange={(e) => patch({ sort: e.target.value })}
              aria-label="Sort products"
            />
          </div>
        </div>

        {chips.length > 0 && (
          <div className={s.chips}>
            {chips.map((c) => (
              <span key={c.label} className={s.chip}>
                {c.label}
                <button onClick={c.clear} aria-label={`Clear ${c.label}`}>
                  <Icon name="x" size={12} />
                </button>
              </span>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setParams(new URLSearchParams())}>
              Clear all
            </Button>
          </div>
        )}

        {loading && (
          <div className={s.grid}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={s.skel}>
                <Skeleton h={158} radius={0} />
                <div style={{ padding: 16, display: "grid", gap: 8 }}>
                  <Skeleton h={10} w="45%" />
                  <Skeleton h={14} />
                  <Skeleton h={14} w="70%" />
                  <Skeleton h={20} w="40%" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <Card>
            <EmptyState tone="danger" icon={<Icon name="alert" size={20} />}
              title="Could not load products" description={error}
              action={<Button size="sm" onClick={refetch}><Icon name="refresh" size={14} /> Retry</Button>} />
          </Card>
        )}

        {!loading && !error && data && data.data.length === 0 && (
          <Card>
            <EmptyState icon={<Icon name="search" size={20} />}
              title="No products match those filters"
              description="Try widening the price range, or clearing a filter or two."
              action={<Button size="sm" variant="secondary" onClick={() => setParams(new URLSearchParams())}>
                Clear all filters
              </Button>} />
          </Card>
        )}

        {!loading && !error && data && data.data.length > 0 && (
          <>
            <div className={s.grid}>
              {data.data.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className={s.pager}>
              <Pagination meta={data.meta} unit="products"
                          onPage={(p) => patch({ page: String(p) })} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
