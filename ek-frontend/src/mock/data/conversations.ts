import type { Conversation, Message, Participant } from "../types";
import { daysAgo, makeRng } from "../core/rng";
import { customers, adminUser, users } from "./users";
import { merchants } from "./merchants";
import { orders } from "./orders";

const rng = makeRng(60123);

const SUPPORT_AGENTS = [
  { id: "sup_001", name: "Nisha Raman", hue: 190 },
  { id: "sup_002", name: "Vikas Menon", hue: 275 },
];

const p = (
  id: string, name: string, role: Participant["role"], hue: number, online: boolean,
): Participant => ({
  id, name, role, hue, online,
  last_seen: online ? null : daysAgo(0, rng.int(6, 20)),
  typing: false,
});

const CUSTOMER_MERCHANT_THREADS = [
  {
    subject: "Is this compatible with an iPhone?",
    turns: [
      ["customer", "Hi — does this pair with an iPhone 15, or is it Android only?"],
      ["merchant", "Hello! It pairs with any Bluetooth 5.0+ device, so iPhone 15 works perfectly. You also get the companion app on iOS."],
      ["customer", "Great, thanks. And is the warranty handled by you or the brand?"],
      ["merchant", "We handle it directly — two years, and we arrange pickup if anything goes wrong. Just message us here."],
    ],
  },
  {
    subject: "Order arriving later than promised",
    turns: [
      ["customer", "My order was supposed to arrive yesterday but tracking has not moved since Tuesday."],
      ["merchant", "Sorry about that. I can see it is stuck at the Bengaluru hub. I have raised it with the courier and asked for priority handling."],
      ["customer", "Appreciate it. Any idea when it will move?"],
      ["merchant", "They have committed to dispatch tonight, so it should reach you tomorrow. If it does not, message me and I will refund the shipping."],
    ],
  },
  {
    subject: "Bulk order for our office",
    turns: [
      ["customer", "We need 15 units for our office. Is there a bulk price?"],
      ["merchant", "Yes — for 10+ units we can do 12% off and consolidate it into one shipment. Shall I raise a quote?"],
      ["customer", "Please do. Invoice needs to be in the company name with GST."],
      ["merchant", "Noted. Send me the GSTIN and billing address and I will have the quote across today."],
    ],
  },
  {
    subject: "Missing accessory in the box",
    turns: [
      ["customer", "The carry case listed in the description was not in the box."],
      ["merchant", "That should not happen — apologies. I am dispatching a case today at no charge, no need to return anything."],
    ],
  },
];

const CUSTOMER_SUPPORT_THREADS = [
  {
    subject: "Refund not received",
    turns: [
      ["customer", "My return was picked up eight days ago but the refund has not shown up."],
      ["agent", "Thanks for flagging. I can see the merchant marked it received on the 22nd, and the refund was initiated the same day."],
      ["agent", "Bank refunds take 5–7 working days. I have shared the ARN with you by email — please check with your bank quoting that reference."],
      ["customer", "Got the email, thank you. I will check with them."],
    ],
  },
  {
    subject: "Cannot apply a coupon at checkout",
    turns: [
      ["customer", "FEST20 keeps saying invalid even though it is showing on the homepage."],
      ["agent", "That coupon needs a minimum order of ₹2,499 and your cart is at ₹2,180. Adding one more item will let it apply."],
    ],
  },
];

const MERCHANT_SUPPORT_THREADS = [
  {
    subject: "Payout delayed for last cycle",
    turns: [
      ["merchant", "Our settlement for last week is still showing pending. Everything was delivered on time."],
      ["admin", "Checked it — the cycle is held because two orders have open return windows. It releases automatically once those close on Friday."],
      ["merchant", "Understood. Can we shorten that window for repeat buyers?"],
      ["admin", "Not per merchant today, but it is on the roadmap. I have noted your account for the pilot."],
    ],
  },
  {
    subject: "Request to lower commission rate",
    turns: [
      ["merchant", "We have crossed ₹50L in gross sales. Can we revisit the 12% commission?"],
      ["admin", "Congratulations on the milestone. Volumes above ₹50L qualify for the 10% tier — I will apply it from the next cycle."],
    ],
  },
];

export const conversations: Conversation[] = [];
export const messages: Message[] = [];

