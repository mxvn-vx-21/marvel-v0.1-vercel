import "server-only";
import { cache } from "react";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { getDb, schema } from "./db";
import { actionEmail, emailConfigured, sendEmail } from "./email";
import { USERNAME_MAX, USERNAME_MIN, validateUsername } from "./username";
import { appUrl } from "./urls";

function socialProviders() {
  const p: Record<string, { clientId: string; clientSecret: string }> = {};
  const env = process.env;
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    p.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
    p.github = { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET };
  if (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET)
    p.discord = { clientId: env.DISCORD_CLIENT_ID, clientSecret: env.DISCORD_CLIENT_SECRET };
  return p;
}

/** Which social buttons the UI should show (only providers with real credentials). */
export function enabledSocialProviders(): ("google" | "github" | "discord")[] {
  return Object.keys(socialProviders()) as ("google" | "github" | "discord")[];
}

function build() {
  const db = getDb();
  const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === "true" && emailConfigured();

  return betterAuth({
    appName: "MARVEL.WTF",
    baseURL: appUrl(),
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    database: drizzleAdapter(db, { provider: "pg", schema }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: requireVerification,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const m = actionEmail("RESET YOUR PASSWORD", "Use the button below to choose a new password. The link expires in 1 hour.", "Reset password", url);
        await sendEmail({ to: user.email, subject: "Reset your MARVEL.WTF password", ...m });
      },
    },

    emailVerification: {
      sendOnSignUp: emailConfigured(),
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const m = actionEmail("VERIFY YOUR EMAIL", "Confirm your email address to secure your MARVEL.WTF account.", "Verify email", url);
        await sendEmail({ to: user.email, subject: "Verify your MARVEL.WTF email", ...m });
      },
    },

    socialProviders: socialProviders(),
    account: { accountLinking: { enabled: true, trustedProviders: ["google", "github", "discord"] } },

    user: {
      additionalFields: {
        // input:false → clients can NEVER set these; only server code can.
        role: { type: "string", required: false, defaultValue: "USER", input: false },
        plan: { type: "string", required: false, defaultValue: "FREE", input: false },
      },
    },

    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },

    plugins: [
      username({
        minUsernameLength: USERNAME_MIN,
        maxUsernameLength: USERNAME_MAX,
        usernameNormalization: (u) => u.normalize("NFKC").trim().toLowerCase(),
        // Enforces charset + reserved names on every signup/update path, server-side.
        usernameValidator: (u) => validateUsername(u).ok,
      }),
      nextCookies(), // must be last
    ],

    rateLimit: {
      enabled: true, // also in dev, so it's tested
      storage: "database", // shared across Workers isolates
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 8 },
        "/sign-in/username": { window: 60, max: 8 },
        "/sign-up/email": { window: 60, max: 6 },
        "/request-password-reset": { window: 300, max: 3 },
        "/reset-password": { window: 300, max: 6 },
        "/send-verification-email": { window: 300, max: 3 },
      },
    },

    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production" && appUrl().startsWith("https://"),
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"] },
    },

    databaseHooks: {
      user: {
        create: {
          // Every account gets its (private) profile row in the same flow.
          after: async (u) => {
            const handle = (u as { displayUsername?: string | null }).displayUsername;
            await db
              .insert(schema.profile)
              .values({ userId: u.id, displayName: (handle || u.name || "Hero").slice(0, 50) })
              .onConflictDoNothing({ target: schema.profile.userId });
          },
        },
      },
    },
  });
}

/** One instance per request on Workers (I/O isolation), process-wide in Node. */
const perRequest = cache(build);
const g = globalThis as unknown as { __marvelAuth?: ReturnType<typeof build> };
export function getAuth() {
  const isWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
  return isWorkers ? perRequest() : (g.__marvelAuth ??= build());
}
