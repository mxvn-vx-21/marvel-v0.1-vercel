import type { BlockDefinition } from "./types";
import { textBlock } from "./text";
import { linksBlock } from "./links";

// Register future blocks here: music, gallery, youtube, github, projects, services, discord, game, video, embed…
const defs: BlockDefinition<any>[] = [textBlock, linksBlock]; // eslint-disable-line @typescript-eslint/no-explicit-any

export const blockRegistry: ReadonlyMap<string, BlockDefinition<any>> = new Map(defs.map((d) => [d.type, d])); // eslint-disable-line @typescript-eslint/no-explicit-any
