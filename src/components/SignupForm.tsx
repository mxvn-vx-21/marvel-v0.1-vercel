"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { friendlyAuthError } from "@/lib/auth-errors";
import { validateUsername } from "@/lib/username";
import { Alert, Button, Field, Input } from "./ui";
import { UsernameField } from "./UsernameField";

export function SignupForm({ initialUsername }: { initialUsername: string }) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUsernameError(undefined);
    const v = validateUsername(username);
    if (!v.ok) return setUsernameError(v.message);

    setPending(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const displayName = String(f.get("displayName") ?? "").trim() || username.trim();

    const res = await authClient.signUp.email({
      email,
      password,
      name: displayName.slice(0, 50),
      username: v.username,
      displayUsername: username.trim(),
    });
    if (res.error) {
      const msg = friendlyAuthError(res.error);
      if (msg.includes("username")) setUsernameError(msg);
      else setError(msg);
      setPending(false);
      return;
    }
    if (!res.data?.token) {
      setNotice("Account created! Check your email to verify your address, then log in.");
      setPending(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  if (notice) return <Alert kind="success">{notice}</Alert>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert kind="error">{error}</Alert>}
      <UsernameField value={username} onChange={setUsername} serverError={usernameError} autoFocus={!initialUsername} />
      <Field label="Display name (optional)" id="displayName">
        <Input id="displayName" name="displayName" maxLength={50} autoComplete="nickname" placeholder="Your hero name" />
      </Field>
      <Field label="Email" id="email">
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password" id="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" aria-describedby="password-hint" />
      </Field>
      <Button type="submit" loading={pending} className="w-full">{pending ? "Creating account…" : "Create account"}</Button>
    </form>
  );
}
