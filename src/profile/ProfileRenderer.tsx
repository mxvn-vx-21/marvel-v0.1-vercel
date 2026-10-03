import { resolveTheme, themeToCssVars } from "@/lib/themes";
import { blockRegistry } from "./blocks/registry";
import type { PublicProfileData } from "./types";
import { ProfileHeader } from "./ProfileHeader";

/**
 * User → Profile → Theme → Blocks → Renderer → Public page.
 * Renderer = theme shell + identity header + ordered blocks resolved through the registry.
 * Unknown / invalid blocks are skipped silently (never crash a public page).
 */
export function ProfileRenderer({ profile, preview = false }: { profile: PublicProfileData; preview?: boolean }) {
  const theme = resolveTheme(profile.themeId);

  const rendered = profile.blocks
    .slice()
    .sort((a, b) => a.position - b.position)
    .flatMap((b) => {
      const def = blockRegistry.get(b.type);
      if (!def) return [];
      const parsed = def.schema.safeParse(b.data);
      if (!parsed.success) return [];
      const C = def.Component;
      return [<C key={b.id} data={parsed.data} theme={theme} />];
    });

  return (
    <div className="profile-root" data-enter={theme.animations.enter} style={themeToCssVars(theme)}>
      {preview && (
        <div className="p-preview" role="status">
          PRIVATE PREVIEW — only you can see this page. Publish it from your dashboard.
        </div>
      )}
      <main className="p-shell">
        <ProfileHeader profile={profile} />
        <div className="p-stack">
          {rendered.length > 0 ? (
            rendered
          ) : (
            <section className="p-card p-card-empty" aria-label="Coming soon">
              <p className="p-muted">Links, music &amp; widgets are coming soon.</p>
            </section>
          )}
        </div>
        <footer className="p-footer">
          <a href="/" className="p-brand">MARVEL.WTF</a>
          <span className="p-muted">Become the character.</span>
        </footer>
      </main>
    </div>
  );
}
