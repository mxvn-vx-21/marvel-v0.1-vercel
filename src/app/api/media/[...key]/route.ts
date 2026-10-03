import { MEDIA_KEY_RE } from "@/lib/media";
import { getObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Serves uploaded images. Keys are validated against a strict pattern (no traversal). */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const key = (await ctx.params).key.join("/");
  if (!MEDIA_KEY_RE.test(key)) return new Response("Not found", { status: 404 });
  const obj = await getObject(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // Keys are unique per upload (UUID) → safe to cache forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
