import type { ReactNode } from "react";
import { requireUser } from "@/lib/session";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireUser("/settings");
  return children;
}
