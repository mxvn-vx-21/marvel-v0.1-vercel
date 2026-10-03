import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "@/components/SignupForm";
import { SocialButtons } from "@/components/SocialButtons";
import { enabledSocialProviders } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Sign up — MARVEL.WTF", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ username?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const sp = await searchParams;
  return (
    <AuthShell title="Create account" subtitle="Claim your username and start your origin story." footer={<>Already a hero? <Link href="/login" className="font-bold text-spark hover:underline">Log in</Link></>}>
      <SignupForm initialUsername={(sp.username ?? "").slice(0, 25)} />
      <SocialButtons providers={enabledSocialProviders()} next="/dashboard" />
    </AuthShell>
  );
}
