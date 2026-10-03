"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { friendlyAuthError } from "@/lib/auth-errors";
import { Alert, Button, Field, Input } from "./ui";

export function ForgotForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    const res = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setPending(false);
    // Same message whether or not the account exists (no account enumeration).
    if (res.error && res.error.status === 429) return setError(friendlyAuthError(res.error));
    setDone(true);
  }

  if (done) return <Alert kind="success">If an account exists for that email, a reset link is on its way.</Alert>;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert kind="error">{error}</Alert>}
      <Field label="Email" id="email"><Input id="email" name="email" type="email" required autoComplete="email" /></Field>
      <Button type="submit" loading={pending} className="w-full">{pending ? "Sending…" : "Send reset link"}</Button>
    </form>
  );
}
