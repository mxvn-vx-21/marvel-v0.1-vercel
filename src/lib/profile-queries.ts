import "server-only";
import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { mediaUrl } from "./storage";
import { normalizeUsername, validateUsername } from "./username";
import type { PublicProfileData } from "@/profile/types";

export interface LoadedProfile {
  data: PublicProfileData;
  userId: string;
  profileId: string;
  visibility: "PUBLISHED" | "PRIVATE";
  updatedAt: Date;
}

/** Look up by username (any visibility). Callers MUST enforce visibility/ownership. */
async function load(raw: string): Promise<LoadedProfile | null> {
  const username = normalizeUsername(raw);
  if (!validateUsername(username).ok) return null; // also protects the DB from junk lookups
  const db = getDb();
  const [row] = await db
    .select({ u: schema.user, p: schema.profile })
    .from(schema.user)
    .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
    .where(eq(schema.user.username, username))
    .limit(1);
  if (!row) return null;

  const blocks = await db
    .select({ id: schema.profileBlock.id, type: schema.profileBlock.type, data: schema.profileBlock.data, position: schema.profileBlock.position })
    .from(schema.profileBlock)
    .where(and(eq(schema.profileBlock.profileId, row.p.id), eq(schema.profileBlock.visible, true)))
    .orderBy(asc(schema.profileBlock.position));

  return {
    userId: row.u.id,
    profileId: row.p.id,
    visibility: row.p.visibility,
    updatedAt: row.p.updatedAt,
    data: {
      username: row.u.username!,
      displayName: row.p.displayName,
      bio: row.p.bio,
      status: row.p.status,
      avatarUrl: mediaUrl(row.p.avatarKey),
      bannerUrl: mediaUrl(row.p.bannerKey),
      themeId: row.p.themeId,
      blocks,
    },
  };
}

/** Request-scoped memo so generateMetadata + page share one DB round-trip. */
export const loadProfileByUsername = cache(load);
