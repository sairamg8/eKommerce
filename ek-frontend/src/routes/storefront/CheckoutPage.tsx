import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import { money } from "../../lib/format";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Input, Textarea } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { Thumb } from "../../components/ui/Thumb";
import { useCart } from "../../store/CartContext";
import { useToast } from "../../store/ToastContext";
import * as ordersApi from "../../mock/api/orders";
import s from "./CheckoutPage.module.css";

const ADDRESSES = [
  { id: "a1", label: "Home", text: "12 Brigade Rd, Ashok Nagar, Bengaluru, Karnataka 560001", phone: "+91 98450 11223" },
  { id: "a2", label: "Office", text: "Prestige Tech Park, Marathahalli, Bengaluru, Karnataka 560103", phone: "+91 98450 11223" },
];

const PAYMENTS = [
  { id: "UPI — GPay", title: "UPI", desc: "Pay instantly with GPay, PhonePe or any UPI app", icon: "wallet" },
  { id: "Card — Visa ••4821", title: "Credit / debit card", desc: "Visa, Mastercard, RuPay and Amex accepted", icon: "wallet" },
  { id: "Netbanking — HDFC", title: "Netbanking", desc: "All major Indian banks supported", icon: "shield" },
  { id: "Cash on Delivery", title: "Cash on delivery", desc: "Pay the delivery agent when your order arrives", icon: "rupee" },
];

export function CheckoutPage() {
  const { cart, clear } = useCart();
  const { push } = useToast();
  const navigate = useNavigate();

  const [addressId, setAddressId] = useState("a1");
  const [payment, setPayment] = useState(PAYMENTS[0]!.id);
  const [newAddress, setNewAddress] = useState("");
  const [useNew, setUseNew] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  // Bounce an empty cart back — but never after a successful placement,
  // which legitimately empties it.
  useEffect(() => {
    if (!placed && cart && cart.items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [cart, placed, navigate]);

  if (!cart || cart.items.length === 0) return null;

  const t = cart.totals;

  const place = async () => {
    setPlacing(true);
    try {
      const address = useNew ? newAddress : ADDRESSES.find((a) => a.id === addressId)!.text;
      if (useNew && newAddress.trim().length < 15) {
        push("Please enter a complete delivery address", "error");
        setPlacing(false);
        return;
      }
      const order = await ordersApi.placeOrder({ address, payment_method: payment });
      setPlaced(true);
      push(`Order ${order.order_number} placed`, "success");
      await clear();
      navigate(`/account/orders/${order.id}?placed=1`);
    } catch (e) {
      push(e instanceof Error ? e.message : "Checkout failed", "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div>
      <div className={s.steps}>
        <span className={cn(s.step, s.done)}><span className={s.dot}><Icon name="check" size={11} /></span> Cart</span>
        <span className={s.sep} />
        <span className={cn(s.step, s.on)}><span className={s.dot}>2</span> Delivery &amp; payment</span>
        <span className={s.sep} />
        <span className={s.step}><span className={s.dot}>3</span> Confirmation</span>
      </div>

      <div className={s.wrap}>
        <div style={{ display: "grid", gap: "var(--sp-4)" }}>
          <Card>
            <CardHeader title="Delivery address" subtitle="Where should this order go?" />
            <CardBody>
              {ADDRESSES.map((a) => (
                <button key={a.id} className={cn(s.opt, !useNew && addressId === a.id && s.optOn)}
                        onClick={() => { setAddressId(a.id); setUseNew(false); }}>
                  <span className={s.radio} />
                  <span className={s.optBody}>
                    <span className={s.optT}>{a.label}</span>
                    <span className={s.optD}>{a.text}</span>
                    <span className={s.optD}>{a.phone}</span>
                  </span>
                </button>
              ))}
              <button className={cn(s.opt, useNew && s.optOn)} onClick={() => setUseNew(true)}>
                <span className={s.radio} />
                <span className={s.optBody}>
                  <span className={s.optT}>Use a new address</span>
                  <span className={s.optD}>Enter a different delivery location</span>
                </span>
              </button>
              {useNew && (
                <div style={{ marginTop: 12 }}>
                  <Textarea value={newAddress} onChange={(e) => setNewAddress(e.target.value)}
                            label="Full address" required
                            placeholder="Flat / house no, street, area, city, state, PIN code" />
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payment method" subtitle="Mock gateway — no real charge is made" />
            <CardBody>
              {PAYMENTS.map((p) => (
                <button key={p.id} className={cn(s.opt, payment === p.id && s.optOn)}
                        onClick={() => setPayment(p.id)}>
                  <span className={s.radio} />
                  <span className={s.optBody}>
                    <span className={s.optT}>{p.title}</span>
                    <span className={s.optD}>{p.desc}</span>
                  </span>
                  <Icon name={p.icon} size={18} />
                </button>
              ))}
              {payment.startsWith("Card") && (
                <div style={{ display: "grid", gap: 12, marginTop: 16, maxWidth: 420 }}>
                  <Input label="Card number" placeholder="4242 4242 4242 4242" inputMode="numeric" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Expiry" placeholder="MM / YY" />
                    <Input label="CVV" placeholder="123" inputMode="numeric" />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className={s.summary}>
          <Card>
            <CardHeader title="Order summary" subtitle={`${cart.items.length} items`} />
            <CardBody>
              {cart.items.map((i) => (
                <div key={i.id} className={s.mini}>
                  <Thumb hue={i.image_hue} size={38} label={i.name} />
                  <span className={s.miniN}>{i.name}</span>
                  <span className={s.miniQ}>×{i.quantity}</span>
                  <span className="tabular" style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>
                    {money(i.line_total)}
                  </span>
                </div>
              ))}
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "12px 0" }} />
              <div className={s.line}><span className={s.lbl}>Subtotal</span><span className="tabular">{money(t.subtotal)}</span></div>
              {t.discount > 0 && (
                <div className={s.line}>
                  <span className={s.lbl}>Discount ({cart.coupon_code})</span>
                  <span className={cn(s.disc, "tabular")}>−{money(t.discount)}</span>
                </div>
              )}
              <div className={s.line}><span className={s.lbl}>GST (18%)</span><span className="tabular">{money(t.tax)}</span></div>
              <div className={s.line}><span className={s.lbl}>Shipping</span><span className="tabular">{t.shipping === 0 ? "Free" : money(t.shipping)}</span></div>
              <div className={s.total}><span>Total</span><span className="tabular">{money(t.total)}</span></div>

              <Button size="lg" block style={{ marginTop: 16 }} disabled={placing} onClick={() => void place()}>
                {placing ? <><Spinner size={15} /> Placing order…</> : <>Place order · {money(t.total)}</>}
              </Button>
              <p className={s.note}>
                Placing this order runs the checkout transaction: stock is locked and
                validated, prices are snapshotted, and the order splits into one
                fulfilment per merchant.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
