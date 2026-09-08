/** Tiny classname joiner — replaces the `clsx` dependency. */
export type ClassValue = string | number | bigint | boolean | null | undefined;

export function cn(...parts: ClassValue[]): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join(" ");
}
