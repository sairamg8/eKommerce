import { useState } from "react";
import type { MediaAsset, Review } from "../../mock/types";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Input, Textarea } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { MediaUploader } from "../media/MediaUploader";
import { useToast } from "../../store/ToastContext";
import { customers, reviews as allReviews, productById } from "../../mock/db";
import s from "./ReviewComposer.module.css";

export type ReviewTarget = { productId: string; name: string };

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/**
 * Shared review composer. Used in place on the product page and from
 * the account "to review" list, so there is one code path and one
 * validation rule set.
 */
export function ReviewComposer({ target, onClose, onPublished }: {
  target: ReviewTarget | null;
  onClose: () => void;
  onPublished?: (review: Review) => void;
}) {
  const me = customers[0]!;
  const { push } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setRating(0); setHover(0); setTitle(""); setBody("");
    setMedia([]); setErrors({});
  };

  const close = () => { reset(); onClose(); };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!rating) errs.rating = "Pick a star rating";
    if (title.trim().length < 4) errs.title = "Give your review a short headline";
    if (body.trim().length < 20) errs.body = "Tell us a bit more — at least 20 characters";
    setErrors(errs);
    if (Object.keys(errs).length || !target) return;

    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));

    const review: Review = {
      id: `rvw_new_${allReviews.length + 1}`,
      product_id: target.productId,
      user_id: me.id,
      author_name: `${me.first_name} ${me.last_name[0]}.`,
      author_hue: me.avatar_hue,
      rating,
      title: title.trim(),
      body: body.trim(),
      verified_purchase: true,
      media,
      helpful_count: 0,
      created_at: new Date().toISOString(),
    };
    allReviews.unshift(review);

    // Keep the product's aggregate in step, the way a trigger would.
    const p = productById(target.productId);
    if (p) {
      const rows = allReviews.filter((r) => r.product_id === p.id);
      p.review_count = rows.length;
      p.avg_rating = Number((rows.reduce((t, r) => t + r.rating, 0) / rows.length).toFixed(2));
    }

    setBusy(false);
    push("Review published — thanks for the feedback", "success");
    onPublished?.(review);
    reset();
  };

  return (
    <Modal
      open={!!target}
      onClose={close}
      wide
      title="Write a review"
      subtitle={target?.name}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? "Publishing…" : "Publish review"}
          </Button>
        </>
      }
    >
      <div className={s.form}>
        <div>
          <div className={s.label}>Overall rating <span className={s.req}>*</span></div>
          <div className={s.starRow}>
            <div className={s.stars} onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button"
                        className={cn(s.star, i <= (hover || rating) && s.starOn)}
                        onMouseEnter={() => setHover(i)}
                        onClick={() => setRating(i)}
                        aria-label={`${i} star${i > 1 ? "s" : ""}`}>
                  <Icon name="star" size={30} fill={i <= (hover || rating)} strokeWidth={1.4} />
                </button>
              ))}
            </div>
            <span className={s.starLabel}>{LABELS[hover || rating] ?? ""}</span>
          </div>
          {errors.rating && <div className={s.err}>{errors.rating}</div>}
        </div>

        <Input label="Headline" required value={title} error={errors.title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Sum up your experience in a few words" maxLength={90} />

        <Textarea label="Your review" required rows={6} value={body} error={errors.body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What did you like or dislike? How did you use it? How does it compare to alternatives?"
                  hint={`${body.length} characters — minimum 20`} />

        <MediaUploader
          label="Add photos or a video"
          value={media}
          onChange={setMedia}
          accept={["image", "video"]}
          max={6}
          uploadedBy={`${me.first_name} ${me.last_name[0]}.`}
          compact
          hint="Reviews with photos are far more useful to other shoppers. Max 6 files."
        />

        <div className={s.note}>
          Publishing checks server-side that you have a <strong>delivered order</strong>
          containing this product — that is what earns the "Verified purchase" badge.
        </div>
      </div>
    </Modal>
  );
}
