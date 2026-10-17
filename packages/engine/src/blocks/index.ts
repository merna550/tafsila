/** The base blocks the `blocks` pipeline step drafts, keyed by block name (issue #128, decision 128, 9). */
import type { BlockName } from "../pipeline/category-rules";
import type { DraftContext } from "../pipeline/draft-context";
import { bodiceBlock } from "./bodice";

export * from "./bodice";
export * from "./shared";

/** A block drafter: one pipeline step over the context. */
export type BlockDrafter = (ctx: DraftContext) => DraftContext;

/** The drafter of each block. */
export const BLOCK_DRAFTERS: Readonly<Record<BlockName, BlockDrafter>> = {
  bodice: bodiceBlock,
  // Filled by #129 (straight skirt block).
  skirt: (ctx) => ctx,
};
