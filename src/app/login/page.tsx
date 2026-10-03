import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";
import { SocialButtons } from "@/components/SocialButtons";
import { enabledSocialProviders } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { safeNext } from "@/lib/urls";

export const metadata = { title: "Log in — MARVEL.WTF", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Log in" subtitle="Welcome back, hero." footer={<>New here? <Link href="/signup" className="font-bold text-spark hover:underline">Create an account</Link></>}>
      <LoginForm next={next} unauthorized={sp.reason === "unauthorized"} />
      <SocialButtons providers={enabledSocialProviders()} next={next} />
    </AuthShell>
  );
}
