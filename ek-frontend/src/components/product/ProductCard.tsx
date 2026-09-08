import { Link } from "react-router-dom";
import type { Product } from "../../mock/types";
import { cn } from "../../lib/cn";
import { money } from "../../lib/format";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Rating } from "../ui/Rating";
import { useCart } from "../../store/CartContext";
import s from "./ProductCard.module.css";

export function ProductCard({ product }: { product: Product }) {
  const { add, busy } = useCart();
  const off = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;
  const low = product.stock > 0 && product.stock <= product.low_stock_threshold;

  return (
    <article className={s.card}>
      <Link to={`/product/${product.slug}`} className={s.media}
            style={{
              background: `linear-gradient(145deg, hsl(${product.image_hue} 60% 93%), hsl(${(product.image_hue + 45) % 360} 55% 85%))`,
              color: `hsl(${product.image_hue} 45% 34%)`,
            }}>
        <span className={s.glyph}>{product.name.slice(0, 2).toUpperCase()}</span>
        <div className={s.flags}>
          {off > 0 && <Badge tone="danger">{off}% off</Badge>}
          {product.stock === 0 && <Badge tone="neutral">Out of stock</Badge>}
        </div>
        <button className={s.wish} aria-label="Save for later" onClick={(e) => e.preventDefault()}>
          <Icon name="heart" size={14} />
        </button>
      </Link>

      <div className={s.body}>
        <span className={s.merchant}>{product.merchant_name}</span>
        <Link to={`/product/${product.slug}`} className={s.name}>{product.name}</Link>
        <Rating value={product.avg_rating} count={product.review_count} size={12} />
        <div className={s.priceRow}>
          <span className={cn(s.price, "tabular")}>{money(product.price)}</span>
          {product.compare_at_price && (
            <>
              <span className={cn(s.was, "tabular")}>{money(product.compare_at_price)}</span>
              <span className={s.off}>{off}% off</span>
            </>
          )}
        </div>
        <div className={s.foot}>
          <span className={cn(s.stock, low && s.low, product.stock === 0 && s.out)}>
            {product.stock === 0 ? "Out of stock"
              : low ? `Only ${product.stock} left`
              : `${product.stock} in stock`}
          </span>
        </div>
      </div>

      <div className={s.actions}>
        <Button size="sm" block variant={product.stock === 0 ? "secondary" : "primary"}
                disabled={product.stock === 0 || busy}
                onClick={() => void add(product.id)}>
          <Icon name="cart" size={14} />
          {product.stock === 0 ? "Notify me" : "Add to cart"}
        </Button>
      </div>
    </article>
  );
}
