import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { MediaUploader } from "../../components/media/MediaUploader";
import { useToast } from "../../store/ToastContext";
import { categories } from "../../mock/db";
import { DOCUMENTS, SIGNUP_STEPS, useMerchantSignup } from "./useMerchantSignup";
import s from "./MerchantSignupPage.module.css";

const BUSINESS_TYPES = [
  { value: "private_limited", label: "Private limited company" },
  { value: "llp", label: "Limited liability partnership" },
  { value: "partnership", label: "Partnership firm" },
  { value: "proprietorship", label: "Sole proprietorship" },
  { value: "opc", label: "One person company" },
];

const ROOTS = categories.filter((c) => c.depth === 0);

export function MerchantSignupPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const f = useMerchantSignup();
  const [submitting, setSubmitting] = useState(false);
  const [applicationNo, setApplicationNo] = useState<string | null>(null);

  const { draft, set, setDoc, step, setStep, index, errors, stepIsValid, allValid, next, back } = f;
  const current = SIGNUP_STEPS[index]!;

  const submit = async () => {
    if (!allValid) { push("Complete every section before submitting", "error"); setStep("review"); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setApplicationNo(`MRC-${9400 + Math.floor(draft.legal_name.length * 7)}`);
    push("Application submitted for review", "success");
  };

  if (applicationNo) {
    return (
      <div className={s.page}>
        <div className={s.done}>
          <span className={s.doneIco}><Icon name="check" size={28} strokeWidth={2.6} /></span>
          <h1 style={{ fontSize: "var(--fs-2xl)" }}>Application submitted</h1>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "52ch" }}>
            Thanks, {draft.owner_name.split(" ")[0]}. We have your documents for{" "}
            <strong>{draft.display_name}</strong> and emailed a confirmation to {draft.email}.
          </p>
          <div className={s.appNo}>{applicationNo}</div>

          <div className={s.timeline}>
            {[
              { t: "Application received", d: "Your documents are queued for verification.", now: true },
              { t: "KYC verification", d: "We check the GSTIN, PAN and bank details against government records. Usually 1–2 business days." },
              { t: "Commission agreement", d: "You will be sent a rate card to accept in the console." },
              { t: "Store goes live", d: "List products and start receiving orders." },
            ].map((row, i) => (
              <div key={row.t} className={s.tl}>
                <span className={cn(s.tlDot, row.now && s.tlNow)}>
                  {row.now ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
                </span>
                <span>
                  <span style={{ display: "block", fontWeight: 600, fontSize: "var(--fs-md)" }}>{row.t}</span>
                  <span style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{row.d}</span>
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => navigate("/")}>Back to the store</Button>
            <Button onClick={() => navigate("/merchant")}>
              Preview the merchant console <Icon name="arrowRight" size={15} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.top}>
        <div className={s.topInner}>
          <Link to="/" className={s.brand}><span className={s.mark}>e</span> eKommerce</Link>
          <span className={s.pill}>Sell on eKommerce</span>
          <span className={s.spacer} />
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Already applied? <Link to="/login" style={{ color: "var(--text-brand)", fontWeight: 550 }}>Sign in</Link>
          </span>
        </div>
      </div>

      <div className={s.body}>
        <aside className={s.rail}>
          {SIGNUP_STEPS.map((st, i) => {
            const done = i < index && stepIsValid(st.id);
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
        </aside>

        <div>
          <Card>
            <CardHeader title={current.label} subtitle={current.blurb} />
            <CardBody>
              {step === "account" && (
                <div className={s.fields}>
                  <Input label="Your full name" required value={draft.owner_name}
                         error={errors.owner_name} onChange={(e) => set("owner_name", e.target.value)}
                         hint="The person who will manage this seller account" />
                  <div className={s.two}>
                    <Input label="Business email" type="email" required value={draft.email}
                           error={errors.email} onChange={(e) => set("email", e.target.value)}
                           placeholder="orders@yourbusiness.in" />
                    <Input label="Mobile number" required value={draft.phone}
                           error={errors.phone} onChange={(e) => set("phone", e.target.value)}
                           placeholder="+91 98450 11223" hint="We send OTPs and payout alerts here" />
                  </div>
                  <div className={s.two}>
                    <Input label="Password" type="password" required value={draft.password}
                           error={errors.password} onChange={(e) => set("password", e.target.value)}
                           hint="Minimum 8 characters" />
                    <Input label="Confirm password" type="password" required value={draft.confirm_password}
                           error={errors.confirm_password}
                           onChange={(e) => set("confirm_password", e.target.value)} />
                  </div>
                </div>
              )}

              {step === "business" && (
                <div className={s.fields}>
                  <div className={s.two}>
                    <Input label="Registered legal name" required value={draft.legal_name}
                           error={errors.legal_name} onChange={(e) => set("legal_name", e.target.value)}
                           placeholder="Aurora Audio Labs Pvt Ltd"
                           hint="Exactly as on your GST certificate" />
                    <Input label="Store display name" required value={draft.display_name}
                           error={errors.display_name} onChange={(e) => set("display_name", e.target.value)}
                           placeholder="Aurora Audio Labs"
                           hint="What shoppers see on your listings" />
                  </div>
                  <div className={s.two}>
                    <Select label="Business type" value={draft.business_type}
                            onChange={(e) => set("business_type", e.target.value)}
                            options={BUSINESS_TYPES} />
                    <Select label="Primary category" value={draft.primary_category}
                            error={errors.primary_category}
                            onChange={(e) => set("primary_category", e.target.value)}
                            options={[{ value: "", label: "Select a category…" },
                                      ...ROOTS.map((c) => ({ value: c.slug, label: c.name }))]} />
                  </div>
                  <div className={s.two}>
                    <Input label="GSTIN" required value={draft.gstin} error={errors.gstin}
                           onChange={(e) => set("gstin", e.target.value.toUpperCase())}
                           placeholder="29ABCDE1234F1Z5" maxLength={15}
                           hint="15 characters — verified against the GST portal" />
                    <Input label="Business PAN" required value={draft.pan} error={errors.pan}
                           onChange={(e) => set("pan", e.target.value.toUpperCase())}
                           placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                  <Input label="Registered address" required value={draft.address_line}
                         error={errors.address_line} onChange={(e) => set("address_line", e.target.value)}
                         placeholder="Unit 4, Brigade Tech Park, Whitefield" />
                  <div className={s.three}>
                    <Input label="City" required value={draft.city} error={errors.city}
                           onChange={(e) => set("city", e.target.value)} />
                    <Input label="State" required value={draft.state} error={errors.state}
                           onChange={(e) => set("state", e.target.value)} />
                    <Input label="PIN code" required value={draft.pincode} error={errors.pincode}
                           onChange={(e) => set("pincode", e.target.value)} maxLength={6} inputMode="numeric" />
                  </div>
                  <div className={s.two}>
                    <Select label="Years trading" value={draft.years_trading}
                            onChange={(e) => set("years_trading", e.target.value)}
                            options={[
                              { value: "0", label: "Less than a year" },
                              { value: "1", label: "1–3 years" },
                              { value: "3", label: "3–5 years" },
                              { value: "5", label: "More than 5 years" },
                            ]} />
                    <Input label="Website or social page" value={draft.website}
                           onChange={(e) => set("website", e.target.value)}
                           placeholder="https://…" hint="Optional, but it helps verification" />
                  </div>
                </div>
              )}

              {step === "documents" && (
                <div className={s.fields}>
                  <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    Upload clear scans or photos. PDFs up to 20 MB, images up to 5 MB.
                    Everything here is reviewed by our compliance team before your store goes live.
                  </p>
                  {DOCUMENTS.map((doc) => {
                    const files = draft.documents[doc.key] ?? [];
                    const err = errors[doc.key];
                    return (
                      <div key={doc.key} className={cn(s.doc, err && s.docErr)}>
                        <div className={s.docHead}>
                          <span className={cn(s.docIco, files.length > 0 && s.docOk)}>
                            <Icon name={files.length > 0 ? "check" : doc.icon} size={16} />
                          </span>
                          <div style={{ flex: 1 }}>
                            <div className={s.docT}>
                              {doc.label}{" "}
                              <span className={doc.required ? s.reqTag : s.optTag}>
                                {doc.required ? "REQUIRED" : "OPTIONAL"}
                              </span>
                            </div>
                            <div className={s.docD}>{doc.desc}</div>
                          </div>
                        </div>
                        <MediaUploader
                          value={files}
                          onChange={(nextFiles) => setDoc(doc.key, nextFiles)}
                          accept={["image", "document"]}
                          max={2}
                          uploadedBy={draft.owner_name || "Applicant"}
                          compact
                        />
                        {err && <div className={s.err}>{err}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {step === "bank" && (
                <div className={s.fields}>
                  <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    Weekly settlements are paid into this account. The account holder name must
                    match your registered legal name, or payouts will be rejected by the bank.
                  </p>
                  <Input label="Account holder name" required value={draft.account_holder}
                         error={errors.account_holder} onChange={(e) => set("account_holder", e.target.value)}
                         placeholder="Aurora Audio Labs Pvt Ltd" />
                  <div className={s.two}>
                    <Input label="Account number" required value={draft.account_number}
                           error={errors.account_number} inputMode="numeric"
                           onChange={(e) => set("account_number", e.target.value.replace(/\D/g, ""))} />
                    <Input label="Confirm account number" required value={draft.confirm_account_number}
                           error={errors.confirm_account_number} inputMode="numeric"
                           onChange={(e) => set("confirm_account_number", e.target.value.replace(/\D/g, ""))} />
                  </div>
                  <div className={s.two}>
                    <Input label="IFSC code" required value={draft.ifsc} error={errors.ifsc}
                           onChange={(e) => set("ifsc", e.target.value.toUpperCase())}
                           placeholder="HDFC0001234" maxLength={11}
                           hint="11 characters — the 5th is always zero" />
                    <Input label="Bank name" required value={draft.bank_name} error={errors.bank_name}
                           onChange={(e) => set("bank_name", e.target.value)} placeholder="HDFC Bank" />
                  </div>
                  <Input label="Branch" value={draft.branch} onChange={(e) => set("branch", e.target.value)}
                         placeholder="Whitefield, Bengaluru" />
                </div>
              )}

              {step === "review" && (
                <div className={s.fields}>
                  {!allValid && (
                    <div style={{
                      padding: "var(--sp-3) var(--sp-4)", background: "var(--danger-bg)",
                      border: "1px solid var(--danger-border)", borderRadius: "var(--r-lg)",
                      color: "var(--danger-fg)", fontSize: "var(--fs-sm)",
                    }}>
                      Some sections are incomplete. Use the list on the left to finish them.
                    </div>
                  )}

                  <div>
                    <div className={s.rTitle}>Account</div>
                    <div className={s.rRow}><span className={s.rk}>Contact</span><span className={s.rv}>{draft.owner_name || "—"}</span></div>
                    <div className={s.rRow}><span className={s.rk}>Email</span><span className={s.rv}>{draft.email || "—"}</span></div>
                    <div className={s.rRow}><span className={s.rk}>Phone</span><span className={s.rv}>{draft.phone || "—"}</span></div>
                  </div>

                  <div>
                    <div className={s.rTitle}>Business</div>
                    <div className={s.rRow}><span className={s.rk}>Legal name</span><span className={s.rv}>{draft.legal_name || "—"}</span></div>
                    <div className={s.rRow}><span className={s.rk}>Store name</span><span className={s.rv}>{draft.display_name || "—"}</span></div>
                    <div className={s.rRow}><span className={s.rk}>GSTIN</span><span className={cn(s.rv, "mono")}>{draft.gstin || "—"}</span></div>
                    <div className={s.rRow}><span className={s.rk}>PAN</span><span className={cn(s.rv, "mono")}>{draft.pan || "—"}</span></div>
                    <div className={s.rRow}>
                      <span className={s.rk}>Address</span>
                      <span className={s.rv}>
                        {draft.address_line ? `${draft.address_line}, ${draft.city} ${draft.pincode}` : "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className={s.rTitle}>Documents</div>
                    {DOCUMENTS.map((doc) => {
                      const n = draft.documents[doc.key]?.length ?? 0;
                      return (
                        <div key={doc.key} className={s.rRow}>
                          <span className={s.rk}>{doc.label}</span>
                          <span className={s.rv} style={{
                            color: n > 0 ? "var(--success-fg)" : doc.required ? "var(--danger-fg)" : "var(--text-muted)",
                          }}>
                            {n > 0 ? `${n} file${n > 1 ? "s" : ""} uploaded` : doc.required ? "Missing" : "Not provided"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <div className={s.rTitle}>Bank account</div>
                    <div className={s.rRow}><span className={s.rk}>Holder</span><span className={s.rv}>{draft.account_holder || "—"}</span></div>
                    <div className={s.rRow}>
                      <span className={s.rk}>Account</span>
                      <span className={cn(s.rv, "mono")}>
                        {draft.account_number ? `••••${draft.account_number.slice(-4)}` : "—"}
                      </span>
                    </div>
                    <div className={s.rRow}><span className={s.rk}>IFSC</span><span className={cn(s.rv, "mono")}>{draft.ifsc || "—"}</span></div>
                  </div>

                  <label className={s.consent}>
                    <input type="checkbox" checked={draft.agreed}
                           onChange={(e) => set("agreed", e.target.checked)} />
                    <span style={{ fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
                      I confirm the information and documents are accurate, and I accept the
                      seller agreement, commission rate card and returns policy. I understand
                      false documents lead to permanent removal from the marketplace.
                    </span>
                  </label>
                  {errors.agreed && <div className={s.err}>{errors.agreed}</div>}
                </div>
              )}
            </CardBody>
          </Card>

          <div className={s.nav}>
            {index > 0 && (
              <Button variant="secondary" onClick={back}>
                <Icon name="arrowLeft" size={15} /> Back
              </Button>
            )}
            <span className={s.navSpacer} />
            {step !== "review" ? (
              <Button onClick={next}>Continue <Icon name="arrowRight" size={15} /></Button>
            ) : (
              <Button disabled={submitting} onClick={() => void submit()}>
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
