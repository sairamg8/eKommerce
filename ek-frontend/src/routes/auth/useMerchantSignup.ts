import { useMemo, useState } from "react";
import type { MediaAsset } from "../../mock/types";

export type DocKey =
  | "gst_certificate" | "pan_card" | "address_proof"
  | "cancelled_cheque" | "business_licence" | "trademark_or_isbn";

export type SignupDraft = {
  // Account
  owner_name: string; email: string; phone: string;
  password: string; confirm_password: string;
  // Business
  legal_name: string; display_name: string;
  business_type: string; primary_category: string;
  gstin: string; pan: string;
  address_line: string; city: string; state: string; pincode: string;
  years_trading: string; website: string;
  // Documents
  documents: Partial<Record<DocKey, MediaAsset[]>>;
  // Bank
  account_holder: string; account_number: string; confirm_account_number: string;
  ifsc: string; bank_name: string; branch: string;
  // Consent
  agreed: boolean;
};

export const EMPTY_SIGNUP: SignupDraft = {
  owner_name: "", email: "", phone: "", password: "", confirm_password: "",
  legal_name: "", display_name: "", business_type: "private_limited",
  primary_category: "", gstin: "", pan: "",
  address_line: "", city: "", state: "", pincode: "",
  years_trading: "1", website: "",
  documents: {},
  account_holder: "", account_number: "", confirm_account_number: "",
  ifsc: "", bank_name: "", branch: "",
  agreed: false,
};

export const DOCUMENTS: {
  key: DocKey; label: string; desc: string; required: boolean; icon: string;
}[] = [
  { key: "gst_certificate", label: "GST registration certificate", icon: "file", required: true,
    desc: "PDF or photo of your GST certificate. The GSTIN must match what you entered." },
  { key: "pan_card", label: "Business PAN card", icon: "shield", required: true,
    desc: "PAN of the business entity, or your personal PAN if you are a sole proprietor." },
  { key: "address_proof", label: "Business address proof", icon: "mapPin", required: true,
    desc: "Utility bill, rent agreement or property tax receipt, dated within 3 months." },
  { key: "cancelled_cheque", label: "Cancelled cheque or bank letter", icon: "wallet", required: true,
    desc: "Must show the account number and IFSC. Payouts are blocked without this." },
  { key: "business_licence", label: "Trade licence / Shop & Establishment", icon: "store", required: false,
    desc: "Optional, but it speeds up approval for regulated categories." },
  { key: "trademark_or_isbn", label: "Brand authorisation, trademark or ISBN", icon: "tag", required: false,
    desc: "Required if you sell branded goods you do not own, or books (ISBN registry proof)." },
];

export type SignupStep = "account" | "business" | "documents" | "bank" | "review";

export const SIGNUP_STEPS: { id: SignupStep; label: string; blurb: string; icon: string }[] = [
  { id: "account", label: "Your account", blurb: "Login details for the console", icon: "user" },
  { id: "business", label: "Business details", blurb: "Legal entity, GSTIN and address", icon: "store" },
  { id: "documents", label: "Verification documents", blurb: "KYC uploads we must review", icon: "file" },
  { id: "bank", label: "Bank account", blurb: "Where your payouts are settled", icon: "wallet" },
  { id: "review", label: "Review & submit", blurb: "Confirm and send for approval", icon: "check" },
];

export type SignupErrors = Partial<Record<keyof SignupDraft | DocKey, string>>;

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function validateSignupStep(step: SignupStep, d: SignupDraft): SignupErrors {
  const e: SignupErrors = {};

  if (step === "account") {
    if (d.owner_name.trim().length < 3) e.owner_name = "Enter the name of the person who will manage this account";
    if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = "Enter a valid business email address";
    if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(d.phone.replace(/\s/g, ""))) e.phone = "Enter a valid 10-digit Indian mobile number";
    if (d.password.length < 8) e.password = "Password must be at least 8 characters";
    if (d.password !== d.confirm_password) e.confirm_password = "Passwords do not match";
  }

  if (step === "business") {
    if (d.legal_name.trim().length < 3) e.legal_name = "Enter the registered legal name";
    if (d.display_name.trim().length < 3) e.display_name = "Enter the store name shoppers will see";
    if (!d.primary_category) e.primary_category = "Pick the category you mostly sell in";
    if (!GSTIN_RE.test(d.gstin.toUpperCase())) e.gstin = "GSTIN must be 15 characters, e.g. 29ABCDE1234F1Z5";
    if (!PAN_RE.test(d.pan.toUpperCase())) e.pan = "PAN must be 10 characters, e.g. ABCDE1234F";
    if (d.address_line.trim().length < 8) e.address_line = "Enter the full registered address";
    if (!d.city.trim()) e.city = "City is required";
    if (!d.state.trim()) e.state = "State is required";
    if (!/^\d{6}$/.test(d.pincode)) e.pincode = "PIN code must be 6 digits";
  }

  if (step === "documents") {
    for (const doc of DOCUMENTS) {
      if (doc.required && !(d.documents[doc.key]?.length)) {
        e[doc.key] = `${doc.label} is required`;
      }
    }
  }

  if (step === "bank") {
    if (d.account_holder.trim().length < 3) e.account_holder = "Name must match the bank record";
    if (!/^\d{9,18}$/.test(d.account_number)) e.account_number = "Account number must be 9–18 digits";
    if (d.account_number !== d.confirm_account_number) e.confirm_account_number = "Account numbers do not match";
    if (!IFSC_RE.test(d.ifsc.toUpperCase())) e.ifsc = "IFSC must be 11 characters, e.g. HDFC0001234";
    if (!d.bank_name.trim()) e.bank_name = "Bank name is required";
  }

  if (step === "review") {
    if (!d.agreed) e.agreed = "You must accept the seller agreement";
  }

  return e;
}

export function useMerchantSignup() {
  const [draft, setDraft] = useState<SignupDraft>(EMPTY_SIGNUP);
  const [step, setStep] = useState<SignupStep>("account");
  const [touched, setTouched] = useState<Set<SignupStep>>(new Set());

  const set = <K extends keyof SignupDraft>(k: K, v: SignupDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const setDoc = (key: DocKey, files: MediaAsset[]) =>
    setDraft((d) => ({ ...d, documents: { ...d.documents, [key]: files } }));

  const rawErrors = useMemo(() => validateSignupStep(step, draft), [step, draft]);
  const index = SIGNUP_STEPS.findIndex((x) => x.id === step);
  const stepIsValid = (id: SignupStep) => Object.keys(validateSignupStep(id, draft)).length === 0;
  const allValid = SIGNUP_STEPS.every((x) => stepIsValid(x.id));

  const next = () => {
    setTouched((t) => new Set(t).add(step));
    if (Object.keys(rawErrors).length) return;
    const n = SIGNUP_STEPS[index + 1];
    if (n) setStep(n.id);
  };
  const back = () => {
    const p = SIGNUP_STEPS[index - 1];
    if (p) setStep(p.id);
  };

  return {
    draft, set, setDoc, step, setStep, index,
    errors: touched.has(step) ? rawErrors : {},
    rawErrors, stepIsValid, allValid, next, back, setTouched,
  };
}
