import type { Attachment, TrackingEvent } from "../../mock/types";
import { cn } from "../../lib/cn";
import { dateTime } from "../../lib/format";
import { Icon } from "../ui/Icon";
import s from "./TrackingTimeline.module.css";

const NODE_ICON: Record<string, string> = {
  awaiting_pickup: "clock", picked_up: "package", in_transit: "truck",
  at_hub: "boxOpen", out_for_delivery: "truck", delivered: "check",
  failed_attempt: "alert", returned: "refresh",
};

const ATT_ICON: Record<Attachment["kind"], string> = {
  pod_photo: "camera", signature: "edit", invoice: "file",
  damage_photo: "alert", id_proof: "shield", label: "tag",
};

const kb = (b: number) => (b > 1_000_000 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export function TrackingTimeline({ events, onOpenAttachment }: {
  events: TrackingEvent[];
  onOpenAttachment?: (a: Attachment) => void;
}) {
  return (
    <div className={s.tl}>
      {events.map((e, i) => {
        const failed = e.status === "failed_attempt" || e.status === "returned";
        const current = i === 0;
        return (
          <div key={e.id} className={s.ev}>
            <div className={s.rail}>
              <span className={cn(s.node, failed ? s.fail : current ? s.current : s.done)}>
                <Icon name={NODE_ICON[e.status] ?? "info"} size={13} strokeWidth={2.4} />
              </span>
              <span className={s.stem} />
            </div>
            <div className={s.body}>
              <div className={s.head}>
                <span className={s.title}>{e.status.replace(/_/g, " ")}</span>
                <span className={s.when}>{dateTime(e.at)}</span>
              </div>
              <p className={s.desc}>{e.description}</p>
              <span className={s.where}>
                <Icon name="mapPin" size={11} /> {e.location} · {e.actor}
              </span>
              {e.attachments.length > 0 && (
                <div className={s.atts}>
                  {e.attachments.map((a) => (
                    <button key={a.id} className={s.att} onClick={() => onOpenAttachment?.(a)}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 6, display: "grid", placeItems: "center",
                        background: `hsl(${a.hue} 60% 92%)`, color: `hsl(${a.hue} 50% 35%)`,
                      }}>
                        <Icon name={ATT_ICON[a.kind]} size={13} />
                      </span>
                      <span style={{ display: "grid", textAlign: "left" }}>
                        <span className={s.attName}>{a.kind.replace(/_/g, " ")}</span>
                        <span className={s.attMeta}>{kb(a.size_bytes)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
