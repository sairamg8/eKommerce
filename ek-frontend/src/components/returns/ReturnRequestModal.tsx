import { useState } from "react";
import type { Fulfilment, MediaAsset, ReturnReason, ReturnRequest } from "../../mock/types";
import { RETURN_REASONS } from "../../mock/types";
import { cn } from "../../lib/cn";
import { money } from "../../lib/format";
import * as returnsApi from "../../mock/api/returns";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Textarea } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Thumb } from "../ui/Thumb";
import { MediaUploader } from "../media/MediaUploader";
import { useToast } from "../../store/ToastContext";
import s from "./Returns.module.css";

export function ReturnRequestModal({ fulfilment, customerName, onClose, onCreated }: {
  fulfilment: Fulfilment | null;
  customerName: string;
  onClose: () => void;
  onCreated?: (r: ReturnRequest) => void;
}) {
  const { push } = useToast();
  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState<ReturnReason | "">("");
  const [comment, setComment] = useState("");
  const [evidence, setEvidence] = useState<MediaAsset[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const meta = RETURN_REASONS.find((r) => r.value === reason);
  const refund = (fulfilment?.items ?? [])
    .filter((it) => picked.includes(it.id))
    .reduce((sum, it) => sum + it.line_total, 0);

  const close = () => {
    setPicked([]); setReason(""); setComment(""); setEvidence([]); setErrors({});
    onClose();
  };

  const submit = async () => {
    if (!fulfilment) return;
    const errs: Record<string, string> = {};
    if (!picked.length) errs.items = "Choose at least one item";
    if (!reason) errs.reason = "Pick a reason";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const created = await returnsApi.createReturn({
        fulfilmentId: fulfilment.id,
        itemIds: picked,
        reason: reason as ReturnReason,
        comment,
        evidence,
      });
      push(`Return ${created.rma_number} raised — the merchant has been notified`, "success");
      onCreated?.(created);
      close();
    } catch (e) {
      const err = e as { errors?: Record<string, string[]>; message?: string };
      setErrors({
        comment: err.errors?.comment?.[0] ?? "",
        evidence: err.errors?.evidence?.[0] ?? "",
      });
      push(err.message ?? "Could not raise the return", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!fulfilment}
      onClose={close}
      wide
      title="Return or reject this delivery"
      subtitle={fulfilment ? `${fulfilment.merchant_name} · order ${fulfilment.order_number}` : ""}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? "Submitting…" : refund > 0 ? `Request refund of ${money(refund)}` : "Submit request"}
          </Button>
        </>
      }
    >
      {fulfilment && (
        <div className={s.form}>
          <div>
            <div className={s.label}>Which items? <span className={s.req}>*</span></div>
            <div className={s.items}>
              {fulfilment.items.map((it) => {
                const on = picked.includes(it.id);
                return (
                  <button key={it.id} className={cn(s.item, on && s.itemOn)}
                          onClick={() => setPicked((p) =>
                            on ? p.filter((x) => x !== it.id) : [...p, it.id])}>
                    <span className={cn(s.box, on && s.boxOn)}>
                      {on && <Icon name="check" size={11} strokeWidth={3.2} />}
                    </span>
                    <Thumb hue={it.image_hue} size={40} label={it.name_snapshot} />
                    <span className={s.itemBody}>
                      <span className={s.itemName}>{it.name_snapshot}</span>
                      <span className={s.itemMeta}>
                        <span className="mono">{it.sku_snapshot}</span> · qty {it.quantity}
                      </span>
                    </span>
                    <span className={cn(s.itemPrice, "tabular")}>{money(it.line_total)}</span>
                  </button>
                );
              })}
            </div>
            {errors.items && <div className={s.err}>{errors.items}</div>}
          </div>

          <div>
            <div className={s.label}>What went wrong? <span className={s.req}>*</span></div>
            <div className={s.reasons}>
              {RETURN_REASONS.map((r) => (
                <button key={r.value} className={cn(s.reason, reason === r.value && s.reasonOn)}
                        onClick={() => setReason(r.value)}>
                  <span className={s.radio} />
                  <span>
                    <span className={s.rLabel}>{r.label}</span>
                    {r.needsEvidence && <span className={s.rHint}>Photo required</span>}
                  </span>
                </button>
              ))}
            </div>
            {errors.reason && <div className={s.err}>{errors.reason}</div>}
          </div>

          <Textarea label="Tell us more" required rows={4} value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    error={errors.comment || undefined}
                    placeholder="Describe the problem — the merchant reads this before deciding."
                    hint={`${comment.length} characters — minimum 15`} />

          <MediaUploader
            label={meta?.needsEvidence ? "Photos or video of the problem (required)" : "Photos or video (optional)"}
            value={evidence} onChange={setEvidence}
            accept={["image", "video"]} max={5} uploadedBy={customerName} compact
            hint="Clear photos get returns approved faster." />
          {errors.evidence && <div className={s.err}>{errors.evidence}</div>}

          {refund > 0 && (
            <div className={s.summary}>
              <span>Estimated refund</span>
              <strong className="tabular">{money(refund)}</strong>
            </div>
          )}

          <div className={s.note}>
            Once the merchant approves, a courier collects the item free of charge. Your
            refund is issued to the original payment method after they confirm receipt.
          </div>
        </div>
      )}
    </Modal>
  );
}
