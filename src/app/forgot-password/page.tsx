import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotForm } from "@/components/ForgotForm";

export const metadata = { title: "Forgot password — MARVEL.WTF", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a link to reset it." footer={<Link href="/login" className="font-bold text-spark hover:underline">Back to log in</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
