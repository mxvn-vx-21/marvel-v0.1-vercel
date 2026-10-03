import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isSameOrigin, rateLimit } from "@/lib/rate-limit";
import { MEDIA_LIMITS, validateImage, type MediaKind } from "@/lib/media";
import { deleteObject, mediaUrl, putObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

const err = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

async function authorize(req: Request, kindParam: string) {
  if (!isSameOrigin(req)) return { res: err("Bad origin.", 403) } as const;
  if (kindParam !== "avatar" && kindParam !== "banner") return { res: err("Not found.", 404) } as const;
  const user = await getCurrentUser();
  if (!user) return { res: err("You need to log in to access this page.", 401) } as const;
  const rl = await rateLimit(`upload:${user.id}`, 20, 600);
  if (!rl.ok) return { res: err("Too many uploads. Try again later.", 429) } as const;
  return { user, kind: kindParam as MediaKind } as const;
}

/** POST /api/upload/avatar|banner (multipart "file") */
export async function POST(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  try {
    const a = await authorize(req, (await ctx.params).kind);
    if ("res" in a) return a.res;
    const { user, kind } = a;

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return err("No file received.", 400);
    if (file.size > MEDIA_LIMITS[kind].maxBytes) return err(`Image is too large (max ${MEDIA_LIMITS[kind].maxBytes / 1024 / 1024} MB).`, 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const v = validateImage(file, bytes, kind);
    if (!v.ok) return err(v.error, 400);

    // Server-generated key; the user id comes from the session, the filename from a UUID.
    const key = `${MEDIA_LIMITS[kind].prefix}/${user.id}/${crypto.randomUUID()}.${v.ext}`;
    await putObject(key, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, v.contentType, user.id);

    const col = kind === "avatar" ? "avatarKey" : "bannerKey";
    const db = getDb();
    const [prev] = await db.select().from(schema.profile).where(eq(schema.profile.userId, user.id)).limit(1);
    if (!prev) { await deleteObject(key); return err("Profile not found.", 404); }
    await db.update(schema.profile).set({ [col]: key, updatedAt: new Date() }).where(eq(schema.profile.userId, user.id));
    await deleteObject(prev[col]); // free the replaced object

    return NextResponse.json({ ok: true, url: mediaUrl(key) });
  } catch (e) {
    console.error("[upload]", e);
    return err("Upload failed. Please try again.", 500);
  }
}

/** DELETE /api/upload/avatar|banner → removes the image */
export async function DELETE(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  try {
    const a = await authorize(req, (await ctx.params).kind);
    if ("res" in a) return a.res;
    const { user, kind } = a;
    const col = kind === "avatar" ? "avatarKey" : "bannerKey";
    const db = getDb();
    const [prev] = await db.select().from(schema.profile).where(eq(schema.profile.userId, user.id)).limit(1);
    await db.update(schema.profile).set({ [col]: null, updatedAt: new Date() }).where(eq(schema.profile.userId, user.id));
    await deleteObject(prev?.[col]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[upload:delete]", e);
    return err("Couldn't remove the image.", 500);
  }
}
