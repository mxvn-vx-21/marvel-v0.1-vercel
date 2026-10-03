import type { ReactNode } from "react";
import { requireOnboardedUser } from "@/lib/session";

// Gate runs BEFORE the loading skeleton streams → anonymous visitors get a real 307 to /login.
// (The page re-checks independently; never rely on a layout alone.)
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireOnboardedUser("/dashboard");
  return children;
}
