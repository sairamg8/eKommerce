/**
 * Seeded deterministic RNG (mulberry32). Dummy data must be identical on
 * every reload, otherwise charts and tables jump around between renders.
 */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** Integer in [min, max] inclusive. */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    float: (min: number, max: number) => next() * (max - min) + min,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)]!,
    /** True with probability p. */
    chance: (p: number) => next() < p,
    shuffle: <T,>(arr: readonly T[]): T[] => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
  };
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Stable ISO timestamp N days before the fixed "now" of the dataset. */
export const NOW = new Date("2026-08-31T10:00:00.000Z");

export const daysAgo = (d: number, hour = 10) => {
  const t = new Date(NOW);
  t.setDate(t.getDate() - d);
  t.setHours(hour, (d * 7) % 60, 0, 0);
  return t.toISOString();
};
