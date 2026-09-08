import { useMemo, useState } from "react";
import type { MediaAsset } from "../../../mock/types";

export type SpecRow = { key: string; value: string };

export type ProductDraft = {
  // Basics
  category_id: string;
  name: string;
  brand: string;
  description: string;
  highlights: string[];
  // Media
  media: MediaAsset[];
  primary_media_id: string;
  // Pricing & stock
  price: string;
  compare_at_price: string;
  cost: string;
  sku: string;
  stock: string;
  low_stock_threshold: string;
  // Specs
  specs: SpecRow[];
  // Shipping
  weight_g: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  handling_days: string;
  is_fragile: boolean;
  cod_allowed: boolean;
  // Publish
  status: "draft" | "active";
};

export const EMPTY_DRAFT: ProductDraft = {
  category_id: "",
  name: "",
  brand: "",
  description: "",
  highlights: ["", "", ""],
  media: [],
  primary_media_id: "",
  price: "",
  compare_at_price: "",
  cost: "",
  sku: "",
  stock: "",
  low_stock_threshold: "10",
  specs: [{ key: "", value: "" }],
  weight_g: "",
  length_cm: "",
  width_cm: "",
  height_cm: "",
  handling_days: "1",
  is_fragile: false,
  cod_allowed: true,
  status: "active",
};

export type StepId = "basics" | "media" | "pricing" | "specs" | "shipping" | "review";

export const STEPS: { id: StepId; label: string; icon: string; blurb: string }[] = [
  { id: "basics", label: "Product details", icon: "file", blurb: "Category, title and description" },
  { id: "media", label: "Images & video", icon: "image", blurb: "Photos, video and spec sheets" },
  { id: "pricing", label: "Pricing & stock", icon: "rupee", blurb: "Price, cost and opening stock" },
  { id: "specs", label: "Specifications", icon: "list", blurb: "Structured attributes buyers filter on" },
  { id: "shipping", label: "Shipping", icon: "truck", blurb: "Weight, size and handling time" },
  { id: "review", label: "Review & publish", icon: "check", blurb: "Final check before it goes live" },
];

export type Errors = Partial<Record<keyof ProductDraft | "highlights" | "specs", string>>;

/** Per-step validation. The backend must repeat every one of these. */
export function validateStep(step: StepId, d: ProductDraft): Errors {
  const e: Errors = {};

  if (step === "basics") {
    if (!d.category_id) e.category_id = "Pick the category buyers will browse";
    if (d.name.trim().length < 10) e.name = "Title must be at least 10 characters";
    if (d.name.trim().length > 150) e.name = "Title must be 150 characters or fewer";
    if (!d.brand.trim()) e.brand = "Brand is required";
    if (d.description.trim().length < 50) e.description = "Describe the product in at least 50 characters";
    if (!d.highlights.some((h) => h.trim())) e.highlights = "Add at least one key feature";
  }

  if (step === "media") {
    const images = d.media.filter((m) => m.kind === "image");
    if (images.length < 1) e.media = "At least one product image is required";
    if (!d.primary_media_id && images.length > 0) e.primary_media_id = "Choose a cover image";
  }

  if (step === "pricing") {
    const price = Number(d.price);
    const compare = Number(d.compare_at_price);
    const cost = Number(d.cost);
    if (!price || price <= 0) e.price = "Enter a selling price above zero";
    if (d.compare_at_price && compare <= price) e.compare_at_price = "MRP must be higher than the selling price";
    if (!d.cost) e.cost = "Cost price is needed for margin reporting";
    else if (cost >= price) e.cost = "Cost must be lower than the selling price";
    if (!/^[A-Z0-9-]{4,20}$/i.test(d.sku)) e.sku = "SKU must be 4–20 letters, digits or hyphens";
    if (d.stock === "" || Number(d.stock) < 0) e.stock = "Enter your opening stock (0 is allowed)";
  }

  if (step === "specs") {
    const filled = d.specs.filter((s) => s.key.trim() && s.value.trim());
    if (filled.length < 2) e.specs = "Add at least two specifications — buyers filter on these";
  }

  if (step === "shipping") {
    if (!d.weight_g || Number(d.weight_g) <= 0) e.weight_g = "Shipping weight is required";
    if (!d.length_cm || !d.width_cm || !d.height_cm) e.length_cm = "All three dimensions are required";
  }

  return e;
}

/** Seller-Central style listing score — nudges toward a complete listing. */
export function listingScore(d: ProductDraft) {
  const checks = [
    { ok: d.name.trim().length >= 25, label: "Title is descriptive (25+ characters)" },
    { ok: d.description.trim().length >= 150, label: "Description is detailed (150+ characters)" },
    { ok: d.highlights.filter((h) => h.trim()).length >= 3, label: "Three key features listed" },
    { ok: d.media.filter((m) => m.kind === "image").length >= 3, label: "Three or more images" },
    { ok: d.media.some((m) => m.kind === "video"), label: "Product video added" },
    { ok: d.media.some((m) => m.kind === "document"), label: "Spec sheet or manual attached" },
    { ok: d.specs.filter((s) => s.key.trim() && s.value.trim()).length >= 4, label: "Four or more specifications" },
    { ok: !!d.compare_at_price, label: "MRP set, so a discount shows" },
  ];
  const done = checks.filter((c) => c.ok).length;
  return { checks, done, total: checks.length, pct: Math.round((done / checks.length) * 100) };
}

export function useProductForm(initial: ProductDraft = EMPTY_DRAFT) {
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [step, setStep] = useState<StepId>("basics");
  const [touched, setTouched] = useState<Set<StepId>>(new Set());

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors = useMemo(() => validateStep(step, draft), [step, draft]);
  const score = useMemo(() => listingScore(draft), [draft]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const stepIsValid = (id: StepId) => Object.keys(validateStep(id, draft)).length === 0;
  const allValid = STEPS.filter((s) => s.id !== "review").every((s) => stepIsValid(s.id));

  const next = () => {
    setTouched((t) => new Set(t).add(step));
    if (Object.keys(errors).length) return false;
    const n = STEPS[stepIndex + 1];
    if (n) setStep(n.id);
    return true;
  };

  const back = () => {
    const p = STEPS[stepIndex - 1];
    if (p) setStep(p.id);
  };

  return {
    draft, set, setDraft, step, setStep, stepIndex,
    errors: touched.has(step) ? errors : {},
    rawErrors: errors, score, next, back, stepIsValid, allValid, touched, setTouched,
  };
}
