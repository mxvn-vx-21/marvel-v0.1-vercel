import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "./db";

export async function clientIp(h?: Headers): Promise<string> {
  const hs = h ?? (await headers());
  return hs.get("cf-connecting-ip") ?? hs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Atomic fixed-window limiter backed by Postgres (works across Workers isolates).
 * Returns ok=false once `limit` hits within `windowSec` are exceeded.
 */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const db = getDb();
  const rows = await db.execute<{ count: number; retry: number }>(sql`
    INSERT INTO app_rate_limit AS r (key, count, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN r.window_start < now() - make_interval(secs => ${windowSec}) THEN 1 ELSE r.count + 1 END,
      window_start = CASE WHEN r.window_start < now() - make_interval(secs => ${windowSec}) THEN now() ELSE r.window_start END
    RETURNING count,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (r.window_start + make_interval(secs => ${windowSec}) - now()))))::int AS retry
  `);
  const row = rows[0];
  return { ok: row.count <= limit, retryAfter: row.retry };
}

/** Same-origin check for state-changing route handlers (CSRF defence-in-depth on top of SameSite=Lax). */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(req.url).host || new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
