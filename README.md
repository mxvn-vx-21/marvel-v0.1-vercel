# MARVEL.WTF — V0 Foundation

> BECOME THE CHARACTER.

Superhero-themed personal identity platform. **V0 = the foundation**:
`SIGN UP → USERNAME → PROFILE → PUBLISH → SHARE` (`marvel.wtf/username`).

## Stack & key decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Server rendering, server actions, first-class OpenNext/Cloudflare support |
| Styling | **Tailwind CSS v4** + CSS variables for profile themes | No component library; tiny bundle |
| Database | **PostgreSQL** | Relational; constraints enforced in the DB |
| ORM | **Drizzle ORM** + `drizzle-kit` migrations | Pure JS (no Rust engine) → runs natively on Workers; readable SQL migrations |
| Auth | **Better Auth** (email+password, optional Google/GitHub/Discord) | Mature; scrypt hashing, DB sessions, origin/CSRF checks, rate limiting, Workers-compatible. *No home-made crypto.* |
| Hosting | **Vercel (free) or Cloudflare Workers (paid)** | Same code runs on both. Images are stored in Postgres (`media` table); R2 is optional |
| Email | **Resend** over plain `fetch` (optional) | Works on Workers; logs to console when unset |

## Local development

```bash
npm install
cp .env.example .env            # then fill it in (see table below)
createdb marvelwtf              # or any Postgres; set DATABASE_URL accordingly
npm run db:migrate              # applies ./drizzle/*.sql
npm run db:seed                 # OPTIONAL dev data: /demo  (demo@marvel.wtf / demo-password-123)
npm run dev                     # http://localhost:3000
```

Uploads are stored in the Postgres `media` table (shrunk in the browser first).
Emails (reset/verify) are printed to the server console when `RESEND_API_KEY` is empty.

## Environment variables

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `BETTER_AUTH_SECRET` | ✅ | Session/token signing key. `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | Public base URL, no trailing slash (`http://localhost:3000` / `https://marvel.wtf`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Enables "Continue with Google" (button auto-appears when both are set) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | optional | Enables GitHub login |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | optional | Enables Discord login |
| `RESEND_API_KEY` | optional | Sends password-reset + verification emails |
| `EMAIL_FROM` | optional | `"MARVEL.WTF <no-reply@marvel.wtf>"` (domain must be verified in Resend) |
| `REQUIRE_EMAIL_VERIFICATION` | optional | `true` → block login until email is verified (needs `RESEND_API_KEY`) |
| `TRUSTED_ORIGINS` | optional | Comma-separated extra origins allowed to call the auth API |

### OAuth redirect URLs to register with each provider
`{BETTER_AUTH_URL}/api/auth/callback/google` · `…/github` · `…/discord`

## Database

Schema: `src/lib/db/schema.ts`. After changing it:

```bash
npm run db:generate   # writes a new SQL migration to ./drizzle
npm run db:migrate    # applies it
```

| Table | Purpose |
|---|---|
| `user` | **Account**: email, username (unique, lowercase), `role` (USER/ADMIN), `plan` (FREE/PREMIUM) |
| `session`, `account`, `verification`, `rate_limit` | Better Auth internals |
| `profile` | **Public identity** (1:1 with user): displayName, bio, status, avatar/banner **keys**, `themeId`, `visibility` (PUBLISHED/PRIVATE), `config` jsonb |
| `profile_block` | Ordered content blocks (`type` + validated `data` jsonb) |
| `profile_view` | Minimal `profile_view` event: time, referrer host, country. **No IP, UA or user id** |
| `media` | Uploaded avatar/banner bytes (≤ 1 MB / 2 MB, WebP/JPEG/PNG). Unused if R2 is bound |
| `app_rate_limit` | Postgres-backed limiter for our own endpoints |

DB-level guards: `username` CHECK (lowercase + format), unique indexes, cascade deletes.

## Usernames

3–20 chars · `a–z 0–9 _` · must start/end with a letter or digit · no `__` · **case-insensitive**
(stored lowercase; original casing kept in `display_username`) · must not be reserved.
Enforced server-side in one place (`src/lib/username.ts`), mirrored by a DB CHECK.
**Usernames are immutable in V0.**
Reserved list: `src/lib/reserved-usernames.ts` (add to the Set — and add every new top-level route there).

## Architecture

```
User (account) → Profile (identity) → Theme (config) → Blocks (registry) → Renderer → /[username]
```

