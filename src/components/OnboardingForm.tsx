"use client";
import { useActionState, useState } from "react";
import { claimUsername, type ActionState } from "@/lib/actions/profile";
import { Alert, Button } from "./ui";
import { UsernameField } from "./UsernameField";

export function OnboardingForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(claimUsername, {});
  const [username, setUsername] = useState("");
  return (
    <form action={action} className="space-y-4">
      {state.message && <Alert kind="error">{state.message}</Alert>}
      <UsernameField value={username} onChange={setUsername} serverError={state.errors?.username} autoFocus />
      <Button type="submit" loading={pending} className="w-full">{pending ? "Claiming…" : "Claim username"}</Button>
      <p className="text-xs text-mute">Usernames are permanent in V0, so choose wisely.</p>
    </form>
  );
}
