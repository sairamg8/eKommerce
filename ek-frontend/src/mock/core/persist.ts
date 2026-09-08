/**
 * Session persistence for the prototype. Without this a page refresh
 * wipes the cart, which makes the clickthrough feel broken.
 * A real build keeps the cart server-side against a user or session id.
 */
const PREFIX = "ek.proto.";

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota or private mode — the prototype still works, just not across reloads */
  }
}

export function wipe(): void {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIX)) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
