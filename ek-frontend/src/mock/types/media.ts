export type MediaKind = "image" | "video" | "document";

/**
 * One uploaded file. A real build stores `storage_key` (S3/MinIO) plus a
 * signed URL; the prototype renders a hue-derived placeholder instead.
 */
export type MediaAsset = {
  id: string;
  kind: MediaKind;
  filename: string;
  mime: string;
  size_bytes: number;
  hue: number;
  /** Videos only, in seconds. */
  duration_s: number | null;
  /** Documents only. */
  pages: number | null;
  alt: string;
  uploaded_by: string;
  uploaded_at: string;
};

export type ProductMedia = MediaAsset & {
  product_id: string;
  /** The image shown on the catalogue card. Exactly one per product. */
  is_primary: boolean;
  sort_order: number;
};

/** What the uploader accepts, mirrored by server-side validation. */
export const MEDIA_RULES = {
  image: { mimes: ["image/jpeg", "image/png", "image/webp", "image/avif"], maxBytes: 5_000_000, label: "Images" },
  video: { mimes: ["video/mp4", "video/webm", "video/quicktime"], maxBytes: 100_000_000, label: "Video" },
  document: { mimes: ["application/pdf"], maxBytes: 20_000_000, label: "PDF" },
} as const;
