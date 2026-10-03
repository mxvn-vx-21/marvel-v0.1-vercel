import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60";

export function Button({ variant = "primary", className = "", loading, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger"; loading?: boolean }) {
  const v = {
    primary: "bg-hero text-white hover:bg-red-500 shadow-[3px_3px_0_#ffd400] active:translate-x-px active:translate-y-px active:shadow-none",
    ghost: "border border-line bg-transparent text-zinc-200 hover:border-zinc-500",
    danger: "border border-red-500/60 text-red-300 hover:bg-red-500/10",
  }[variant];
  return (
    <button {...p} disabled={p.disabled || loading} aria-busy={loading || undefined} className={`${base} ${v} ${className}`}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner() {
  return <span aria-hidden className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

const field = "w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:border-spark";

export function Field({ label, id, hint, error, children }: { label: string; id: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-mute">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-sm font-semibold text-red-400">{error}</p>}
    </div>
  );
}

export const describedBy = (id: string, hasHint: boolean, hasError: boolean) => (hasError ? `${id}-err` : hasHint ? `${id}-hint` : undefined);

export function Input(p: InputHTMLAttributes<HTMLInputElement>) { return <input {...p} className={`${field} ${p.className ?? ""}`} />; }
export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...p} className={`${field} ${p.className ?? ""}`} />; }
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...p} className={`${field} ${p.className ?? ""}`} />; }

export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  const c = { error: "border-red-500/50 bg-red-500/10 text-red-200", success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200", info: "border-spark/40 bg-spark/10 text-yellow-100" }[kind];
  return <div role={kind === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm font-medium ${c}`}>{children}</div>;
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`comic-card p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 font-display text-sm uppercase tracking-[.2em] text-spark">{title}</h2>}
      {children}
    </section>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="/" className={`font-display text-lg tracking-[.18em] text-white no-underline ${className}`} aria-label="MARVEL.WTF home">
      MARVEL<span className="text-hero">.</span>WTF
    </a>
  );
}
