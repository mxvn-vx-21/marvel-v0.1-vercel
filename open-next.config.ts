import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default config: no incremental cache override needed because profile pages
// are rendered dynamically (the database is the source of truth).
export default defineCloudflareConfig();
