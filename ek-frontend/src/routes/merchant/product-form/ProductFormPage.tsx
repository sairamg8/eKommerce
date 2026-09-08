import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../../lib/cn";
import { Button } from "../../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card";
import { Icon } from "../../../components/ui/Icon";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../store/ToastContext";
import { CURRENT_MERCHANT } from "../../../components/layout/MerchantLayout";
import { STEPS, useProductForm } from "./useProductForm";
import { LivePreview } from "./LivePreview";
import { StepBasics } from "./steps/StepBasics";
import { StepMedia } from "./steps/StepMedia";
import { StepPricing } from "./steps/StepPricing";
import { StepSpecs } from "./steps/StepSpecs";
import { StepShipping } from "./steps/StepShipping";
import { StepReview } from "./steps/StepReview";
import s from "./ProductFormPage.module.css";

export function ProductFormPage() {
  const m = CURRENT_MERCHANT;
  const navigate = useNavigate();
  const { push } = useToast();
  const form = useProductForm();
  const [saving, setSaving] = useState(false);

  const { draft, set, step, setStep, stepIndex, errors, score, next, back, stepIsValid, allValid } = form;
  const current = STEPS[stepIndex]!;

  const publish = async (status: "draft" | "active") => {
    if (status === "active" && !allValid) {
      push("Fix the highlighted sections before publishing", "error");
      setStep("review");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    push(
      status === "active"
        ? `${draft.name} is live in your catalogue`
        : `${draft.name || "Draft"} saved — not visible to shoppers`,
      "success",
    );
    navigate("/merchant/products");
  };

  const circumference = 2 * Math.PI * 24;

  return (
    <div>
      <PageHeader
        title="Add a product"
        subtitle="Complete each section — shoppers see everything you enter here"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate("/merchant/products")}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" disabled={saving} onClick={() => void publish("draft")}>
              Save as draft
            </Button>
          </>
        }
      />

      <div className={s.wrap}>
        <aside className={s.rail}>
          <div className={s.steps}>
            {STEPS.map((st, i) => {
              const done = st.id !== "review" && stepIsValid(st.id) && i < stepIndex;
              return (
                <button key={st.id} className={cn(s.step, step === st.id && s.stepOn)}
                        onClick={() => setStep(st.id)}>
                  <span className={cn(s.dot, done && s.dotOk)}>
                    {done ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <span>
                    <span className={s.sl}>{st.label}</span>
                    <span className={s.sb}>{st.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className={s.body}>
          <Card>
            <CardHeader title={current.label} subtitle={current.blurb} />
            <CardBody>
              {step === "basics" && <StepBasics draft={draft} set={set} errors={errors} />}
              {step === "media" && <StepMedia draft={draft} set={set} errors={errors} merchantName={m.business_name} />}
              {step === "pricing" && <StepPricing draft={draft} set={set} errors={errors} commissionPct={m.commission_pct} />}
              {step === "specs" && <StepSpecs draft={draft} set={set} errors={errors} />}
              {step === "shipping" && <StepShipping draft={draft} set={set} errors={errors} slaHours={m.fulfilment_sla_hrs} />}
              {step === "review" && <StepReview draft={draft} goTo={setStep} />}
            </CardBody>
          </Card>

          <div className={s.nav}>
            {stepIndex > 0 && (
              <Button variant="secondary" onClick={back}>
                <Icon name="arrowLeft" size={15} /> Back
              </Button>
            )}
            <span className={s.navSpacer} />
            {step !== "review" ? (
              <Button onClick={next}>
                Continue <Icon name="arrowRight" size={15} />
              </Button>
            ) : (
              <div className={s.publishRow}>
                <Button variant="secondary" disabled={saving} onClick={() => void publish("draft")}>
                  Save as draft
                </Button>
                <Button disabled={saving || !allValid} onClick={() => void publish("active")}>
                  {saving ? "Publishing…" : "Publish listing"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <aside className={s.aside}>
          <Card>
            <CardHeader title="Listing quality" />
            <CardBody>
              <div className={s.scoreTop}>
                <div className={s.scoreRing}>
                  <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }} aria-hidden>
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--surface-sunken)" strokeWidth="6" />
                    <circle cx="28" cy="28" r="24" fill="none" strokeWidth="6" strokeLinecap="round"
                            stroke={score.pct >= 75 ? "var(--success-solid)" : score.pct >= 40 ? "var(--warning-solid)" : "var(--danger-solid)"}
                            strokeDasharray={`${(score.pct / 100) * circumference} ${circumference}`} />
                  </svg>
                  <span className={s.scoreNum}>{score.pct}%</span>
                </div>
                <div>
                  <div className={s.scoreLabel}>
                    {score.pct >= 75 ? "Strong listing" : score.pct >= 40 ? "Getting there" : "Needs work"}
                  </div>
                  <div className={s.scoreSub}>{score.done} of {score.total} checks passed</div>
                </div>
              </div>
              <div className={s.checks}>
                {score.checks.map((c) => (
                  <div key={c.label} className={cn(s.check, c.ok && s.checkOn)}>
                    <Icon name={c.ok ? "check" : "minus"} size={13} strokeWidth={2.6}
                          className={cn(s.tick, c.ok && s.tickOn)} />
                    {c.label}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Shopper preview" subtitle="How your card looks in search" />
            <CardBody>
              <LivePreview draft={draft} merchantName={m.business_name} />
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
