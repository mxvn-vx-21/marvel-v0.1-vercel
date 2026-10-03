import type { ReactNode } from "react";
import { Logo } from "./ui";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden />
      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
        <Logo className="mb-6 self-center" />
        <div className="comic-card p-6 sm:p-8">
          <h1 className="font-display text-2xl uppercase tracking-wide">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-mute">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-sm text-mute">{footer}</p>}
      </main>
    </div>
  );
}
