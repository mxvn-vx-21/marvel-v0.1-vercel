import type { ComponentType } from "react";
import type { ZodType } from "zod";
import type { Theme } from "@/lib/themes";

/**
 * A block = a self-describing unit of profile content.
 *   type      → stored in profile_block.type
 *   schema    → validates profile_block.data (untrusted JSON) before rendering
 *   Component → pure server-renderable presentation
 *
 * TO ADD A BLOCK (music, gallery, youtube, github, …):
 *   1. create src/profile/blocks/<name>.tsx exporting a BlockDefinition
 *   2. register it in registry.ts
 * The renderer, DB and public page need no changes.
 */
export interface BlockDefinition<T = unknown> {
  type: string;
  label: string;
  schema: ZodType<T>;
  Component: ComponentType<{ data: T; theme: Theme }>;
}