* `src/lib/themes.ts` – themes are data (colors, radius, typography, effects, animations) → CSS variables. Add a theme = add an object.
* `src/profile/blocks/*` – a block = `{type, zod schema, Component}`; register it in `registry.ts`. Renderer, DB and page need no changes. V0 ships `text` and `links` (rendered from the DB; there is no block editor yet).
* `src/profile/ProfileRenderer.tsx` – theme shell + header + ordered blocks; invalid/unknown blocks are skipped, never crash.
* `src/lib/session.ts` – `requireUser`, `requireOnboardedUser`, `requireRole("ADMIN")`. Identity and role are always re-read from the **database**.
* `src/lib/urls.ts` – all public URL building (so `ctrl.monster/sufi → marvel.wtf/sufi` is a trivial redirect later).
* Future routes (`/comics`, `/comics/[slug]`, `/vault`) are reserved and are simply new folders under `src/app`.

## Security notes

* Better Auth: scrypt password hashes, DB-backed sessions, HttpOnly/SameSite cookies (`Secure` on https), origin/CSRF validation, DB-stored rate limits on sign-in / sign-up / reset.
* Every mutation derives the owner from the **session** — there are no client-supplied user/profile ids (no IDOR).
* `role` / `plan` are `input:false` — clients cannot set them at signup.
* Private profiles return a real **404** server-side (indistinguishable from "doesn't exist"); only the owner sees a private preview. Private/missing pages are `noindex`.
* Uploads: PNG/JPEG/WebP only; MIME + extension + **magic bytes** must agree; 2 MB avatar / 4 MB banner; server-generated UUID keys; stored in the `media` table (or R2 if a `MEDIA` bucket is bound); served with `nosniff` + sandbox CSP; SVG rejected; same-origin check on upload endpoints.
* User text is plain text (React-escaped); control/bidi characters stripped; link blocks accept `http(s)` only.
* User-facing errors are generic; DB errors are logged server-side only.
* Security headers in `next.config.ts`.
* Rate limits: auth endpoints (Better Auth), username check, uploads, profile saves.

## Production deployment

### Option A — Vercel (free, no card, all in the browser) ← recommended if you have no paid Cloudflare plan
1. **Neon**: create a project → SQL Editor → paste & run `neon-setup.sql` (creates all tables).
2. **GitHub**: upload this project to a private repo (do NOT upload `.env`).
3. **Vercel**: *Add New → Project → import the repo*. Add environment variables:
   `DATABASE_URL` (Neon **pooled** string), `BETTER_AUTH_SECRET` (32+ random chars), `BETTER_AUTH_URL` (`https://marvel.wtf`).
   Optional: OAuth keys, `RESEND_API_KEY`, `EMAIL_FROM` (see table above). Deploy.
4. **Domain**: Vercel → Project → Settings → Domains → add `marvel.wtf`, then create the DNS records Vercel shows in Cloudflare DNS (set the proxy to **DNS only / grey cloud**).

### Option B — Cloudflare Workers (needs the **Workers Paid** plan, $5/mo)
Password hashing (scrypt) uses ~140 ms of CPU per login/signup, which exceeds the 10 ms/request limit of the free Workers plan. On Workers Paid it is fine (bundle is ~1.7 MiB gzipped).
1. Neon + `neon-setup.sql` as above (use the **non-pooled** string for Hyperdrive).
2. Cloudflare → Hyperdrive → create a config from the Neon string; put its id in `wrangler.jsonc`.
3. Workers & Pages → import the GitHub repo. Name `marvel-wtf`, build `npx opennextjs-cloudflare build`, deploy `npx opennextjs-cloudflare deploy`, build variable `BETTER_AUTH_URL`.
4. Add `BETTER_AUTH_SECRET` (+ other secrets) under the Worker's Variables and Secrets; add the custom domain.
5. Optional: bind an R2 bucket named `MEDIA` and avatars/banners move to R2 automatically.

Never run `db:seed` in production (it refuses unless `ALLOW_SEED=true`).

## Not in V0 (by design)

Stripe/payments · Premium UI · block/profile builder · comics · marketplace · AI · custom domains · admin panel · analytics dashboard · teams · feed.
The architecture (roles, plan column, block registry, themes, view events, reserved routes) is ready for
**V1 Builder → V2 Premium → V3 Comics → V4 Discovery → V5 AI → V6 Creator ecosystem**.

## Notes & limitations

* Fonts are system stacks (no external font download). Swap in `next/font` once a brand typeface is chosen.
* `/[username]` intentionally has no `loading.tsx`: a Suspense boundary makes Next stream a 200 before `notFound()`, turning missing/private profiles into soft-404s. Dashboard/settings do have skeletons, with the auth gate in their layouts so anonymous requests still get a real 307.
* Public profiles render dynamically (the DB is the source of truth). Add Cloudflare edge caching later if traffic requires it.
* Avatar/banner URLs are unguessable but not access-controlled, even for private profiles.
* `/logout` is a confirm page (button → POST), not a GET side-effect, so it can't be triggered cross-site.
