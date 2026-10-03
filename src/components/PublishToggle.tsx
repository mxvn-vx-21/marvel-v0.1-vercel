"use client";
import { useActionState } from "react";
import { setPublished, type ActionState } from "@/lib/actions/profile";
import { Alert, Button } from "./ui";

export function PublishToggle({ published }: { published: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setPublished, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="publish" value={published ? "false" : "true"} />
      {state.message && <Alert kind={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <Button type="submit" loading={pending} variant={published ? "ghost" : "primary"}>
        {pending ? "Updating…" : published ? "Make private" : "Publish profile"}
      </Button>
    </form>
  );
}
