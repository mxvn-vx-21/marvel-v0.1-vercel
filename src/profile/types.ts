import type { ProfileBlock } from "@/lib/db/schema";

/** Everything the renderer needs. Deliberately free of account data (email, role, plan…). */
export interface PublicProfileData {
  username: string;
  displayName: string;
  bio: string;
  status: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  themeId: string;
  blocks: Pick<ProfileBlock, "id" | "type" | "data" | "position">[];
}
