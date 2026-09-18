/**
 * Fixed-window rate limit held in memory. Enough for a single-region
 * deployment: the endpoints it guards are conveniences, not state.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Keeps the map from growing without bound on a long-lived instance. */
const prune = (now: number): void => {
  if (windows.size < 1_000) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
};

export const rateLimit = (
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult => {
  const now = Date.now();
  prune(now);
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
  };
};

/** Best-effort client identity; proxies put the real address first. */
export const clientKey = (request: Request): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
  request.headers.get("x-real-ip") ??
  "unknown";
