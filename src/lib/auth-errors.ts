/** Map Better Auth error codes/messages → copy that never leaks internals. */
export function friendlyAuthError(err: { code?: string; message?: string; status?: number } | null | undefined): string {
  if (!err) return "Something went wrong. Please try again.";
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  if (err.status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (code.includes("USERNAME_IS_ALREADY_TAKEN") || msg.includes("username is already taken")) return "That username is already in use.";
  if (code.includes("USER_ALREADY_EXISTS") || msg.includes("already exists")) return "An account with that email already exists.";
  if (code.includes("INVALID_USERNAME") || code.includes("USERNAME_TOO")) return "Choose a different username.";
  if (code.includes("INVALID_EMAIL_OR_PASSWORD") || code.includes("INVALID_USERNAME_OR_PASSWORD") || code.includes("INVALID_PASSWORD") || msg.includes("invalid"))
    return "Incorrect email/username or password.";
  if (code.includes("EMAIL_NOT_VERIFIED")) return "Please verify your email first — check your inbox.";
  if (code.includes("PASSWORD_TOO_SHORT")) return "Password must be at least 8 characters.";
  if (code.includes("PASSWORD_TOO_LONG")) return "Password is too long (max 128).";
  if (code.includes("INVALID_TOKEN")) return "This link is invalid or has expired. Request a new one.";
  return "Something went wrong. Please try again.";
}
