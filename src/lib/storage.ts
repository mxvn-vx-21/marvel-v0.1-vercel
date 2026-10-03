import "server-only";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, schema } from "./db";

/**
 * Object storage abstraction. The app only ever deals in KEYS.
 *   • Default: images live in the Postgres `media` table (no extra paid service needed).
 *   • Optional upgrade: bind an R2 bucket as `MEDIA` in wrangler.jsonc and R2 is used automatically.
 */
interface R2Like {
  put(key: string, value: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream } | null>;
  delete(key: string): Promise<void>;
}

function bucket(): R2Like | null {
  try {
    return (getCloudflareContext().env as { MEDIA?: R2Like }).MEDIA ?? null;
  } catch {
    return null;
  }
}

const CT_BY_EXT: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

export async function putObject(key: string, bytes: ArrayBuffer, contentType: string, userId: string) {
  const b = bucket();
  if (b) return void (await b.put(key, bytes, { httpMetadata: { contentType } }));
  await getDb().insert(schema.media).values({ key, userId, contentType, size: bytes.byteLength, data: new Uint8Array(bytes) });
}

export async function getObject(key: string): Promise<{ body: BodyInit; contentType: string } | null> {
  const contentType = CT_BY_EXT[key.split(".").pop() ?? ""];
  if (!contentType) return null;
  const b = bucket();
  if (b) {
    const obj = await b.get(key);
    return obj ? { body: obj.body, contentType } : null;
  }
  const [row] = await getDb().select({ data: schema.media.data, contentType: schema.media.contentType }).from(schema.media).where(eq(schema.media.key, key)).limit(1);
  return row ? { body: row.data as unknown as BodyInit, contentType: row.contentType } : null;
}

export async function deleteObject(key: string | null | undefined) {
  if (!key) return;
  try {
    const b = bucket();
    if (b) return void (await b.delete(key));
    await getDb().delete(schema.media).where(eq(schema.media.key, key));
  } catch (e) {
    console.error("[storage] delete failed", e);
  }
}

export const mediaUrl = (key: string | null | undefined) => (key ? `/api/media/${key}` : null);
