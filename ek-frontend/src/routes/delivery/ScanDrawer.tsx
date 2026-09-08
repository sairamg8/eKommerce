import { useEffect, useState } from "react";
import type { Attachment, AttachmentKind, DeliveryStatus, DeliveryTask, Shipment } from "../../mock/types";
import { cn } from "../../lib/cn";
import { money } from "../../lib/format";
import * as deliveryApi from "../../mock/api/delivery";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { Textarea } from "../../components/ui/Input";
import { LoadingBlock } from "../../components/ui/Spinner";
import { TrackingTimeline } from "../../components/order/TrackingTimeline";
import { useToast } from "../../store/ToastContext";
import { CURRENT_AGENT } from "../../components/layout/DeliveryLayout";
import s from "./ScanDrawer.module.css";

const STATUS_COPY: Record<DeliveryStatus, { icon: string; desc: string }> = {
  awaiting_pickup: { icon: "clock", desc: "Waiting at the merchant warehouse" },
  picked_up: { icon: "package", desc: "Collected from the merchant" },
  in_transit: { icon: "truck", desc: "Moving to the destination hub" },
  at_hub: { icon: "boxOpen", desc: "Sorted at the destination hub" },
  out_for_delivery: { icon: "mapPin", desc: "On the vehicle, heading to the customer" },
  delivered: { icon: "check", desc: "Handed over — needs a proof photo" },
  failed_attempt: { icon: "alert", desc: "Nobody available, will re-attempt" },
  returned: { icon: "refresh", desc: "Sent back to the merchant" },
};

const KINDS: { kind: AttachmentKind; label: string; icon: string }[] = [
  { kind: "pod_photo", label: "Proof photo", icon: "camera" },
  { kind: "signature", label: "Signature", icon: "edit" },
  { kind: "id_proof", label: "ID proof", icon: "shield" },
  { kind: "damage_photo", label: "Damage photo", icon: "alert" },
];

const kb = (b: number) => (b > 1_000_000 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export function ScanDrawer({ task, onClose, onDone }: {
  task: DeliveryTask | null; onClose: () => void; onDone: () => void;
}) {
  const agent = CURRENT_AGENT;
  const { push } = useToast();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<DeliveryStatus | null>(null);
  const [note, setNote] = useState("");
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!task) { setShipment(null); return; }
    setLoading(true);
    setNext(null); setNote(""); setAtts([]);
    deliveryApi.getShipment(task.shipment_id)
      .then(setShipment)
      .catch(() => push("Could not load shipment", "error"))
      .finally(() => setLoading(false));
  }, [task, push]);

  const transitions = shipment ? deliveryApi.allowedTransitions(shipment.status) : [];
  const needsPod = next === "delivered";
  const hasPod = atts.some((a) => a.kind === "pod_photo");

  const attach = (kind: AttachmentKind) => {
    setAtts((list) => [...list, deliveryApi.makeAttachment(kind, agent.name)]);
  };

  const submit = async () => {
    if (!shipment || !next) return;
    setBusy(true);
    try {
      await deliveryApi.addTrackingEvent({
        shipmentId: shipment.id, status: next, note,
        attachments: atts, actor: agent.name,
      });
      push(`${shipment.awb} marked ${next.replace(/_/g, " ")}`, "success");
      onDone();
    } catch (e) {
      push(e instanceof Error ? e.message : "Scan failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const finished = shipment && deliveryApi.allowedTransitions(shipment.status).length === 0;

  return (
    <Modal
      open={!!task}
      onClose={onClose}
      wide
      title={task ? `Shipment ${task.awb}` : ""}
      subtitle={task ? `${task.contact_name} · ${task.address}` : ""}
      footer={
        finished || !transitions.length
          ? <Button variant="secondary" onClick={onClose}>Close</Button>
          : <>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button disabled={!next || busy || (needsPod && !hasPod)} onClick={() => void submit()}>
                {busy ? "Submitting…" : "Submit scan"}
              </Button>
            </>
      }
    >
      {loading && <LoadingBlock label="Loading shipment…" />}

      {!loading && shipment && (
        <>
          <div className={s.summary}>
            <div className={s.sf}>
              <span className={s.sk}>Current status</span>
              <span className={s.sv} style={{ textTransform: "capitalize" }}>
                {shipment.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className={s.sf}>
              <span className={s.sk}>Merchant</span>
              <span className={s.sv}>{shipment.merchant_name}</span>
            </div>
            <div className={s.sf}>
              <span className={s.sk}>Weight</span>
              <span className={s.sv}>{(shipment.weight_g / 1000).toFixed(2)} kg</span>
            </div>
            <div className={s.sf}>
              <span className={s.sk}>Attempts</span>
              <span className={s.sv}>{shipment.attempts}</span>
            </div>
            {shipment.is_cod && (
              <div className={s.sf}>
                <span className={s.sk}>Collect COD</span>
                <span className={s.sv} style={{ color: "var(--warning-fg)" }}>{money(shipment.cod_amount)}</span>
              </div>
            )}
          </div>

          {transitions.length > 0 ? (
            <>
              <div className={s.sh}>Record next status</div>
              <div className={s.opts}>
                {transitions.map((t) => (
                  <button key={t} className={cn(s.opt, next === t && s.optOn)} onClick={() => setNext(t)}>
                    <span className={s.oico}>
                      <Icon name={STATUS_COPY[t].icon} size={16} />
                    </span>
                    <span>
                      <span className={s.ot} style={{ display: "block" }}>{t.replace(/_/g, " ")}</span>
                      <span className={s.od}>{STATUS_COPY[t].desc}</span>
                    </span>
                  </button>
                ))}
              </div>

              {next && (
                <>
                  <div className={s.section}>
                    <div className={s.sh}>
                      Attachments
                      {needsPod && <span className={s.req}>Proof photo required</span>}
                    </div>
                    <div className={s.attGrid}>
                      {atts.map((a) => (
                        <div key={a.id} className={s.att}
                             style={{
                               background: `linear-gradient(145deg, hsl(${a.hue} 60% 92%), hsl(${(a.hue + 40) % 360} 55% 84%))`,
                               color: `hsl(${a.hue} 45% 30%)`,
                             }}>
                          <Icon name={a.kind === "signature" ? "edit" : a.kind === "id_proof" ? "shield" : "image"} size={20} />
                          <span className={s.attKind}>{a.kind.replace(/_/g, " ")}</span>
                          <span className={s.attSize}>{kb(a.size_bytes)}</span>
                          <button className={s.attRm} aria-label="Remove attachment"
                                  onClick={() => setAtts((l) => l.filter((x) => x.id !== a.id))}>
                            <Icon name="x" size={11} />
                          </button>
                        </div>
                      ))}
                      {KINDS.map((k) => (
                        <button key={k.kind} className={s.attAdd} onClick={() => attach(k.kind)}>
                          <Icon name={k.icon} size={18} />
                          {k.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={s.section}>
                    <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)}
                              rows={3}
                              placeholder={next === "failed_attempt"
                                ? "Why did the delivery fail?"
                                : "Anything the customer or merchant should know"} />
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={s.done}>
              <div className={s.sh}>This shipment is closed — no further scans allowed.</div>
            </div>
          )}

          <div className={s.section}>
            <div className={s.sh}>Scan history</div>
            <TrackingTimeline events={shipment.events} />
          </div>
        </>
      )}
    </Modal>
  );
}
