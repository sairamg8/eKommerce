import { useState } from "react";
import { Link } from "react-router-dom";
import type { Review } from "../../mock/types";
import { cn } from "../../lib/cn";
import { relative } from "../../lib/format";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { Rating } from "../../components/ui/Rating";
import { Thumb } from "../../components/ui/Thumb";
import { ReviewComposer } from "../../components/review/ReviewComposer";
import type { ReviewTarget } from "../../components/review/ReviewComposer";
import { ReviewMedia } from "../../components/review/ReviewMedia";
import { customers, orders, productById, reviews as allReviews } from "../../mock/db";

import s from "./ReviewsPage.module.css";

const me = customers[0]!;

export function ReviewsPage() {
  const [tab, setTab] = useState<"written" | "pending">("pending");
  const [mine, setMine] = useState<Review[]>(() => allReviews.filter((r) => r.user_id === me.id));
  const [draft, setDraft] = useState<ReviewTarget | null>(null);

  // Only delivered items the customer actually bought can be reviewed.
  const reviewed = new Set(mine.map((r) => r.product_id));
  const pending = [...new Map(
    orders
      .filter((o) => o.user_id === me.id && o.status === "delivered")
      .flatMap((o) => o.items)
      .filter((i) => !reviewed.has(i.product_id))
      .map((i) => [i.product_id, i]),
  ).values()];

  return (
    <div>
      <PageHeader title="My reviews" subtitle="Only products you have received can be reviewed" />

      <div className={s.tabs}>
        <button className={cn(s.tab, tab === "pending" && s.tabOn)} onClick={() => setTab("pending")}>
          To review ({pending.length})
        </button>
        <button className={cn(s.tab, tab === "written" && s.tabOn)} onClick={() => setTab("written")}>
          Written ({mine.length})
        </button>
      </div>

      <Card>
        {tab === "pending" && (
          pending.length === 0 ? (
            <EmptyState icon={<Icon name="star" size={20} />} title="Nothing to review"
              description="Once an order is delivered, its items show up here." />
          ) : pending.map((item) => (
            <div key={item.product_id} className={s.row}>
              <Thumb hue={item.image_hue} size={54} label={item.name_snapshot} />
              <div className={s.body}>
                <Link to={`/product/${productById(item.product_id)?.slug ?? ""}`} className={s.name}>
                  {item.name_snapshot}
                </Link>
                <span className={s.meta}>{item.merchant_name}</span>
                <Badge tone="success" dot>Verified purchase</Badge>
              </div>
              <Button size="sm" onClick={() =>
                setDraft({ productId: item.product_id, name: item.name_snapshot })
              }>
                <Icon name="star" size={14} /> Write a review
              </Button>
            </div>
          ))
        )}

        {tab === "written" && (
          mine.length === 0 ? (
            <EmptyState icon={<Icon name="edit" size={20} />} title="No reviews yet"
              description="Reviews you write appear here and on the product page." />
          ) : mine.map((r) => {
            const p = productById(r.product_id);
            return (
              <div key={r.id} className={s.row}>
                <Thumb hue={p?.image_hue ?? 200} size={54} label={p?.name ?? "?"} />
                <div className={s.body}>
                  <Link to={`/product/${p?.slug ?? ""}`} className={s.name}>{p?.name ?? "Product"}</Link>
                  <Rating value={r.rating} size={13} showValue={false} />
                  <div className={s.title}>{r.title}</div>
                  <p className={s.text}>{r.body}</p>
                  <ReviewMedia media={r.media} />
                  <div className={s.foot}>
                    <span className={s.meta}>{relative(r.created_at)}</span>
                    <span className={s.meta}>· {r.helpful_count} found this helpful</span>
                    {r.verified_purchase && <Badge tone="success" dot>Verified</Badge>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>

      <ReviewComposer
        target={draft}
        onClose={() => setDraft(null)}
        onPublished={(review) => { setMine((m) => [review, ...m]); setDraft(null); setTab("written"); }}
      />
    </div>
  );
}
