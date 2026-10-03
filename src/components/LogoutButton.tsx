"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui";

export function LogoutButton({ variant = "ghost", className }: { variant?: "ghost" | "primary"; className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      loading={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
