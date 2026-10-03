import { sql } from "drizzle-orm";
import {
  bigint,
  customType,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType: () => "bytea",
  toDriver: (v) => v,
  fromDriver: (v) => (v instanceof Uint8Array ? v : new Uint8Array(v as ArrayBufferLike)),
});

/* ── Enums ─────────────────────────────────────────────────── */
export const roleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const planEnum = pgEnum("user_plan", ["FREE", "PREMIUM"]);
export const visibilityEnum = pgEnum("profile_visibility", ["PUBLISHED", "PRIVATE"]);

/* ── Auth tables (shape required by Better Auth) ───────────────
   `user` = the ACCOUNT. Presentation lives in `profile`.          */
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    // Canonical, lowercase handle. NULL until an OAuth user claims one.
    username: text("username").unique(),
    // Original casing as typed ("Sufi"); purely cosmetic.
    displayUsername: text("display_username"),
    role: roleEnum("role").notNull().default("USER"),
    plan: planEnum("plan").notNull().default("FREE"),
  },
  (t) => [
    // Defence in depth: the DB itself refuses non-canonical usernames.
    check("user_username_canonical", sql`${t.username} IS NULL OR (${t.username} = lower(${t.username}) AND ${t.username} ~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$')`),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/** Better Auth's built-in limiter storage (auth endpoints). Model name must be `rateLimit`. */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* ── App tables ────────────────────────────────────────────── */

/** Public identity. 1:1 with user. */
export const profile = pgTable(
  "profile",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull().default(""),
    status: text("status").notNull().default(""),
    avatarKey: text("avatar_key"), // object-storage key, never raw bytes
    bannerKey: text("banner_key"),
    themeId: text("theme_id").notNull().default("default-dark"),
    visibility: visibilityEnum("visibility").notNull().default("PRIVATE"),
    /** Future profile-wide settings (theme overrides, layout, SEO…) without migrations. */
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("profile_user_unique").on(t.userId),
    check("profile_bio_len", sql`char_length(${t.bio}) <= 500`),
  ],
);

/** Ordered content blocks rendered by the block registry (text, links, music, …). */
export const profileBlock = pgTable(
  "profile_block",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    profileId: text("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    position: integer("position").notNull().default(0),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    visible: boolean("visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("profile_block_order_idx").on(t.profileId, t.position)],
);

/** Minimal analytics event. No IP, no user-agent, no user id — only what future analytics need. */
export const profileView = pgTable(
  "profile_view",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    profileId: text("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
    event: text("event").notNull().default("profile_view"),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
    referrerHost: text("referrer_host"),
    country: text("country"),
  },
  (t) => [index("profile_view_profile_time_idx").on(t.profileId, t.viewedAt)],
);

/**
 * Uploaded images (avatars/banners). Images are shrunk client-side and capped server-side
 * (<= 2 MB), so they stay small. If an R2 bucket named MEDIA is bound, storage.ts uses R2 instead
 * and this table is simply unused — the rest of the app only deals in keys.
 */
export const media = pgTable(
  "media",
  {
    key: text("key").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_user_idx").on(t.userId)],
);

/** Fixed-window limiter for our own endpoints (username check, uploads, profile saves). */
export const appRateLimit = pgTable("app_rate_limit", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type ProfileBlock = typeof profileBlock.$inferSelect;
