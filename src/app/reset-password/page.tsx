import { AuthShell } from "@/components/AuthShell";
import { ResetForm } from "@/components/ResetForm";

export const metadata = { title: "Reset password — MARVEL.WTF", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell title="New password" subtitle="Choose a strong password.">
      <ResetForm token={sp.error ? "" : (sp.token ?? "")} />
    </AuthShell>
  );
}
