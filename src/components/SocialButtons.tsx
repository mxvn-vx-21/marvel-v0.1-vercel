"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui";

const LABEL = { google: "Google", github: "GitHub", discord: "Discord" } as const;

export function SocialButtons({ providers, next }: { providers: ("google" | "github" | "discord")[]; next: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (providers.length === 0) return null;
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-500">
        <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
      </div>
      <div className="grid gap-2">
        {providers.map((p) => (
          <Button
            key={p}
            type="button"
            variant="ghost"
            loading={busy === p}
            disabled={busy !== null}
            onClick={async () => {
              setBusy(p);
              await authClient.signIn.social({ provider: p, callbackURL: next, newUserCallbackURL: "/onboarding" });
              setBusy(null);
            }}
          >
            Continue with {LABEL[p]}
          </Button>
        ))}
      </div>
    </div>
  );
}
