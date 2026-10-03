import type { PublicProfileData } from "./types";

export function ProfileHeader({ profile }: { profile: PublicProfileData }) {
  const initial = (profile.displayName || profile.username).trim().charAt(0).toUpperCase() || "?";
  return (
    <header className="p-header">
      <div className="p-banner" aria-hidden={!profile.bannerUrl}>
        {profile.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.bannerUrl} alt="" width={1500} height={500} decoding="async" />
        )}
      </div>
      <div className="p-identity">
        <div className="p-avatar">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={`${profile.displayName}'s avatar`} width={128} height={128} decoding="async" />
          ) : (
            <span aria-hidden>{initial}</span>
          )}
        </div>
        <h1 className="p-name">{profile.displayName}</h1>
        <p className="p-handle">@{profile.username}</p>
        {profile.status && <p className="p-status"><span className="p-dot" aria-hidden />{profile.status}</p>}
        {profile.bio && <p className="p-bio">{profile.bio}</p>}
      </div>
    </header>
  );
}
