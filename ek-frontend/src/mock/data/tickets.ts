import type { SupportTicket, TicketMessage } from "../types";
import { daysAgo, makeRng } from "../core/rng";
import { customers } from "./users";
import { merchants } from "./merchants";
import { orders } from "./orders";

const rng = makeRng(41200);

const STAFF = ["Nisha Raman", "Vikas Menon", "Priya Kulkarni"];

type Seed = {
  subject: string;
  category: SupportTicket["category"];
  priority: SupportTicket["priority"];
  status: SupportTicket["status"];
  role: "customer" | "merchant";
  turns: { staff: boolean; body: string }[];
};

const SEED: Seed[] = [
  {
    subject: "Charged twice for the same order",
    category: "payment", priority: "urgent", status: "open", role: "customer",
    turns: [
      { staff: false, body: "My card was debited twice for order EK-26043 — ₹18,999 each time. Only one order shows in my account. Please refund the duplicate." },
      { staff: true, body: "Thank you for writing in. I can confirm a duplicate authorisation from the gateway. The second charge was never captured and will drop off automatically within 5 working days. I have also raised it with the gateway to release it sooner." },
    ],
  },
  {
    subject: "Package delivered to the wrong address",
    category: "delivery", priority: "high", status: "pending", role: "customer",
    turns: [
      { staff: false, body: "Tracking says delivered but nothing arrived. The POD photo shows a door that is not mine." },
      { staff: true, body: "I am sorry about this. I have opened an investigation with the courier and attached the POD image for review. They have 48 hours to respond, and if it is not located we will refund in full or reship — your choice." },
      { staff: false, body: "Please reship if possible, I still need the item." },
    ],
  },
  {
    subject: "How do I return a damaged item?",
    category: "return", priority: "normal", status: "resolved", role: "customer",
    turns: [
      { staff: false, body: "The kettle arrived with a cracked base. What is the process to return it?" },
      { staff: true, body: "Go to My Orders, open the order and choose Return or reject. Pick 'Arrived damaged', add a photo of the crack, and we will schedule a free pickup within 48 hours. Your refund is issued once the merchant confirms receipt." },
      { staff: false, body: "Done, pickup is scheduled. Thank you." },
    ],
  },
  {
    subject: "Cannot log in after changing my email",
    category: "account", priority: "normal", status: "open", role: "customer",
    turns: [
      { staff: false, body: "I updated my email in profile settings and now neither the old nor the new address lets me log in." },
    ],
  },
  {
    subject: "Bulk product upload keeps failing",
    category: "merchant", priority: "high", status: "open", role: "merchant",
    turns: [
      { staff: false, body: "Our CSV upload of 240 SKUs fails at around row 80 with a generic error. The file validates fine locally." },
      { staff: true, body: "Row 81 has a price field formatted with a comma separator, which our importer rejects. Strip thousands separators and re-upload — I have attached the corrected template." },
    ],
  },
  {
    subject: "Request GST invoice for last settlement",
    category: "payment", priority: "low", status: "closed", role: "merchant",
    turns: [
      { staff: false, body: "We need a GST invoice for the commission charged in the last payout cycle for our filing." },
      { staff: true, body: "Attached the tax invoice for the cycle. These are also downloadable any time from Payouts, under each settled row." },
    ],
  },
  {
    subject: "Order stuck in 'paid' for four days",
    category: "order", priority: "high", status: "pending", role: "customer",
    turns: [
      { staff: false, body: "Order EK-26102 has said 'paid' since Monday. The merchant has not packed it." },
      { staff: true, body: "The merchant has breached their 24-hour fulfilment SLA. I have escalated to their account manager. If it is not packed by tomorrow you can cancel for a full refund at no penalty." },
    ],
  },
];

export const tickets: SupportTicket[] = SEED.map((seed, i) => {
  const isMerchant = seed.role === "merchant";
  const customer = customers[i % customers.length]!;
  const merchant = merchants[i % 6]!;
  const staff = STAFF[i % STAFF.length]!;
  const day = 12 - i;

  const messages: TicketMessage[] = seed.turns.map((t, k) => ({
    id: `tkm_${i + 1}_${k + 1}`,
    from_name: t.staff ? staff : isMerchant ? merchant.owner_name : `${customer.first_name} ${customer.last_name}`,
    from_email: t.staff ? "support@ekommerce.in" : isMerchant ? merchant.email : customer.email,
    is_staff: t.staff,
    body: t.body,
    attachments: [],
    sent_at: daysAgo(Math.max(day - k, 0), 10 + k * 3),
  }));

  const firstStaff = messages.find((m) => m.is_staff);

  return {
    id: `tkt_${String(i + 1).padStart(3, "0")}`,
    ticket_number: `SUP-${4200 + i}`,
    subject: seed.subject,
    category: seed.category,
    priority: seed.priority,
    status: seed.status,
    requester_name: isMerchant ? merchant.owner_name : `${customer.first_name} ${customer.last_name}`,
    requester_email: isMerchant ? merchant.email : customer.email,
    requester_role: isMerchant ? "merchant" : "customer",
    assigned_to: seed.status === "open" && !firstStaff ? null : staff,
    order_number: seed.category === "order" || seed.category === "delivery"
      ? orders[i * 5]?.order_number ?? null : null,
    messages,
    sla_minutes: seed.priority === "urgent" ? 60 : seed.priority === "high" ? 240 : 1440,
    first_response_at: firstStaff?.sent_at ?? null,
    created_at: daysAgo(day, 10),
    updated_at: messages[messages.length - 1]!.sent_at,
  };
});

tickets.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

export const ticketById = (id: string) => tickets.find((t) => t.id === id);
export const nextTicketNumber = () => `SUP-${4200 + tickets.length + rng.int(1, 9)}`;
