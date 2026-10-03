import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { OnboardingForm } from "@/components/OnboardingForm";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Choose your username — MARVEL.WTF", robots: { index: false } };

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  if (user.username) redirect("/dashboard");
  return (
    <AuthShell title="Pick your name" subtitle="Your username is your public URL.">
      <OnboardingForm />
    </AuthShell>
  );
}
