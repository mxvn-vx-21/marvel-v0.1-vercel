"use client";
import { useEffect, useRef, useState } from "react";
import { Field, Input, Spinner, describedBy } from "./ui";
import { USERNAME_MAX, USERNAME_MIN, validateUsername } from "@/lib/username";

type State = { kind: "idle" } | { kind: "checking" } | { kind: "ok"; msg: string } | { kind: "bad"; msg: string };

/** Controlled username input with debounced server-side availability check. */
export function UsernameField({ value, onChange, serverError, autoFocus }: { value: string; onChange: (v: string) => void; serverError?: string; autoFocus?: boolean }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    abort.current?.abort();
    if (!value) return void setState({ kind: "idle" });
    const local = validateUsername(value); // instant client hint; the SERVER is authoritative
    if (!local.ok) return void setState({ kind: "bad", msg: local.message });
    setState({ kind: "checking" });
    const ctl = new AbortController();
    abort.current = ctl;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/username/check?u=${encodeURIComponent(value)}`, { signal: ctl.signal });
        const j = (await r.json()) as { available: boolean; message: string };
        setState(j.available ? { kind: "ok", msg: j.message } : { kind: "bad", msg: j.message });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setState({ kind: "idle" });
      }
    }, 350);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [value]);

  const error = serverError ?? (state.kind === "bad" ? state.msg : undefined);
  return (
    <Field
      label="Username"
      id="username"
      error={error}
      hint={`${USERNAME_MIN}–${USERNAME_MAX} characters: letters, numbers, underscore.`}
    >
      <div className="flex items-center rounded-lg border border-line bg-ink focus-within:border-spark">
        <span className="select-none pl-3 text-sm text-zinc-500">marvel.wtf/</span>
        <input
          id="username"
          name="username"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={USERNAME_MAX + 5}
          required
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy("username", true, Boolean(error))}
          className="w-full bg-transparent px-1 py-2.5 text-zinc-100 outline-none focus-visible:outline-none"
        />
        <span className="pr-3" aria-live="polite">
          {state.kind === "checking" && <Spinner />}
          {state.kind === "ok" && <span className="text-emerald-400" title={state.msg}>✓<span className="sr-only">{state.msg}</span></span>}
        </span>
      </div>
    </Field>
  );
}
export { Input };
