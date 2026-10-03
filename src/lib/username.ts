import { isReservedUsername } from "./reserved-usernames";

/**
 * USERNAME RULES (single source of truth — used by signup, onboarding, availability API,
 * the Better Auth validator, and mirrored by a DB CHECK constraint):
 *   • 3–20 characters
 *   • lowercase a–z, digits 0–9, underscore
 *   • must start and end with a letter or digit
 *   • no consecutive underscores
 *   • case-insensitive: "Sufi" and "sufi" are the same name (stored lowercase)
 *   • not in the reserved list
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
const SHAPE = /^[a-z0-9][a-z0-9_]*[a-z0-9]$/;

export type UsernameCheck =
  | { ok: true; username: string }
  | { ok: false; reason: "too_short" | "too_long" | "invalid_chars" | "reserved"; message: string };

export function normalizeUsername(input: string): string {
  return input.normalize("NFKC").trim().toLowerCase();
}

export function validateUsername(input: string): UsernameCheck {
  const username = normalizeUsername(input);
  if (username.length < USERNAME_MIN)
    return { ok: false, reason: "too_short", message: `Use at least ${USERNAME_MIN} characters.` };
  if (username.length > USERNAME_MAX)
    return { ok: false, reason: "too_long", message: `Use at most ${USERNAME_MAX} characters.` };
  if (!SHAPE.test(username) || username.includes("__"))
    return {
      ok: false,
      reason: "invalid_chars",
      message: "Choose a different username. Use letters, numbers and single underscores; start and end with a letter or number.",
    };
  if (isReservedUsername(username))
    return { ok: false, reason: "reserved", message: "Choose a different username." };
  return { ok: true, username };
}

export const TAKEN_MESSAGE = "That username is already in use.";
