import { useEffect, useRef, useState } from "react";
import type {
  CallInfo, Conversation, ConversationKind, MediaAsset, Message, Participant,
} from "../../mock/types";
import { cn } from "../../lib/cn";
import { relative } from "../../lib/format";
import * as messagesApi from "../../mock/api/messages";
import { EmptyState } from "../ui/EmptyState";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";
import { Thumb } from "../ui/Thumb";
import { makeAsset } from "../media/MediaUploader";
import { useToast } from "../../store/ToastContext";
import { MessageBubble } from "./MessageBubble";
import { CallOverlay } from "./CallOverlay";
import s from "./Chat.module.css";

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export function ChatPage({ kinds, selfId, selfName, selfRole, selfHue, emptyHint }: {
  kinds: ConversationKind[];
  selfId: string;
  selfName: string;
  selfRole: Participant["role"];
  selfHue: number;
  emptyHint?: string;
}) {
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [list, setList] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<{ conversation: Conversation; messages: Message[] } | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<MediaAsset[]>([]);
  const [sending, setSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [call, setCall] = useState<{ peer: Participant; media: "audio" | "video" } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const self: Participant = {
    id: selfId, name: selfName, role: selfRole, hue: selfHue,
    online: true, last_seen: null, typing: false,
  };

  useEffect(() => {
    void messagesApi.listConversations(kinds, q).then((rows) => {
      setList(rows);
      setActiveId((cur) => cur ?? rows[0]?.id ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, JSON.stringify(kinds)]);

  useEffect(() => {
    if (!activeId) { setThread(null); return; }
    void messagesApi.getThread(activeId).then(setThread);
  }, [activeId]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread?.messages.length, peerTyping]);

  const peer = thread?.conversation.participants.find((x) => x.id !== selfId);

  const refreshList = () => {
    void messagesApi.listConversations(kinds, q).then(setList);
  };

  const send = async () => {
    if (!thread || (!draft.trim() && !pending.length)) return;
    setSending(true);
    try {
      const message = await messagesApi.sendMessage({
        conversationId: thread.conversation.id,
        sender: self,
        body: draft,
        attachments: pending,
      });
      setThread((t) => (t ? { ...t, messages: [...t.messages, message] } : t));
      setDraft("");
      setPending([]);
      refreshList();

      if (peer?.online) {
        setPeerTyping(true);
        const reply = await messagesApi.autoReply(thread.conversation.id, selfId);
        setPeerTyping(false);
        if (reply) {
          setThread((t) => (t ? { ...t, messages: [...t.messages, reply] } : t));
          refreshList();
        }
      }
    } catch (e) {
      push(e instanceof Error ? e.message : "Could not send", "error");
    } finally {
      setSending(false);
    }
  };

  const attach = (files: File[]) => {
    setPending((cur) => [...cur, ...files.slice(0, 6 - cur.length).map((f) => makeAsset(f, selfName))]);
  };

  const endCall = async (info: CallInfo) => {
    setCall(null);
    if (!thread) return;
    const message = await messagesApi.logCall({
      conversationId: thread.conversation.id, sender: self, call: info,
    });
    setThread((t) => (t ? { ...t, messages: [...t.messages, message] } : t));
    refreshList();
  };

  let lastDay = "";

  return (
    <>
      <div className={s.shell}>
        <div className={s.list}>
          <div className={s.listHead}>
            <Input value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder="Search conversations…"
                   icon={<Icon name="search" size={15} />} aria-label="Search conversations" />
          </div>
          <div className={s.listScroll}>
            {list === null && Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ padding: 12 }}><Skeleton h={44} /></div>
            ))}

            {list?.length === 0 && (
              <EmptyState icon={<Icon name="bell" size={18} />} title="No conversations"
                          description={emptyHint} />
            )}

            {list?.map((c) => {
              const other = c.participants.find((x) => x.id !== selfId) ?? c.participants[0]!;
              return (
                <button key={c.id} className={cn(s.row, activeId === c.id && s.rowOn)}
                        onClick={() => setActiveId(c.id)}>
                  <span className={s.avatar}>
                    <Thumb hue={other.hue} size={40} radius={999} label={other.name} />
                    <span className={cn(s.presence, other.online && s.online)} />
                  </span>
                  <span className={s.rowBody}>
                    <span className={s.rowTop}>
                      <span className={s.rowName}>{other.name}</span>
                      <span className={s.rowTime}>{relative(c.last_message_at)}</span>
                    </span>
                    <span className={s.rowSubject}>{c.subject}</span>
                    <span className={s.rowPreview}>{c.last_message_preview}</span>
                  </span>
                  {c.unread_count > 0 && <span className={s.badge}>{c.unread_count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={s.thread}>
          {!thread && (
            <div className={s.empty}>
              <EmptyState icon={<Icon name="bell" size={20} />}
                          title="Pick a conversation"
                          description="Choose a thread on the left to read and reply." />
            </div>
          )}

          {thread && peer && (
            <>
              <div className={s.threadHead}>
                <span className={s.avatar}>
                  <Thumb hue={peer.hue} size={38} radius={999} label={peer.name} />
                  <span className={cn(s.presence, peer.online && s.online)} />
                </span>
                <div>
                  <div className={s.tName}>{peer.name}</div>
                  <div className={cn(s.tStatus, peer.online && s.tOnline)}>
                    {peerTyping ? "typing…"
                      : peer.online ? "online"
                      : `last seen ${peer.last_seen ? relative(peer.last_seen) : "recently"}`}
                  </div>
                </div>
                <div className={s.tActions}>
                  <button className={s.iconBtn} aria-label="Voice call"
                          onClick={() => setCall({ peer, media: "audio" })}>
                    <Icon name="phone" size={17} />
                  </button>
                  <button className={s.iconBtn} aria-label="Video call"
                          onClick={() => setCall({ peer, media: "video" })}>
                    <Icon name="camera" size={17} />
                  </button>
                  <button className={s.iconBtn} aria-label="More options">
                    <Icon name="list" size={17} />
                  </button>
                </div>
              </div>

              {thread.conversation.order_number && (
                <div className={s.context}>
                  <Icon name="package" size={13} />
                  About order <strong>{thread.conversation.order_number}</strong> · {thread.conversation.subject}
                </div>
              )}

              <div className={s.msgs} ref={scroller}>
                {thread.messages.map((msg) => {
                  const day = dayLabel(msg.sent_at);
                  const showDay = day !== lastDay;
                  lastDay = day;
                  return (
                    <div key={msg.id} style={{ display: "contents" }}>
                      {showDay && <div className={s.day}>{day}</div>}
                      <MessageBubble message={msg} isMine={msg.sender_id === selfId} />
                    </div>
                  );
                })}
                {peerTyping && (
                  <div className={cn(s.bubbleRow, s.theirs)}>
                    <div className={s.bubble}>
                      <div className={s.typing}>
                        <span className={s.dot} /><span className={s.dot} /><span className={s.dot} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={s.composer}>
                {pending.length > 0 && (
                  <div className={s.pending}>
                    {pending.map((a) => (
                      <div key={a.id} className={s.pendingItem}
                           style={{
                             background: `linear-gradient(145deg, hsl(${a.hue} 60% 92%), hsl(${(a.hue + 40) % 360} 55% 84%))`,
                             color: `hsl(${a.hue} 45% 32%)`,
                           }}>
                        <Icon name={a.kind === "video" ? "camera" : a.kind === "document" ? "file" : "image"} size={16} />
                        <button className={s.pendingRm} aria-label="Remove attachment"
                                onClick={() => setPending((p) => p.filter((x) => x.id !== a.id))}>
                          <Icon name="x" size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className={s.inputRow}>
                  <button className={s.iconBtn} aria-label="Attach a file"
                          onClick={() => fileInput.current?.click()}>
                    <Icon name="upload" size={18} />
                  </button>
                  <input ref={fileInput} type="file" multiple hidden
                         accept="image/*,video/*,application/pdf"
                         onChange={(e) => { attach([...(e.target.files ?? [])]); e.target.value = ""; }} />
                  <textarea
                    className={s.textarea}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
                    }}
                    placeholder="Write a message…  (Enter to send, Shift+Enter for a new line)"
                    rows={1}
                    aria-label="Message"
                  />
                  <button className={s.send} disabled={sending || (!draft.trim() && !pending.length)}
                          onClick={() => void send()} aria-label="Send message">
                    <Icon name="arrowRight" size={17} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {call && <CallOverlay peer={call.peer} media={call.media} onEnd={(info) => void endCall(info)} />}
    </>
  );
}
