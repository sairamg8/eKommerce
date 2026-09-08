import type { ApiPaged, ListQuery, MediaAsset, SupportTicket, TicketMessage, TicketStatus } from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import { paginate, search } from "../core/paginate";
import { tickets, ticketById, nextTicketNumber, nextId } from "../db";

export type TicketQuery = ListQuery & {
  status?: TicketStatus;
  role?: "customer" | "merchant";
  email?: string;
};

/** GET /support/tickets */
export function listTickets(query: TicketQuery = {}): Promise<ApiPaged<SupportTicket>> {
  return respond(() => {
    let rows = tickets.slice();
    if (query.status) rows = rows.filter((t) => t.status === query.status);
    if (query.role) rows = rows.filter((t) => t.requester_role === query.role);
    if (query.email) rows = rows.filter((t) => t.requester_email === query.email);
    rows = search(rows, query.q, ["subject", "ticket_number", "requester_name", "requester_email"]);
    return paginate(rows, query);
  }, DELAY.normal);
}

export const getTicket = (id: string): Promise<SupportTicket> =>
  respond(() => {
    const t = ticketById(id);
    if (!t) throw new MockApiError(404, "Ticket not found");
    return t;
  }, DELAY.fast);

/** POST /support/tickets — what the email contact form submits to. */
export function createTicket(input: {
  subject: string;
  category: SupportTicket["category"];
  body: string;
  name: string;
  email: string;
  role: "customer" | "merchant";
  orderNumber?: string | null;
  attachments?: MediaAsset[];
}): Promise<SupportTicket> {
  return respond(() => {
    const errors: Record<string, string[]> = {};
    if (input.subject.trim().length < 5) errors.subject = ["Give the request a clear subject"];
    if (!/^\S+@\S+\.\S+$/.test(input.email)) errors.email = ["Enter a valid email address"];
    if (input.body.trim().length < 20) errors.body = ["Describe the issue in at least 20 characters"];
    if (Object.keys(errors).length) throw new MockApiError(422, "Please fix the errors below", errors);

    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id: nextId("tkt"),
      ticket_number: nextTicketNumber(),
      subject: input.subject.trim(),
      category: input.category,
      priority: input.category === "payment" ? "high" : "normal",
      status: "open",
      requester_name: input.name.trim(),
      requester_email: input.email.trim().toLowerCase(),
      requester_role: input.role,
      assigned_to: null,
      order_number: input.orderNumber?.trim() || null,
      messages: [{
        id: nextId("tkm"),
        from_name: input.name.trim(),
        from_email: input.email.trim().toLowerCase(),
        is_staff: false,
        body: input.body.trim(),
        attachments: input.attachments ?? [],
        sent_at: now,
      }],
      sla_minutes: input.category === "payment" ? 240 : 1440,
      first_response_at: null,
      created_at: now,
      updated_at: now,
    };
    tickets.unshift(ticket);
    return ticket;
  }, DELAY.slow);
}

/** POST /support/tickets/:id/replies */
export function replyToTicket(input: {
  ticketId: string;
  body: string;
  fromName: string;
  fromEmail: string;
  isStaff: boolean;
  attachments?: MediaAsset[];
}): Promise<SupportTicket> {
  return respond(() => {
    const ticket = ticketById(input.ticketId);
    if (!ticket) throw new MockApiError(404, "Ticket not found");
    if (ticket.status === "closed") throw new MockApiError(409, "This ticket is closed — open a new one");
    if (input.body.trim().length < 2) throw new MockApiError(422, "Write a reply first");

    const now = new Date().toISOString();
    const message: TicketMessage = {
      id: nextId("tkm"),
      from_name: input.fromName,
      from_email: input.fromEmail,
      is_staff: input.isStaff,
      body: input.body.trim(),
      attachments: input.attachments ?? [],
      sent_at: now,
    };
    ticket.messages.push(message);
    ticket.updated_at = now;
    if (input.isStaff) {
      ticket.first_response_at ??= now;
      ticket.status = "pending";
      ticket.assigned_to ??= input.fromName;
    } else if (ticket.status === "resolved") {
      ticket.status = "open";
    }
    return ticket;
  }, DELAY.normal);
}

/** PATCH /support/tickets/:id */
export function setTicketStatus(id: string, status: TicketStatus): Promise<SupportTicket> {
  return respond(() => {
    const ticket = ticketById(id);
    if (!ticket) throw new MockApiError(404, "Ticket not found");
    ticket.status = status;
    ticket.updated_at = new Date().toISOString();
    return ticket;
  }, DELAY.fast);
}
