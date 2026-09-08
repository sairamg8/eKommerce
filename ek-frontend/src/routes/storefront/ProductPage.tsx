import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cn } from "../../lib/cn";
import { money, relative } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import * as catalogApi from "../../mock/api/catalog";
import { ProductCard } from "../../components/product/ProductCard";
import { categoryById, merchantById } from "../../mock/db";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { LoadingBlock } from "../../components/ui/Spinner";
import { Rating } from "../../components/ui/Rating";
import { Thumb } from "../../components/ui/Thumb";
import { useCart } from "../../store/CartContext";
import { ReviewComposer } from "../../components/review/ReviewComposer";
import type { ReviewTarget } from "../../components/review/ReviewComposer";
import { ReviewMedia } from "../../components/review/ReviewMedia";
import s from "./ProductPage.module.css";

type Tab = "description" | "specs" | "reviews";

export function ProductPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { add, busy } = useCart();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("description");
  const [shot, setShot] = useState(0);
  const [writing, setWriting] = useState<ReviewTarget | null>(null);

  const { data: product, loading, error } = useApi(() => catalogApi.getProduct(slug), [slug]);
  const reviews = useApi(
    () => (product ? catalogApi.getReviews(product.id) : Promise.resolve(null)),
    [product?.id],
  );
  const related = useApi(
    () => (product ? catalogApi.getRelated(product) : Promise.resolve([])),
    [product?.id],
  );

  if (loading) return <LoadingBlock label="Loading product…" />;
  if (error || !product) {
    return (
      <Card>
        <EmptyState tone="danger" icon={<Icon name="alert" size={20} />}
          title="Product not found" description={error ?? "That product no longer exists."}
          action={<Button size="sm" onClick={() => navigate("/products")}>Back to catalogue</Button>} />
      </Card>
    );
  }

  const categorySlug = categoryById(product.category_id)?.slug ?? "";
  const merchantSlug = merchantById(product.merchant_id)?.slug ?? "";
  const off = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;
  const low = product.stock > 0 && product.stock <= product.low_stock_threshold;
  const bd = reviews.data?.breakdown;

  return (
    <div>
      <nav className={s.crumbs}>
        <Link to="/">Home</Link><Icon name="chevronRight" size={12} />
        <Link to="/products">Products</Link><Icon name="chevronRight" size={12} />
        <Link to={`/products?category=${categorySlug}`}>{product.category_name}</Link>
        <Icon name="chevronRight" size={12} />
        <span>{product.name}</span>
      </nav>

      <div className={s.top}>
        <div className={s.gallery}>
          <div className={s.main}
               style={{
                 background: `linear-gradient(145deg, hsl(${(product.image_hue + shot * 24) % 360} 60% 93%), hsl(${(product.image_hue + 45 + shot * 24) % 360} 55% 84%))`,
                 color: `hsl(${product.image_hue} 45% 34%)`,
               }}>
            <span className={s.glyph}>{product.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className={s.thumbs}>
            {[0, 1, 2, 3].map((i) => (
              <button key={i} className={cn(s.tb, shot === i && s.tbOn)} onClick={() => setShot(i)}
                      aria-label={`View image ${i + 1}`}
                      style={{ background: `linear-gradient(145deg, hsl(${(product.image_hue + i * 24) % 360} 60% 93%), hsl(${(product.image_hue + 45 + i * 24) % 360} 55% 84%))` }} />
            ))}
          </div>
        </div>

        <div className={s.buy}>
          <Link to={`/products?merchant=${merchantSlug}`} className={s.merchant}>
            <Thumb hue={product.image_hue} size={20} label={product.merchant_name} radius={5} />
            {product.merchant_name}
            <Badge tone="success" dot>Verified</Badge>
          </Link>

          <h1 className={s.h1}>{product.name}</h1>

          <div className={s.ratingRow}>
            <Rating value={product.avg_rating} count={product.review_count} size={15} />
            <button className={s.link} onClick={() => setTab("reviews")}>Read reviews</button>
            <span className={s.revMeta}>SKU {product.sku}</span>
          </div>

          <div className={s.priceBox}>
            <div className={s.priceRow}>
              <span className={cn(s.price, "tabular")}>{money(product.price)}</span>
              {product.compare_at_price && (
                <>
                  <span className={cn(s.was, "tabular")}>{money(product.compare_at_price)}</span>
                  <span className={s.save}>Save {off}%</span>
                </>
              )}
            </div>
            <span className={s.taxNote}>Inclusive of all taxes · Free delivery above ₹999</span>
          </div>

          <div className={s.stockRow}>
            {product.stock === 0
              ? <Badge tone="danger" dot>Out of stock</Badge>
              : low
                ? <Badge tone="warning" dot>Only {product.stock} left</Badge>
                : <Badge tone="success" dot>In stock</Badge>}
            <span className={s.revMeta}>Dispatched within 24 hours</span>
          </div>

          <div className={s.qtyRow}>
            <div className={s.qty}>
              <button className={s.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1} aria-label="Decrease quantity">
                <Icon name="minus" size={14} />
              </button>
              <span className={cn(s.qtyV, "tabular")}>{qty}</span>
              <button className={s.qtyBtn} onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      disabled={qty >= product.stock} aria-label="Increase quantity">
                <Icon name="plus" size={14} />
              </button>
            </div>
            <span className={s.revMeta}>{product.stock} available</span>
          </div>

          <div className={s.cta}>
            <Button size="lg" block disabled={product.stock === 0 || busy}
                    onClick={() => void add(product.id, qty)}>
              <Icon name="cart" size={17} /> Add to cart
            </Button>
            <Button size="lg" block variant="secondary" disabled={product.stock === 0 || busy}
                    onClick={() => {
                      void add(product.id, qty).then((ok) => { if (ok) navigate("/cart"); });
                    }}>
              Buy it now
            </Button>
          </div>

          <div className={s.perks}>
            {[
              { i: "truck", t: "Free delivery above ₹999", d: "Arrives in 2–4 business days" },
              { i: "refresh", t: "14-day returns", d: "No questions asked, seller pays return shipping" },
              { i: "shield", t: "2-year warranty", d: "Covered directly by the merchant" },
              { i: "wallet", t: "Secure payments", d: "UPI, cards, netbanking and cash on delivery" },
            ].map((p) => (
              <div key={p.t} className={s.perk}>
                <Icon name={p.i} size={16} className={s.perkIco} />
                <div>
                  <div className={s.perkT}>{p.t}</div>
                  <div className={s.perkD}>{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={s.tabs} role="tablist">
        {(["description", "specs", "reviews"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t}
                  className={cn(s.tab, tab === t && s.tabOn)} onClick={() => setTab(t)}>
            {t === "description" ? "Description" : t === "specs" ? "Specifications"
              : `Reviews (${bd?.total ?? 0})`}
          </button>
        ))}
      </div>

      <div className={s.panel}>
        {tab === "description" && <p className={s.prose}>{product.description}</p>}

        {tab === "specs" && (
          <Card>
            <div className={s.attrs}>
              {Object.entries(product.attributes).map(([k, v]) => (
                <div key={k} className={s.attr}>
                  <span className={s.attrK}>{k.replace(/_/g, " ")}</span>
                  <span className={s.attrV}>{typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}</span>
                </div>
              ))}
              <div className={s.attr}><span className={s.attrK}>SKU</span><span className={cn(s.attrV, "mono")}>{product.sku}</span></div>
              <div className={s.attr}><span className={s.attrK}>Category</span><span className={s.attrV}>{product.category_name}</span></div>
              <div className={s.attr}><span className={s.attrK}>Sold by</span><span className={s.attrV}>{product.merchant_name}</span></div>
            </div>
          </Card>
        )}

        {tab === "reviews" && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "var(--sp-4)", flexWrap: "wrap", padding: "var(--sp-4)",
            background: "var(--surface-sunken)", borderRadius: "var(--r-lg)",
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "var(--fs-md)" }}>Bought this product?</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                Only customers with a delivered order can review — that check lives on the server.
              </div>
            </div>
            <Button variant="secondary"
                    onClick={() => setWriting({ productId: product.id, name: product.name })}>
              <Icon name="star" size={15} /> Write a review
            </Button>
          </div>
        )}

        {tab === "reviews" && (
          reviews.loading ? <LoadingBlock label="Loading reviews…" />
          : !bd || bd.total === 0 ? (
            <EmptyState icon={<Icon name="star" size={20} />} title="No reviews yet"
              description="Only customers who bought this product can leave a review."
              action={<Button size="sm"
                              onClick={() => setWriting({ productId: product.id, name: product.name })}>
                <Icon name="star" size={14} /> Be the first to review
              </Button>} />
          ) : (
            <>
              <div className={s.revTop}>
                <div>
                  <div className={s.big}>{bd.average.toFixed(1)}</div>
                  <Rating value={bd.average} size={16} showValue={false} />
                  <div className={s.revMeta} style={{ marginTop: 6 }}>{bd.total} verified reviews</div>
                </div>
                <div className={s.bars}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const c = bd.counts[star - 1] ?? 0;
                    return (
                      <div key={star} className={s.bar}>
                        <span style={{ width: 34 }}>{star} ★</span>
                        <span className={s.track}>
                          <span className={s.fill} style={{ width: `${bd.total ? (c / bd.total) * 100 : 0}%` }} />
                        </span>
                        <span style={{ width: 28, textAlign: "right" }}>{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {reviews.data?.reviews.map((r) => (
                <div key={r.id} className={s.review}>
                  <div className={s.revHead}>
                    <Thumb hue={r.author_hue} size={30} label={r.author_name} radius={999} />
                    <div>
                      <div className={s.revName}>{r.author_name}</div>
                      <div className={s.revMeta}>{relative(r.created_at)}</div>
                    </div>
                    <Rating value={r.rating} size={13} showValue={false} />
                    {r.verified_purchase && <Badge tone="success" dot>Verified purchase</Badge>}
                  </div>
                  <div className={s.revTitle}>{r.title}</div>
                  <p className={s.revBody}>{r.body}</p>
                  <ReviewMedia media={r.media} />
                  <div className={s.revFoot}>
                    <span>{r.helpful_count} found this helpful</span>
                  </div>
                </div>
              ))}
            </>
          )
        )}
      </div>

      <ReviewComposer
        target={writing}
        onClose={() => setWriting(null)}
        onPublished={() => { setWriting(null); reviews.refetch(); }}
      />

      {(related.data?.length ?? 0) > 0 && (
        <section className={s.related}>
          <h2 style={{ fontSize: "var(--fs-xl)", marginBottom: "var(--sp-4)" }}>
            More in {product.category_name}
          </h2>
          <div className={s.grid}>
            {related.data?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
