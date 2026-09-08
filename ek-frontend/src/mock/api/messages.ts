import type {
  CallInfo, Conversation, ConversationKind, MediaAsset, Message, Participant,
} from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import {
  conversations, messages, conversationById, messagesFor, conversationsOfKind, nextId,
} from "../db";

/** GET /conversations?kind=… — scoped to the signed-in participant. */
export function listConversations(kinds: ConversationKind[], q = ""): Promise<Conversation[]> {
  return respond(() => {
    const needle = q.trim().toLowerCase();
    return conversationsOfKind(...kinds)
      .filter((c) => !c.is_archived)
      .filter((c) => !needle
        || c.subject.toLowerCase().includes(needle)
        || c.participants.some((p) => p.name.toLowerCase().includes(needle))
        || c.last_message_preview.toLowerCase().includes(needle))
      .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
  }, DELAY.fast);
}

export function getThread(conversationId: string): Promise<{
  conversation: Conversation; messages: Message[];
}> {
  return respond(() => {
    const conversation = conversationById(conversationId);
    if (!conversation) throw new MockApiError(404, "Conversation not found");
    // Opening a thread clears its unread badge, as it would server-side.
    conversation.unread_count = 0;
    return { conversation, messages: messagesFor(conversationId) };
  }, DELAY.fast);
}

/** POST /conversations/:id/messages */
export function sendMessage(input: {
  conversationId: string;
  sender: Participant;
  body: string;
  attachments?: MediaAsset[];
  replyToId?: string | null;
}): Promise<Message> {
  return respond(() => {
    const conversation = conversationById(input.conversationId);
    if (!conversation) throw new MockApiError(404, "Conversation not found");
    if (!input.body.trim() && !(input.attachments ?? []).length) {
      throw new MockApiError(422, "Write something or attach a file");
    }

    const message: Message = {
      id: nextId("msg"),
      conversation_id: conversation.id,
      sender_id: input.sender.id,
      sender_name: input.sender.name,
      sender_role: input.sender.role,
      kind: "text",
      body: input.body.trim(),
      attachments: input.attachments ?? [],
      call: null,
      reply_to_id: input.replyToId ?? null,
      status: "sent",
      sent_at: new Date().toISOString(),
    };

    messages.push(message);
    conversation.last_message_preview =
      message.body || `${message.attachments.length} attachment(s)`;
    conversation.last_message_at = message.sent_at;

    // Delivery receipt lands shortly after, like a real transport would.
    setTimeout(() => { message.status = "delivered"; }, 700);

    return message;
  }, DELAY.fast);
}

/** Simulates the other side replying, so the thread feels alive. */
export function autoReply(conversationId: string, selfId: string): Promise<Message | null> {
  return respond(() => {
    const conversation = conversationById(conversationId);
    if (!conversation) return null;
    const other = conversation.participants.find((p) => p.id !== selfId);
    if (!other || !other.online) return null;

    const canned = conversation.kind === "customer_merchant"
      ? ["Thanks for the message — let me check and come back to you shortly.",
         "Got it. I will confirm this with our warehouse and update you today.",
         "Noted, thank you. I will sort this out for you."]
      : conversation.kind === "customer_support"
        ? ["Thanks for reaching out. Let me pull up your order and take a look.",
           "I have logged this and am checking with the team now.",
           "Understood — I will get back to you within the hour."]
        : ["Received. I will review this against your account and revert.",
           "Thanks for flagging — checking with the payments team now."];

    const reply: Message = {
      id: nextId("msg"),
      conversation_id: conversation.id,
      sender_id: other.id,
      sender_name: other.name,
      sender_role: other.role,
      kind: "text",
      body: canned[Math.floor(Math.random() * canned.length)]!,
      attachments: [],
      call: null,
      reply_to_id: null,
      status: "delivered",
      sent_at: new Date().toISOString(),
    };
    messages.push(reply);
    conversation.last_message_preview = reply.body;
    conversation.last_message_at = reply.sent_at;
    return reply;
  }, DELAY.slow);
}

/** POST /conversations/:id/calls — writes the call record to the thread. */
export function logCall(input: {
  conversationId: string;
  sender: Participant;
  call: CallInfo;
}): Promise<Message> {
  return respond(() => {
    const conversation = conversationById(input.conversationId);
    if (!conversation) throw new MockApiError(404, "Conversation not found");

    const message: Message = {
      id: nextId("msg"),
      conversation_id: conversation.id,
      sender_id: input.sender.id,
      sender_name: input.sender.name,
      sender_role: input.sender.role,
      kind: "call",
      body: "",
      attachments: [],
      call: input.call,
      reply_to_id: null,
      status: "delivered",
      sent_at: new Date().toISOString(),
    };
    messages.push(message);
    conversation.last_message_preview =
      `${input.call.media === "video" ? "Video" : "Voice"} call · ${input.call.outcome}`;
    conversation.last_message_at = message.sent_at;
    return message;
  }, DELAY.fast);
}

/** POST /conversations — start a new thread with a merchant or support. */
export function startConversation(input: {
  kind: ConversationKind;
  subject: string;
  participants: Participant[];
  orderId?: string | null;
  orderNumber?: string | null;
}): Promise<Conversation> {
  return respond(() => {
    if (!input.subject.trim()) throw new MockApiError(422, "Add a subject so it can be routed");
    const conversation: Conversation = {
      id: nextId("cnv"),
      kind: input.kind,
      subject: input.subject.trim(),
      participants: input.participants,
      order_id: input.orderId ?? null,
      order_number: input.orderNumber ?? null,
      product_id: null,
      last_message_preview: "Conversation started",
      last_message_at: new Date().toISOString(),
      unread_count: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    conversations.unshift(conversation);
    return conversation;
  }, DELAY.normal);
}
