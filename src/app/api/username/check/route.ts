import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { TAKEN_MESSAGE, validateUsername } from "@/lib/username";

export const dynamic = "force-dynamic";

/** GET /api/username/check?u=name → { available, message }. Rate-limited per IP. */
export async function GET(req: Request) {
  try {
    const rl = await rateLimit(`uname:${await clientIp(req.headers)}`, 40, 60);
    if (!rl.ok)
      return NextResponse.json({ available: false, message: "Too many checks — wait a moment." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

    const v = validateUsername(new URL(req.url).searchParams.get("u") ?? "");
    if (!v.ok) return NextResponse.json({ available: false, message: v.message });

    const [hit] = await getDb().select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.username, v.username)).limit(1);
    return NextResponse.json(hit ? { available: false, message: TAKEN_MESSAGE } : { available: true, message: "Username is available." });
  } catch (e) {
    console.error("[username/check]", e);
    return NextResponse.json({ available: false, message: "Couldn't check right now." }, { status: 500 });
  }
}
