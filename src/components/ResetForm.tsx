"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { friendlyAuthError } from "@/lib/auth-errors";
import { Alert, Button, Field, Input } from "./ui";

export function ResetForm({ token }: { token: string }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const newPassword = String(new FormData(e.currentTarget).get("password") ?? "");
    const res = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (res.error) return setError(friendlyAuthError(res.error));
    setDone(true);
  }

  if (!token) return <Alert kind="error">This link is invalid or has expired. <Link href="/forgot-password" className="underline">Request a new one.</Link></Alert>;
  if (done) return <Alert kind="success">Password updated. <Link href="/login" className="underline">Log in</Link></Alert>;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert kind="error">{error}</Alert>}
      <Field label="New password" id="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" aria-describedby="password-hint" />
      </Field>
      <Button type="submit" loading={pending} className="w-full">{pending ? "Saving…" : "Set new password"}</Button>
    </form>
  );
}
