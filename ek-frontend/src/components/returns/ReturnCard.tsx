import type { ReturnRequest, ReturnStatus } from "../../mock/types";
import { cn } from "../../lib/cn";
import { date, money } from "../../lib/format";
import { Badge } from "../ui/Badge";
import type { Tone } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { Thumb } from "../ui/Thumb";
import { Card } from "../ui/Card";
import s from "./Returns.module.css";

export const RETURN_TONE: Record<ReturnStatus, Tone> = {
  requested: "warning", approved: "info", rejected: "danger",
  pickup_scheduled: "brand", picked_up: "brand", refunded: "success",
};

export function ReturnCard({ request, footer }: {
  request: ReturnRequest;
  footer?: React.ReactNode;
}) {
  return (
    <Card className={s.card}>
      <div className={s.head}>
        <span className={s.rma}>{request.rma_number}</span>
        <Badge tone={RETURN_TONE[request.status]} dot>
          {request.status.replace(/_/g, " ")}
        </Badge>
        {request.rejected_at_door && <Badge tone="danger">Refused at door</Badge>}
        <span className={s.spacer} />
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
          Order <span className="mono">{request.order_number}</span> · {date(request.created_at)}
        </span>
      </div>

      <div className={s.body}>
        <div className={s.reasonRow}>
          <Icon name="alert" size={15} />
          {request.reason.replace(/_/g, " ")}
          <span className={s.spacer} />
          <span className="tabular" style={{ fontWeight: 700 }}>{money(request.refund_amount)}</span>
        </div>

        <p className={s.comment}>{request.comment}</p>

        {request.evidence.length > 0 && (
          <div className={s.evidence}>
            {request.evidence.map((m) => (
              <span key={m.id} className={s.shot}
                    style={{
                      background: `linear-gradient(145deg, hsl(${m.hue} 60% 92%), hsl(${(m.hue + 40) % 360} 55% 84%))`,
                      color: `hsl(${m.hue} 45% 32%)`,
                    }}>
                <Icon name={m.kind === "video" ? "camera" : "image"} size={16} />
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          {request.items.map((it) => (
            <div key={it.order_item_id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Thumb hue={it.image_hue} size={34} label={it.name} />
              <span style={{ flex: 1, fontSize: "var(--fs-sm)", fontWeight: 500 }}>
                {it.name}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> × {it.quantity}</span>
              </span>
              <span className="tabular" style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>
                {money(it.unit_price * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        {request.merchant_response && (
          <div className={cn(s.response)}>
            <strong>{request.merchant_name}:</strong> {request.merchant_response}
          </div>
        )}
      </div>

      {footer && <div className={s.foot}>{footer}</div>}
    </Card>
  );
}
