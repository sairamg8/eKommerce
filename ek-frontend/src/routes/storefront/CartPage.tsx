import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import { money } from "../../lib/format";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { LoadingBlock } from "../../components/ui/Spinner";
import { Thumb } from "../../components/ui/Thumb";
import { useCart } from "../../store/CartContext";
import { productById } from "../../mock/db";
import s from "./CartPage.module.css";

const SUGGESTED = ["WELCOME10", "FEST20", "FREESHIP", "BIGSAVE15"];

export function CartPage() {
  const { cart, busy, setQty, remove, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  if (!cart) return <LoadingBlock label="Loading your cart…" />;

  if (cart.items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Icon name="cart" size={22} />}
          title="Your cart is empty"
          description="Browse the catalogue and add something you like — items stay here for your session."
          action={<Button onClick={() => navigate("/products")}>
            <Icon name="grid" size={15} /> Browse products
          </Button>}
        />
      </Card>
    );
  }

  // Group by merchant so the marketplace split is visible before checkout.
  const groups = new Map<string, typeof cart.items>();
  for (const item of cart.items) {
    const m = productById(item.product_id)?.merchant_name ?? "Marketplace";
    const list = groups.get(m) ?? [];
    list.push(item);
    groups.set(m, list);
  }

  const t = cart.totals;

  return (
    <div>
      <h1 className={s.h1}>Your cart</h1>
      <p className={s.sub}>
        {cart.items.length} {cart.items.length === 1 ? "item" : "items"} from{" "}
        {groups.size} {groups.size === 1 ? "merchant" : "merchants"} — each ships separately
      </p>

      <div className={s.wrap}>
        <div>
          {[...groups].map(([merchant, items]) => (
            <Card key={merchant} className={s.group}>
              <div className={s.ghead}>
                <Icon name="store" size={14} />
                <span className={s.gname}>{merchant}</span>
                <span className={s.gnote}>Ships separately · arrives in 2–4 days</span>
              </div>
              {items.map((item) => (
                <div key={item.id} className={s.row}>
                  <Thumb hue={item.image_hue} size={72} label={item.name} />
                  <div className={s.info}>
                    <Link to={`/product/${item.slug}`} className={s.name}>{item.name}</Link>
                    <span className={cn(s.meta, "mono")}>{item.sku}</span>
                    <span className={s.unit}>{money(item.unit_price)} each</span>
                    <button className={s.rm} onClick={() => void remove(item.id)}>
                      Remove
                    </button>
                  </div>
                  <div className={s.right}>
                    <span className={cn(s.lineTotal, "tabular")}>{money(item.line_total)}</span>
                    <div className={s.qty}>
                      <button className={s.qtyBtn} disabled={busy || item.quantity <= 1}
                              onClick={() => void setQty(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity">
                        <Icon name="minus" size={13} />
                      </button>
                      <span className={cn(s.qtyV, "tabular")}>{item.quantity}</span>
                      <button className={s.qtyBtn}
                              disabled={busy || item.quantity >= item.available_stock}
                              onClick={() => void setQty(item.id, item.quantity + 1)}
                              aria-label="Increase quantity">
                        <Icon name="plus" size={13} />
                      </button>
                    </div>
                    <span className={s.meta}>{item.available_stock} in stock</span>
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>

        <div className={s.summary}>
          <Card>
            <CardHeader title="Order summary" />
            <CardBody>
              <div className={s.line}>
                <span className={s.lbl}>Subtotal</span>
                <span className="tabular">{money(t.subtotal)}</span>
              </div>
              {t.discount > 0 && (
                <div className={s.line}>
                  <span className={s.lbl}>Discount ({cart.coupon_code})</span>
                  <span className={cn(s.disc, "tabular")}>−{money(t.discount)}</span>
                </div>
              )}
              <div className={s.line}>
                <span className={s.lbl}>GST (18%)</span>
                <span className="tabular">{money(t.tax)}</span>
              </div>
              <div className={s.line}>
                <span className={s.lbl}>Shipping</span>
                <span className="tabular">{t.shipping === 0 ? "Free" : money(t.shipping)}</span>
              </div>
              <div className={s.total}>
                <span>Total</span>
                <span className="tabular">{money(t.total)}</span>
              </div>
              <Button size="lg" block style={{ marginTop: 16 }} disabled={busy}
                      onClick={() => navigate("/checkout")}>
                Proceed to checkout <Icon name="arrowRight" size={16} />
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Have a coupon?" />
            <CardBody>
              {cart.coupon_code ? (
                <div className={s.couponOn}>
                  <Icon name="check" size={14} />
                  <strong>{cart.coupon_code}</strong> applied
                  <button style={{ marginLeft: "auto" }} onClick={() => void removeCoupon()}
                          aria-label="Remove coupon">
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <div className={s.coupon}>
                    <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                           placeholder="Enter code" aria-label="Coupon code" />
                    <Button variant="secondary" disabled={!code || busy}
                            onClick={() => void applyCoupon(code).then((ok) => ok && setCode(""))}>
                      Apply
                    </Button>
                  </div>
                  <p className={s.hint} style={{ marginTop: 8 }}>Try one of these:</p>
                  <div className={s.codes}>
                    {SUGGESTED.map((c) => (
                      <button key={c} className={s.code} onClick={() => setCode(c)}>{c}</button>
                    ))}
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
