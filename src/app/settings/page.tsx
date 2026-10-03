import { AppHeader } from "@/components/AppHeader";
import { ChangePasswordForm, DeleteAccountForm } from "@/components/AccountForms";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Settings — MARVEL.WTF", robots: { index: false } };

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  return (
    <>
      <AppHeader username={user.username} />
      <main id="main" className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <h1 className="font-display text-3xl uppercase tracking-wide">Settings</h1>
        <Card title="Account">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-mute">Email</dt><dd className="break-all font-semibold">{user.email}{user.emailVerified ? " · verified" : ""}</dd></div>
            <div><dt className="text-mute">Username</dt><dd className="font-semibold">{user.username ? `@${user.username}` : "Not chosen yet"}</dd></div>
            <div><dt className="text-mute">Plan</dt><dd className="font-semibold">{user.plan}</dd></div>
          </dl>
        </Card>
        <Card title="Password"><ChangePasswordForm /></Card>
        <Card title="Danger zone" className="!border-red-500/50"><DeleteAccountForm confirmWord={user.username ?? "DELETE"} /></Card>
      </main>
    </>
  );
}
