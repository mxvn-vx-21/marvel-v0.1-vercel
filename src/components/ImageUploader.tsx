"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert, Button } from "./ui";

const MAX_DIM = { avatar: 512, banner: 1500 } as const;

/** Shrink in the browser (canvas → WebP/JPEG) so uploads are small. Falls back to the original file. */
async function shrink(file: File, kind: "avatar" | "banner"): Promise<File> {
  try {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM[kind] / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.86));
    if (!blob || blob.size >= file.size && scale === 1) return file;
    const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
    return new File([blob], `${kind}.${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}

export function ImageUploader({ kind, currentUrl, label, initial, hint }: { kind: "avatar" | "banner"; currentUrl: string | null; label: string; initial: string; hint: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(currentUrl);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload(file: File) {
    setBusy("upload");
    setMsg(null);
    const body = new FormData();
    body.set("file", await shrink(file, kind));
    try {
      const res = await fetch(`/api/upload/${kind}`, { method: "POST", body });
      const j = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!j.ok) setMsg({ ok: false, text: j.error ?? "Upload failed." });
      else { setUrl(j.url ?? null); setMsg({ ok: true, text: `${label} updated.` }); router.refresh(); }
    } catch {
      setMsg({ ok: false, text: "Upload failed. Check your connection and try again." });
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy("remove");
    setMsg(null);
    try {
      const res = await fetch(`/api/upload/${kind}`, { method: "DELETE" });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (!j.ok) setMsg({ ok: false, text: j.error ?? "Couldn't remove it." });
      else { setUrl(null); setMsg({ ok: true, text: `${label} removed.` }); router.refresh(); }
    } finally { setBusy(null); }
  }

  const round = kind === "avatar";
  return (
    <div className="space-y-2">
      <span className="block text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      <div className="flex items-center gap-4">
        <div className={`grid shrink-0 place-items-center overflow-hidden border-2 border-line bg-ink font-display text-2xl text-hero ${round ? "size-20 rounded-full" : "h-20 w-40 rounded-lg"}`}>
          {url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={`Current ${label.toLowerCase()}`} className="size-full object-cover" /> : <span aria-hidden>{round ? initial : "▭"}</span>}
        </div>
        <div className="space-y-2">
          <input ref={input} id={`${kind}-file`} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" loading={busy === "upload"} disabled={busy !== null} onClick={() => input.current?.click()}>
              {busy === "upload" ? "Uploading…" : url ? "Replace" : "Upload"}
            </Button>
            {url && <Button type="button" variant="danger" loading={busy === "remove"} disabled={busy !== null} onClick={remove}>Remove</Button>}
          </div>
          <p className="text-xs text-mute">{hint}</p>
        </div>
      </div>
      {msg && <Alert kind={msg.ok ? "success" : "error"}>{msg.text}</Alert>}
    </div>
  );
}
