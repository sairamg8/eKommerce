import type {
  ApiPaged, ListQuery, MediaAsset, ReturnItem, ReturnReason,
  ReturnRequest, ReturnStatus,
} from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import { paginate, search } from "../core/paginate";
import {
  returns, returnById, returnsForUser, returnsForMerchant, returnForOrder,
  orderById, fulfilmentById, productById, nextId,
} from "../db";

export type ReturnQuery = ListQuery & {
  status?: ReturnStatus;
  user_id?: string;
  merchant_id?: string;
};

export function listReturns(query: ReturnQuery = {}): Promise<ApiPaged<ReturnRequest>> {
  return respond(() => {
    let rows = query.user_id ? returnsForUser(query.user_id)
      : query.merchant_id ? returnsForMerchant(query.merchant_id)
      : returns.slice();
    if (query.status) rows = rows.filter((r) => r.status === query.status);
    rows = search(rows, query.q, ["rma_number", "order_number", "customer_name", "merchant_name"]);
    return paginate(rows, query);
  }, DELAY.normal);
}

export const getReturn = (id: string): Promise<ReturnRequest> =>
  respond(() => {
    const r = returnById(id);
    if (!r) throw new MockApiError(404, "Return request not found");
    return r;
  }, DELAY.fast);

export const getReturnsForOrder = (orderId: string): Promise<ReturnRequest[]> =>
  respond(() => returnForOrder(orderId), DELAY.fast);

/** Reasons that must carry photo or video evidence. */
const NEEDS_EVIDENCE: ReturnReason[] = [
  "damaged", "wrong_item", "not_as_described", "missing_parts", "quality_issue",
];

/**
 * POST /returns — raised from an order, or by the courier when the
 * customer refuses the parcel at the door.
 */
export function createReturn(input: {
  fulfilmentId: string;
  itemIds: string[];
  reason: ReturnReason;
  comment: string;
  evidence: MediaAsset[];
  rejectedAtDoor?: boolean;
}): Promise<ReturnRequest> {
  return respond(() => {
    const f = fulfilmentById(input.fulfilmentId);
    if (!f) throw new MockApiError(404, "Package not found");
    const order = orderById(f.order_id);
    if (!order) throw new MockApiError(404, "Order not found");

    if (!input.rejectedAtDoor && f.status !== "delivered") {
      throw new MockApiError(409, "You can only return a package once it has been delivered");
    }
    if (returnForOrder(order.id).some((r) => r.fulfilment_id === f.id && r.status !== "rejected")) {
      throw new MockApiError(409, "A return is already open for this package");
    }
    if (!input.itemIds.length) throw new MockApiError(422, "Select at least one item to return");
    if (input.comment.trim().length < 15) {
      throw new MockApiError(422, "Tell us what went wrong in at least 15 characters", {
        comment: ["Please describe the issue in a little more detail"],
      });
    }
    if (NEEDS_EVIDENCE.includes(input.reason) && input.evidence.length === 0) {
      throw new MockApiError(422, "A photo or video is required for this reason", {
        evidence: ["Add at least one photo showing the problem"],
      });
    }

    const items: ReturnItem[] = f.items
      .filter((it) => input.itemIds.includes(it.id))
      .map((it) => ({
        order_item_id: it.id,
        product_id: it.product_id,
        name: it.name_snapshot,
        sku: it.sku_snapshot,
        image_hue: it.image_hue,
        quantity: it.quantity,
        unit_price: it.unit_price_snapshot,
      }));

    const now = new Date().toISOString();
    const request: ReturnRequest = {
      id: nextId("rma"),
      rma_number: `RMA-${8100 + returns.length + 1}`,
      order_id: order.id,
      order_number: order.order_number,
      fulfilment_id: f.id,
      user_id: order.user_id,
      customer_name: order.customer_name,
      merchant_id: f.merchant_id,
      merchant_name: f.merchant_name,
      rejected_at_door: !!input.rejectedAtDoor,
      reason: input.reason,
      comment: input.comment.trim(),
      evidence: input.evidence,
      items,
      refund_amount: items.reduce((s, it) => s + it.unit_price * it.quantity, 0),
      status: "requested",
      resolution: "refund",
      merchant_response: null,
      timeline: [{
        at: now,
        status: "requested",
        note: input.rejectedAtDoor
          ? "Parcel refused at the door — return opened automatically"
          : "Return requested by the customer",
        actor: order.customer_name,
        actor_role: "customer",
      }],
      created_at: now,
      resolved_at: null,
    };

    returns.unshift(request);
    return request;
  }, DELAY.slow);
}

/** Valid state transitions — the backend must enforce exactly this graph. */
const ALLOWED: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ["approved", "rejected"],
  approved: ["pickup_scheduled"],
  rejected: [],
  pickup_scheduled: ["picked_up"],
  picked_up: ["refunded"],
  refunded: [],
};

export const allowedReturnTransitions = (from: ReturnStatus) => ALLOWED[from];

/** PATCH /returns/:id — merchant approves/declines, then the flow advances. */
export function updateReturnStatus(input: {
  returnId: string;
  status: ReturnStatus;
  response?: string;
  actor: string;
  actorRole: "merchant" | "admin" | "agent";
}): Promise<ReturnRequest> {
  return respond(() => {
    const r = returnById(input.returnId);
    if (!r) throw new MockApiError(404, "Return not found");
    if (!ALLOWED[r.status].includes(input.status)) {
      throw new MockApiError(409,
        `Cannot move a return from "${r.status.replace(/_/g, " ")}" to "${input.status.replace(/_/g, " ")}"`);
    }
    if (input.status === "rejected" && !input.response?.trim()) {
      throw new MockApiError(422, "Explain to the customer why the return was declined");
    }

    const now = new Date().toISOString();
    r.status = input.status;
    if (input.response?.trim()) r.merchant_response = input.response.trim();
    if (input.status === "rejected") r.resolution = "none";

    r.timeline.push({
      at: now,
      status: input.status,
      note: input.response?.trim() || {
        approved: "Merchant approved the return",
        rejected: "Merchant declined the return",
        pickup_scheduled: "Reverse pickup scheduled with the courier",
        picked_up: "Courier collected the item",
        refunded: "Refund issued to the original payment method",
        requested: "Return requested",
      }[input.status],
      actor: input.actor,
      actor_role: input.actorRole,
    });

    if (input.status === "refunded" || input.status === "rejected") r.resolved_at = now;

    // A refunded return puts the stock back, via the ledger.
    if (input.status === "refunded") {
      for (const it of r.items) {
        const p = productById(it.product_id);
        if (p) p.stock += it.quantity;
      }
    }

    return r;
  }, DELAY.normal);
}
