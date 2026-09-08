import { useState } from "react";
import { Link } from "react-router-dom";
import { money } from "../../lib/format";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { Rating } from "../../components/ui/Rating";
import { Thumb } from "../../components/ui/Thumb";
import { useCart } from "../../store/CartContext";
import { useToast } from "../../store/ToastContext";
import { activeProducts } from "../../mock/db";
import s from "./ReviewsPage.module.css";

export function WishlistPage() {
  const [items, setItems] = useState(() => activeProducts.slice(3, 9));
  const { add, busy } = useCart();
  const { push } = useToast();

  const remove = (id: string) => {
    setItems((list) => list.filter((p) => p.id !== id));
    push("Removed from wishlist", "info");
  };

  return (
    <div>
      <PageHeader title="Wishlist" subtitle={`${items.length} saved ${items.length === 1 ? "item" : "items"}`} />
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={<Icon name="heart" size={20} />} title="Your wishlist is empty"
            description="Tap the heart on any product to save it for later."
            action={<Link to="/products"><Button size="sm">Browse products</Button></Link>} />
        ) : items.map((p) => (
          <div key={p.id} className={s.row}>
            <Thumb hue={p.image_hue} size={62} label={p.name} />
            <div className={s.body}>
              <Link to={`/product/${p.slug}`} className={s.name}>{p.name}</Link>
              <span className={s.meta}>{p.merchant_name}</span>
              <Rating value={p.avg_rating} count={p.review_count} size={12} />
              <div className={s.foot}>
                <span style={{ fontWeight: 700, fontSize: "var(--fs-lg)" }} className="tabular">
                  {money(p.price)}
                </span>
                {p.stock === 0
                  ? <Badge tone="danger" dot>Out of stock</Badge>
                  : p.stock <= p.low_stock_threshold
                    ? <Badge tone="warning" dot>Only {p.stock} left</Badge>
                    : <Badge tone="success" dot>In stock</Badge>}
              </div>
            </div>
            <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
              <Button size="sm" disabled={p.stock === 0 || busy} onClick={() => void add(p.id)}>
                <Icon name="cart" size={14} /> Add to cart
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                <Icon name="trash" size={13} /> Remove
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
