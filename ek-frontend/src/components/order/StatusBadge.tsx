import type { DeliveryStatus, OrderStatus, PaymentStatus } from "../../mock/types";
import { Badge } from "../ui/Badge";
import type { Tone } from "../ui/Badge";

const ORDER_TONE: Record<OrderStatus, Tone> = {
  pending: "warning", paid: "info", packed: "info", shipped: "brand",
  delivered: "success", cancelled: "neutral", refunded: "danger",
};

const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  unpaid: "warning", authorized: "info", captured: "success",
  failed: "danger", refunded: "neutral",
};

const DELIVERY_TONE: Record<DeliveryStatus, Tone> = {
  awaiting_pickup: "warning", picked_up: "info", in_transit: "info",
  at_hub: "info", out_for_delivery: "brand", delivered: "success",
  failed_attempt: "danger", returned: "neutral",
};

const label = (s: string) => s.replace(/_/g, " ");

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge tone={ORDER_TONE[status]} dot>{label(status)}</Badge>
);

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge tone={PAYMENT_TONE[status]} dot>{label(status)}</Badge>
);

export const DeliveryStatusBadge = ({ status }: { status: DeliveryStatus }) => (
  <Badge tone={DELIVERY_TONE[status]} dot>{label(status)}</Badge>
);
