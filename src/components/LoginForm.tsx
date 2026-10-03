"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { friendlyAuthError } from "@/lib/auth-errors";
import { Alert, Button, Field, Input } from "./ui";

export function LoginForm({ next, unauthorized }: { next: string; unauthorized: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const f = new FormData(e.currentTarget);
    const id = String(f.get("identifier") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const res = id.includes("@")
      ? await authClient.signIn.email({ email: id, password })
      : await authClient.signIn.username({ username: id, password });
    if (res.error) {
      setError(friendlyAuthError(res.error));
      setPending(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      {unauthorized && !error && <Alert kind="info">You need to log in to access this page.</Alert>}
      {error && <Alert kind="error">{error}</Alert>}
      <Field label="Email or username" id="identifier">
        <Input id="identifier" name="identifier" required autoComplete="username" autoCapitalize="none" spellCheck={false} />
      </Field>
      <Field label="Password" id="password">
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </Field>
      <div className="text-right text-sm"><Link href="/forgot-password" className="text-spark hover:underline">Forgot password?</Link></div>
      <Button type="submit" loading={pending} className="w-full">{pending ? "Logging in…" : "Log in"}</Button>
    </form>
  );
}