let cId = 0;
let mId = 0;

function build(
  kind: Conversation["kind"],
  threads: { subject: string; turns: string[][] }[],
) {
  threads.forEach((thread, ti) => {
    cId += 1;
    const id = `cnv_${String(cId).padStart(3, "0")}`;
    // Always the demo customer and one of the first two merchants, so both
    // the customer inbox and the merchant console have real threads.
    const customer = customers[0]!;
    const merchant = merchants[kind === "merchant_support" ? 0 : ti % 2]!;
    const merchantUser = users.find((u) => u.id === merchant.owner_user_id)!;
    const agent = SUPPORT_AGENTS[ti % SUPPORT_AGENTS.length]!;
    const order = orders[ti * 3] ?? orders[0]!;

    const parts: Participant[] =
      kind === "customer_merchant"
        ? [
            p(customer.id, `${customer.first_name} ${customer.last_name}`, "customer", customer.avatar_hue, ti === 0),
            p(merchantUser.id, merchant.business_name, "merchant", merchant.logo_hue, ti % 2 === 0),
          ]
        : kind === "customer_support"
          ? [
              p(customer.id, `${customer.first_name} ${customer.last_name}`, "customer", customer.avatar_hue, true),
              p(agent.id, `${agent.name} · Support`, "agent", agent.hue, true),
            ]
          : [
              p(merchantUser.id, merchant.business_name, "merchant", merchant.logo_hue, true),
              p(adminUser.id, "Platform Support", "admin", 250, ti % 2 === 0),
            ];

    const baseDay = 6 - ti;
    let last = "";
    let lastAt = "";

    thread.turns.forEach((turn, i) => {
      const [roleRaw, body] = turn as [string, string];
      const role = roleRaw as Participant["role"];
      const sender = parts.find((x) => x.role === role) ?? parts[0]!;
      mId += 1;
      const at = daysAgo(Math.max(baseDay, 0), 9 + i * 2);
      messages.push({
        id: `msg_${String(mId).padStart(4, "0")}`,
        conversation_id: id,
        sender_id: sender.id,
        sender_name: sender.name,
        sender_role: sender.role,
        kind: "text",
        body,
        attachments: [],
        call: null,
        reply_to_id: null,
        status: i === thread.turns.length - 1 ? "delivered" : "read",
        sent_at: at,
      });
      last = body;
      lastAt = at;
    });

    // A call record on the first thread of each kind, so the log is visible.
    if (ti === 0) {
      mId += 1;
      const at = daysAgo(Math.max(baseDay, 0), 18);
      messages.push({
        id: `msg_${String(mId).padStart(4, "0")}`,
        conversation_id: id,
        sender_id: parts[0]!.id,
        sender_name: parts[0]!.name,
        sender_role: parts[0]!.role,
        kind: "call",
        body: "",
        attachments: [],
        call: {
          media: kind === "customer_merchant" ? "video" : "audio",
          duration_s: rng.int(45, 420),
          outcome: "completed",
          initiated_by: parts[0]!.name,
        },
        reply_to_id: null,
        status: "read",
        sent_at: at,
      });
      last = "Call ended";
      lastAt = at;
    }

    conversations.push({
      id,
      kind,
      subject: thread.subject,
      participants: parts,
      order_id: kind === "customer_merchant" ? order.id : null,
      order_number: kind === "customer_merchant" ? order.order_number : null,
      product_id: null,
      last_message_preview: last,
      last_message_at: lastAt,
      unread_count: ti === 0 ? 2 : ti === 1 ? 1 : 0,
      is_archived: false,
      created_at: daysAgo(baseDay + 1),
    });
  });
}

build("customer_merchant", CUSTOMER_MERCHANT_THREADS);
build("customer_support", CUSTOMER_SUPPORT_THREADS);
build("merchant_support", MERCHANT_SUPPORT_THREADS);

conversations.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));

export const conversationById = (id: string) => conversations.find((c) => c.id === id);
export const messagesFor = (conversationId: string) =>
  messages
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => a.sent_at.localeCompare(b.sent_at));
export const conversationsOfKind = (...kinds: Conversation["kind"][]) =>
  conversations.filter((c) => kinds.includes(c.kind));
