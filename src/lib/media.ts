/** Safe image validation: declared MIME + extension + real magic bytes must all agree. */
export type MediaKind = "avatar" | "banner";

export const MEDIA_LIMITS: Record<MediaKind, { maxBytes: number; prefix: string }> = {
  avatar: { maxBytes: 1 * 1024 * 1024, prefix: "avatars" },
  banner: { maxBytes: 2 * 1024 * 1024, prefix: "banners" },
};

const ALLOWED = {
  "image/png": { ext: "png", names: ["png"] },
  "image/jpeg": { ext: "jpg", names: ["jpg", "jpeg"] },
  "image/webp": { ext: "webp", names: ["webp"] },
} as const;

function sniff(b: Uint8Array): keyof typeof ALLOWED | null {
  if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export function validateImage(file: { name: string; type: string; size: number }, bytes: Uint8Array, kind: MediaKind) {
  const { maxBytes } = MEDIA_LIMITS[kind];
  if (file.size === 0 || bytes.byteLength === 0) return { ok: false as const, error: "That file is empty." };
  if (bytes.byteLength > maxBytes) return { ok: false as const, error: `Image is too large (max ${maxBytes / 1024 / 1024} MB).` };
  const declared = file.type as keyof typeof ALLOWED;
  const spec = ALLOWED[declared];
  if (!spec) return { ok: false as const, error: "Only PNG, JPEG or WebP images are allowed." };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(spec.names as readonly string[]).includes(ext)) return { ok: false as const, error: "File extension doesn't match the image type." };
  if (sniff(bytes) !== declared) return { ok: false as const, error: "That file isn't a valid image." };
  return { ok: true as const, ext: spec.ext, contentType: declared };
}

export const MEDIA_KEY_RE = /^(avatars|banners)\/[A-Za-z0-9_-]{8,64}\/[a-f0-9-]{36}\.(png|jpg|webp)$/;
