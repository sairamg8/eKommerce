import type { Message } from "../../mock/types";
import { cn } from "../../lib/cn";
import { Icon } from "../ui/Icon";
import s from "./Chat.module.css";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const mmss = (sec: number) =>
  `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, "0")}s`;

const kb = (b: number) =>
  b > 1_000_000 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

export function MessageBubble({ message, isMine, onOpenMedia }: {
  message: Message;
  isMine: boolean;
  onOpenMedia?: (id: string) => void;
}) {
  if (message.kind === "system") {
    return <div className={s.system}>{message.body}</div>;
  }

  if (message.kind === "call" && message.call) {
    const missed = message.call.outcome !== "completed";
    return (
      <div className={s.callCard}>
        <span className={cn(s.callIco, missed && s.callMissed)}>
          <Icon name={message.call.media === "video" ? "camera" : "phone"} size={13} />
        </span>
        <span>
          <strong>{message.call.media === "video" ? "Video" : "Voice"} call</strong>
          {missed ? ` · ${message.call.outcome}` : ` · ${mmss(message.call.duration_s)}`}
        </span>
        <span style={{ opacity: 0.6 }}>{time(message.sent_at)}</span>
      </div>
    );
  }

  const images = message.attachments.filter((a) => a.kind !== "document");
  const docs = message.attachments.filter((a) => a.kind === "document");

  return (
    <div className={cn(s.bubbleRow, isMine ? s.mine : s.theirs)}>
      <div className={s.bubble}>
        {!isMine && <div className={s.sender}>{message.sender_name}</div>}

        {images.length > 0 && (
          <div className={s.attGrid}>
            {images.map((a) => (
              <button key={a.id} className={s.att} onClick={() => onOpenMedia?.(a.id)}
                      aria-label={`Open ${a.kind}`}
                      style={{
                        background: `linear-gradient(145deg, hsl(${a.hue} 60% 92%), hsl(${(a.hue + 40) % 360} 55% 84%))`,
                        color: `hsl(${a.hue} 45% 32%)`,
                      }}>
                <Icon name={a.kind === "video" ? "camera" : "image"} size={17} />
                <span className={s.attName}>{a.kind === "video" ? "Video" : "Photo"}</span>
              </button>
            ))}
          </div>
        )}

        {docs.map((a) => (
          <div key={a.id} className={s.docAtt}>
            <Icon name="file" size={16} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 600 }} className="truncate">
                {a.filename}
              </span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                {kb(a.size_bytes)}{a.pages ? ` · ${a.pages} pages` : ""}
              </span>
            </span>
            <Icon name="download" size={14} />
          </div>
        ))}

        {message.body && <div>{message.body}</div>}

        <div className={s.meta}>
          {time(message.sent_at)}
          {isMine && (
            <span className={cn(s.ticks, message.status === "read" && s.read)}>
              <Icon name="check" size={11} strokeWidth={3} />
              {message.status !== "sent" && (
                <Icon name="check" size={11} strokeWidth={3} style={{ marginLeft: -6 }} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
