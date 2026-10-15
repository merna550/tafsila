/** The sizes and blocks that have reference drafts (issue #122). */

/** Sizes of `egyptianSizeChart` that have reference drafts. */
export const REFERENCE_SIZES = ["S", "M", "XXL"] as const;

/** One size label with a reference draft. */
export type ReferenceSize = (typeof REFERENCE_SIZES)[number];

/** Blocks drafted by the method, in the order of the document. */
export const REFERENCE_BLOCKS = ["bodiceBack", "bodiceFront", "skirtBack", "skirtFront", "sleeve"] as const;

/** One block with a reference draft. */
export type ReferenceBlock = (typeof REFERENCE_BLOCKS)[number];
