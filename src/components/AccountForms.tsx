"use client";
import { useActionState, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { friendlyAuthError } from "@/lib/auth-errors";
import { deleteAccount, type ActionState } from "@/lib/actions/profile";
import { Alert, Button, Field, Input } from "./ui";

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setPending(true);
    setMsg(null);
    const res = await authClient.changePassword({
      currentPassword: String(f.get("current") ?? ""),
      newPassword: String(f.get("next") ?? ""),
      revokeOtherSessions: true,
    });
    setPending(false);
    if (res.error) return setMsg({ ok: false, text: friendlyAuthError(res.error) });
    form.reset();
    setMsg({ ok: true, text: "Password changed. Other devices were logged out." });
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {msg && <Alert kind={msg.ok ? "success" : "error"}>{msg.text}</Alert>}
      <Field label="Current password" id="current"><Input id="current" name="current" type="password" required autoComplete="current-password" /></Field>
      <Field label="New password" id="next" hint="At least 8 characters."><Input id="next" name="next" type="password" required minLength={8} maxLength={128} autoComplete="new-password" aria-describedby="next-hint" /></Field>
      <Button type="submit" loading={pending}>{pending ? "Updating…" : "Change password"}</Button>
      <p className="text-xs text-mute">Signed up with Google, GitHub or Discord? You have no password to change.</p>
    </form>
  );
}

export function DeleteAccountForm({ confirmWord }: { confirmWord: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-zinc-300">This permanently deletes your account, profile and uploads. It cannot be undone.</p>
      {state.message && <Alert kind="error">{state.message}</Alert>}
      <Field label={`Type “${confirmWord}” to confirm`} id="confirm" error={state.errors?.confirm}>
        <Input id="confirm" name="confirm" required autoComplete="off" autoCapitalize="none" spellCheck={false} />
      </Field>
      <Button type="submit" variant="danger" loading={pending}>{pending ? "Deleting…" : "Delete my account"}</Button>
    </form>
  );
}
