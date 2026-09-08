/** Shared API envelope shapes. Every backend endpoint returns one of these. */

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type PageMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

export type ApiPaged<T> = {
  success: true;
  data: T[];
  meta: PageMeta;
};

/** Matches the shape ek-backend's error_handler already emits. */
export type ApiError = {
  success: false;
  message: string;
  /** Field-level messages, keyed by dot-path — from zod's flatten(). */
  errors?: Record<string, string[]>;
};

export type SortDir = "asc" | "desc";

export type ListQuery = {
  page?: number;
  per_page?: number;
  sort?: string;
  dir?: SortDir;
  q?: string;
};
