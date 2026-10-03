import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuth } from "./auth";
import { getDb, schema } from "./db";
import type { Profile } from "./db/schema";

/** Raw Better Auth session (or null). Cached per request. */
export const getSession = cache(async () => {
  return getAuth().api.getSession({ headers: await headers() });
});

export type AppUser = {
  id: string;
  email: string;
  name: string;
  username: string | null;
  displayUsername: string | null;
  role: "USER" | "ADMIN";
  plan: "FREE" | "PREMIUM";
  createdAt: Date;
  emailVerified: boolean;
};

/**
 * Authoritative current user, loaded from the DATABASE (not from a cookie claim),
 * so role/plan changes and deletions take effect immediately.
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const s = await getSession();
  if (!s) return null;
  const [row] = await getDb().select().from(schema.user).where(eq(schema.user.id, s.user.id)).limit(1);
  return row ?? null;
});

/** Pages: redirects to /login with the "need to log in" notice. */
export async function requireUser(next = "/dashboard"): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?reason=unauthorized&next=${encodeURIComponent(next)}`);
  return user;
}

/** Pages that need a claimed username (everything except /onboarding). */
export async function requireOnboardedUser(next = "/dashboard") {
  const user = await requireUser(next);
  if (!user.username) redirect("/onboarding");
  return user as AppUser & { username: string };
}

/** Role gate — foundation for the future admin panel. Always server-side, always from the DB. */
export async function requireRole(role: "ADMIN") {
  const user = await requireUser("/dashboard");
  if (user.role !== role) redirect("/dashboard");
  return user;
}

/** Fetch (or lazily create) the caller's profile. Only ever keyed by the SESSION user id. */
export async function getOwnProfile(user: AppUser): Promise<Profile> {
  const db = getDb();
  const [existing] = await db.select().from(schema.profile).where(eq(schema.profile.userId, user.id)).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(schema.profile)
    .values({ userId: user.id, displayName: (user.displayUsername || user.name || "Hero").slice(0, 50) })
    .onConflictDoNothing({ target: schema.profile.userId })
    .returning();
  if (created) return created;
  const [again] = await db.select().from(schema.profile).where(eq(schema.profile.userId, user.id)).limit(1);
  return again!;
}
