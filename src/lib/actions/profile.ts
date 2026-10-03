"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getOwnProfile, getCurrentUser, requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { isThemeId } from "@/lib/themes";
import { TAKEN_MESSAGE, validateUsername } from "@/lib/username";
import { deleteObject } from "@/lib/storage";

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> };

// Strip control chars + bidi overrides (spoofing) from user text. React escapes HTML on output.
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;
const clean = (s: string) => s.replace(CTRL, "").normalize("NFC");
const oneLine = (s: string) => clean(s).replace(/\s+/g, " ").trim();

const profileSchema = z.object({
  displayName: z.string().transform(oneLine).pipe(z.string().min(1, "Display name is required.").max(50, "Max 50 characters.")),
  bio: z.string().transform((s) => clean(s).replace(/\r\n/g, "\n").trim()).pipe(z.string().max(280, "Bio can be at most 280 characters.")),
  status: z.string().transform(oneLine).pipe(z.string().max(80, "Status can be at most 80 characters.")),
  themeId: z.string().refine(isThemeId, "Unknown theme."),
});

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const rl = await rateLimit(`profile-save:${user.id}`, 30, 60);
  if (!rl.ok) return { message: `Slow down — try again in ${rl.retryAfter}s.` };

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    bio: formData.get("bio") ?? "",
    status: formData.get("status") ?? "",
    themeId: formData.get("themeId") ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Fix the highlighted fields." };

  try {
    // Ownership is derived from the SESSION — there is no client-supplied id to tamper with (no IDOR).
    const res = await getDb()
      .update(schema.profile)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.profile.userId, user.id))
      .returning({ id: schema.profile.id });
    if (res.length === 0) {
      // Profile row missing (should never happen) → create it, then apply the edit.
      await getOwnProfile(user);
      await getDb().update(schema.profile).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.profile.userId, user.id));
    }
  } catch (e) {
    console.error("[updateProfile]", e);
    return { message: "Couldn't save your profile. Please try again." };
  }
  revalidatePath("/dashboard");
  return { ok: true, message: "Profile saved." };
}

export async function setPublished(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.username) redirect("/onboarding");
  const publish = formData.get("publish") === "true";
  try {
    await getDb()
      .update(schema.profile)
      .set({ visibility: publish ? "PUBLISHED" : "PRIVATE", publishedAt: publish ? new Date() : null, updatedAt: new Date() })
      .where(eq(schema.profile.userId, user.id));
  } catch (e) {
    console.error("[setPublished]", e);
    return { message: "Couldn't update visibility. Please try again." };
  }
  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);
  return { ok: true, message: publish ? "Profile published." : "Profile is now private." };
}

/** For accounts that have no username yet (social-login signups). Username is immutable once set. */
export async function claimUsername(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/onboarding");
  if (user.username) redirect("/dashboard");
  const rl = await rateLimit(`claim:${user.id}`, 10, 60);
  if (!rl.ok) return { message: `Slow down — try again in ${rl.retryAfter}s.` };

  const raw = String(formData.get("username") ?? "");
  const v = validateUsername(raw);
  if (!v.ok) return { errors: { username: v.message } };

  try {
    const res = await getDb()
      .update(schema.user)
      .set({ username: v.username, displayUsername: raw.trim(), updatedAt: new Date() })
      .where(and(eq(schema.user.id, user.id), isNull(schema.user.username)))
      .returning({ id: schema.user.id });
    if (res.length === 0) redirect("/dashboard");
  } catch (e) {
    if (isUniqueViolation(e)) return { errors: { username: TAKEN_MESSAGE } };
    if (isRedirect(e)) throw e;
    console.error("[claimUsername]", e);
    return { message: "Couldn't save that username. Please try again." };
  }
  redirect("/dashboard");
}

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?reason=unauthorized&next=/settings");
  const expected = user.username ?? "DELETE";
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== expected.toLowerCase())
    return { errors: { confirm: `Type "${expected}" to confirm.` } };

  try {
    const db = getDb();
    const [p] = await db.select().from(schema.profile).where(eq(schema.profile.userId, user.id)).limit(1);
    await getAuth().api.signOut({ headers: await headers() }).catch(() => null);
    await db.delete(schema.user).where(eq(schema.user.id, user.id)); // cascades: profile, blocks, views, sessions, accounts
    await Promise.all([deleteObject(p?.avatarKey), deleteObject(p?.bannerKey)]);
  } catch (e) {
    console.error("[deleteAccount]", e);
    return { message: "Couldn't delete your account. Please try again." };
  }
  redirect("/?deleted=1");
}

function isUniqueViolation(e: unknown): boolean {
  const any = e as { code?: string; cause?: { code?: string } };
  return any?.code === "23505" || any?.cause?.code === "23505";
}
function isRedirect(e: unknown): boolean {
  return typeof (e as { digest?: string })?.digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT");
}
