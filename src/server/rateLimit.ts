import "server-only";
import { IntegrationError } from "./klaviyo/client";

type Window = { count: number; expiresAt: number };
type Guard = (request: Request) => Promise<void>;

const windows = new Map<string, Window>();

// This per-instance limiter is best-effort and is not durable across instances or restarts.
export function rateLimit(route: string, limit: number, windowMs: number): Guard {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isFinite(windowMs) || windowMs <= 0) {
    throw new Error("Rate limit must have a positive integer limit and window.");
  }

  return async (request) => {
    const now = Date.now();
    for (const [key, window] of windows) {
      if (window.expiresAt <= now) windows.delete(key);
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const key = `${route}:${ip}`;
    const current = windows.get(key);

    if (!current || current.expiresAt <= now) {
      windows.set(key, { count: 1, expiresAt: now + windowMs });
      return;
    }

    if (current.count >= limit) {
      throw new IntegrationError(
        429,
        "rate_limited",
        "Too many requests. Please try again later.",
        Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
      );
    }

    current.count += 1;
  };
}
