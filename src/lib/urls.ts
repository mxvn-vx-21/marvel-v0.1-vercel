/** Central place for building public URLs (so ctrl.monster redirects etc. stay trivial later). */
export function appUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function profilePath(username: string): string {
  return `/${username}`;
}

export function profileUrl(username: string): string {
  return `${appUrl()}${profilePath(username)}`;
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
