import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ImageUploader } from "@/components/ImageUploader";
import { ProfileForm } from "@/components/ProfileForm";
import { PublishToggle } from "@/components/PublishToggle";
import { Card } from "@/components/ui";
import { getOwnProfile, requireOnboardedUser } from "@/lib/session";
import { mediaUrl } from "@/lib/storage";
import { profileUrl } from "@/lib/urls";

export const metadata = { title: "Dashboard — MARVEL.WTF", robots: { index: false } };

export default async function Dashboard() {
  const user = await requireOnboardedUser("/dashboard");
  const profile = await getOwnProfile(user);
  const published = profile.visibility === "PUBLISHED";
  const initial = (profile.displayName || user.username).charAt(0).toUpperCase();

  return (
    <>
      <AppHeader username={user.username} />
      <main id="main" className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Command center</h1>
          <p className="mt-1 text-sm text-mute">V0 foundation — the full profile builder, blocks, effects and Premium land in later versions.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Profile">
              <div className="mb-6 grid gap-6 sm:grid-cols-2">
                <ImageUploader kind="avatar" label="Avatar" initial={initial} currentUrl={mediaUrl(profile.avatarKey)} hint="PNG, JPEG or WebP · auto-resized" />
                <ImageUploader kind="banner" label="Banner" initial="" currentUrl={mediaUrl(profile.bannerKey)} hint="PNG, JPEG or WebP · auto-resized" />
              </div>
              <ProfileForm initial={{ displayName: profile.displayName, bio: profile.bio, status: profile.status, themeId: profile.themeId }} />
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Publish">
              <dl className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-mute">State</dt>
                  <dd><span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide ${published ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-500/20 text-zinc-300"}`}>{published ? "Published" : "Private"}</span></dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mute">Username</dt><dd className="font-bold">@{user.username}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mute">Plan</dt><dd className="font-bold">{user.plan}</dd></div>
              </dl>
              <p className="mb-4 break-all text-sm">
                <Link href={`/${user.username}`} className="font-bold text-spark hover:underline">{profileUrl(user.username).replace(/^https?:\/\//, "")}</Link>
                {!published && <span className="mt-1 block text-xs text-mute">Only you can preview this until you publish.</span>}
              </p>
              <PublishToggle published={published} />
            </Card>

            <Card title="Account">
              <dl className="space-y-2 text-sm">
                <div><dt className="text-mute">Email</dt><dd className="break-all font-semibold">{user.email}</dd></div>
                <div><dt className="text-mute">Member since</dt><dd className="font-semibold">{user.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
                <Link href="/settings" className="text-spark hover:underline">Settings &amp; delete account</Link>
                <Link href="/logout" className="text-zinc-300 hover:underline">Log out</Link>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
