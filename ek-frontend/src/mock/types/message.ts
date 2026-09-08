import type { MediaAsset } from "./media";

export type ChatRole = "customer" | "merchant" | "admin" | "agent" | "system";

export type Participant = {
  id: string;
  name: string;
  role: ChatRole;
  hue: number;
  online: boolean;
  /** ISO timestamp; null while online. */
  last_seen: string | null;
  typing: boolean;
};

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export type CallOutcome = "completed" | "missed" | "declined";

export type CallInfo = {
  media: "audio" | "video";
  duration_s: number;
  outcome: CallOutcome;
  initiated_by: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: ChatRole;
  /** "system" renders as a centred notice; "call" renders a call record. */
  kind: "text" | "system" | "call";
  body: string;
  attachments: MediaAsset[];
  call: CallInfo | null;
  reply_to_id: string | null;
  status: MessageStatus;
  sent_at: string;
};

/**
 * Who may talk to whom:
 *  - customer_merchant : shopper ↔ seller, about an order or product
 *  - customer_support  : shopper ↔ platform support agent
 *  - merchant_support  : seller ↔ platform admin (sellers cannot DM shoppers cold)
 */
export type ConversationKind = "customer_merchant" | "customer_support" | "merchant_support";

export type Conversation = {
  id: string;
  kind: ConversationKind;
  subject: string;
  participants: Participant[];
  /** Set when the thread was opened from an order or a product. */
  order_id: string | null;
  order_number: string | null;
  product_id: string | null;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  is_archived: boolean;
  created_at: string;
};

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketMessage = {
  id: string;
  from_name: string;
  from_email: string;
  is_staff: boolean;
  body: string;
  attachments: MediaAsset[];
  sent_at: string;
};

/** The email side of support — a threaded inbox, not live chat. */
export type SupportTicket = {
  id: string;
  ticket_number: string;
  subject: string;
  category: "order" | "payment" | "delivery" | "return" | "account" | "merchant" | "other";
  priority: TicketPriority;
  status: TicketStatus;
  requester_name: string;
  requester_email: string;
  requester_role: ChatRole;
  assigned_to: string | null;
  order_number: string | null;
  messages: TicketMessage[];
  /** Minutes until the first staff reply is due. */
  sla_minutes: number;
  first_response_at: string | null;
  created_at: string;
  updated_at: string;
};
