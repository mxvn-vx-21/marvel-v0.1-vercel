import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { ProfileRenderer } from "@/profile/ProfileRenderer";
import { getDb, schema } from "@/lib/db";
import { loadProfileByUsername } from "@/lib/profile-queries";
import { getCurrentUser } from "@/lib/session";
import { profileUrl } from "@/lib/urls";

type Props = { params: Promise<{ username: string }> };

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|monitor|curl|wget/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const loaded = await loadProfileByUsername(decodeURIComponent(username));
  // Private/missing profiles: generic title, never indexed, nothing leaked.
  if (!loaded || loaded.visibility !== "PUBLISHED") {
    return { title: "Profile not found — MARVEL.WTF", robots: { index: false, follow: false } };
  }
  const p = loaded.data;
  const title = `${p.displayName} — MARVEL.WTF`;
  const description = p.bio ? p.bio.slice(0, 160) : `${p.displayName} (@${p.username}) on MARVEL.WTF. Become the character.`;
  const url = profileUrl(p.username);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { title, description, url, type: "profile", siteName: "MARVEL.WTF", images: p.avatarUrl ? [{ url: p.avatarUrl, width: 128, height: 128 }] : undefined },
    twitter: { card: "summary", title, description, images: p.avatarUrl ? [p.avatarUrl] : undefined },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username: rawParam } = await params;
  const raw = decodeURIComponent(rawParam);

  // Canonical lowercase URL (so /Sufi → /sufi). Only for well-formed names.
  if (raw !== raw.toLowerCase() && /^[A-Za-z0-9_]+$/.test(raw)) redirect(`/${raw.toLowerCase()}`);

  const loaded = await loadProfileByUsername(raw);
  if (!loaded) notFound();

  let preview = false;
  if (loaded.visibility !== "PUBLISHED") {
    // Visibility is enforced HERE, on the server. Only the owner may see a private profile.
    const viewer = await getCurrentUser();
    if (viewer?.id !== loaded.userId) notFound();
    preview = true;
  }

  if (!preview) {
    const h = await headers();
    if (!BOT.test(h.get("user-agent") ?? "")) {
      const db = getDb();
      let referrerHost: string | null = null;
      try { referrerHost = h.get("referer") ? new URL(h.get("referer")!).host : null; } catch { /* ignore */ }
      const country = (h.get("cf-ipcountry") ?? "").slice(0, 2).toUpperCase() || null;
      // Fire-and-forget after the response is sent; analytics must never break rendering.
      after(async () => {
        try { await db.insert(schema.profileView).values({ profileId: loaded.profileId, referrerHost, country }); }
        catch (e) { console.error("[profile_view]", e); }
      });
    }
  }

  return <ProfileRenderer profile={loaded.data} preview={preview} />;
}
