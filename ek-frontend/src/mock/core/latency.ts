/** Simulated network. Every mock call goes through this so loading and
 *  error states are real, not decorative. */

export const DELAY = { fast: 180, normal: 420, slow: 900 };

let failureRate = 0;

/** Flip on from the dev toolbar to exercise every error state at once. */
export const setFailureRate = (rate: number) => { failureRate = rate; };
export const getFailureRate = () => failureRate;

export class MockApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "MockApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Wrap a mock resolver in latency + injectable failure. */
export async function respond<T>(value: () => T, ms = DELAY.normal): Promise<T> {
  await sleep(ms);
  if (failureRate > 0 && Math.random() < failureRate) {
    throw new MockApiError(503, "Upstream service unavailable. Please retry.");
  }
  return value();
}
