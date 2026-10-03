import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata = { title: "Log out — MARVEL.WTF", robots: { index: false } };

export default function LogoutPage() {
  return (
    <AuthShell title="Log out" subtitle="End your session on this device?" footer={<Link href="/dashboard" className="font-bold text-spark hover:underline">Cancel</Link>}>
      <LogoutButton variant="primary" className="w-full" />
    </AuthShell>
  );
}
