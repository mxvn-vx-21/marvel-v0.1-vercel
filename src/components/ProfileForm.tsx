"use client";
import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/lib/actions/profile";
import { THEME_LIST } from "@/lib/themes";
import { Alert, Button, Field, Input, Select, Textarea, describedBy } from "./ui";

export function ProfileForm({ initial }: { initial: { displayName: string; bio: string; status: string; themeId: string } }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      {state.ok && <Alert kind="success">{state.message}</Alert>}
      {!state.ok && state.message && <Alert kind="error">{state.message}</Alert>}

      <Field label="Display name" id="displayName" error={e.displayName}>
        <Input id="displayName" name="displayName" defaultValue={initial.displayName} required maxLength={50} aria-invalid={Boolean(e.displayName)} aria-describedby={describedBy("displayName", false, Boolean(e.displayName))} />
      </Field>
      <Field label="Status" id="status" hint="A short line shown under your name." error={e.status}>
        <Input id="status" name="status" defaultValue={initial.status} maxLength={80} placeholder="Saving the multiverse…" aria-invalid={Boolean(e.status)} aria-describedby={describedBy("status", true, Boolean(e.status))} />
      </Field>
      <Field label="Bio" id="bio" hint="Up to 280 characters." error={e.bio}>
        <Textarea id="bio" name="bio" defaultValue={initial.bio} rows={4} maxLength={280} aria-invalid={Boolean(e.bio)} aria-describedby={describedBy("bio", true, Boolean(e.bio))} />
      </Field>
      <Field label="Theme" id="themeId" error={e.themeId}>
        <Select id="themeId" name="themeId" defaultValue={initial.themeId}>
          {THEME_LIST.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      <Button type="submit" loading={pending}>{pending ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}
