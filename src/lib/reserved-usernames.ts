/**
 * Names that can never be claimed as a username.
 * Add anything new here — it is enforced everywhere via `validateUsername`.
 * RULE OF THUMB: whenever you add a top-level route (e.g. /vault), add it here first.
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // required baseline
  "admin", "api", "login", "logout", "signup", "register", "dashboard", "settings",
  "profile", "profiles", "premium", "comics", "comic", "explore", "discover", "help",
  "support", "about", "terms", "privacy", "status", "assets", "static", "cdn", "www", "mail",

  // auth / account routes
  "forgot-password", "forgotpassword", "reset-password", "resetpassword", "verify-email",
  "verify", "onboarding", "signin", "sign-in", "sign-up", "auth", "account", "accounts",
  "me", "user", "users", "u",

  // planned product routes
  "vault", "marketplace", "market", "store", "shop", "themes", "theme", "widgets", "blocks",
  "creators", "creator", "trending", "search", "pricing", "billing", "checkout", "upgrade",
  "analytics", "stats", "badges", "badge", "feed", "home", "new", "create", "edit", "editor",

  // infrastructure
  "app", "web", "ftp", "smtp", "imap", "pop", "ns1", "ns2", "dns", "cname", "mx",
  "docs", "blog", "news", "press", "careers", "jobs", "contact", "legal", "dmca", "abuse",
  "security", "report", "webhook", "webhooks", "oauth", "callback", "_next", "next",
  "favicon.ico", "robots.txt", "sitemap.xml", "manifest.json", "well-known",

  // brand / impersonation
  "marvel", "marvelwtf", "marvel-wtf", "wtf", "ctrl", "monster", "ctrlmonster", "dynamyte",
  "official", "staff", "team", "moderator", "mod", "mods", "root", "system", "sysadmin",
  "administrator", "owner", "founder", "ceo", "anthropic", "claude",

  // generic dangerous / confusing
  "null", "undefined", "none", "true", "false", "anonymous", "everyone", "here", "test",
]);

export function isReservedUsername(normalized: string): boolean {
  return RESERVED_USERNAMES.has(normalized);
}
