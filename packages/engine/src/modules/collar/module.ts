/**
 * The collar feature module (issue #141, FR-PAT-05): drafts the peter pan, shirt or mandarin collar from the finished
 * bodice neck, pairs and notches it to the neck, and refuses necklines and closures it cannot be drafted with
 * (decision 141).
 */
import type { DesignSpec } from "@tafsila/schemas";
import { DraftingError } from "../../errors/drafting-error";
import { edgeLengthMm } from "../../pieces/measure";
import { neckHolders } from "../../pieces/neck-seam";
import { type DraftContext, type PieceDraft, withPieces, withResolved } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { collarCombinationIssue } from "./combinations";
import { mandarinPieces } from "./mandarin";
import { peterPanPieces } from "./peter-pan";
import { COLLAR_EDGE_IDS, type CollarHolders, type CollarOpening } from "./pieces";
import { COLLAR_KEYS, COLLAR_RULES } from "./rules";
import { shirtCollarPieces } from "./shirt";

/** After the neckline (10), which owns the sewn neck edge; before the sleeve (30). */
export const COLLAR_ORDER = 20;

/**
 * Where a peter pan opens: a mirrored pair with a CB opening, otherwise cut on the CB fold (decision 141, 2).
 *
 * @param closure - The design's closure.
 * @returns The opening.
 */
function peterPanOpening(closure: DesignSpec["closure"]): CollarOpening {
  return closure.type !== "none" && closure.position === "center-back" ? "pair" : "cb-fold";
}

/**
 * The collar pieces the design asks for.
 *
 * @param ctx - Context after the neckline.
 * @param holders - The bodice neck holders.
 * @returns The collar pieces; the first one sews to the neck.
 */
function collarPieces(ctx: DraftContext, holders: CollarHolders): PieceDraft[] {
  const { closure } = ctx.spec;
  switch (ctx.spec.neckline?.collar) {
    case "shirt":
      return shirtCollarPieces(holders, closure, ctx.options);
    case "mandarin":
      return mandarinPieces(holders, closure, ctx.options);
    default:
      return peterPanPieces({ pieces: ctx.pieces, holders, opening: peterPanOpening(closure) }, ctx.options);
  }
}

/**
 * Drafts the collar.
 *
 * @param ctx - Context after the neckline module.
 * @returns The context with the collar pieces and the neck lengths its rule reads.
 * @throws {DraftingError} COLLAR_NECKLINE_UNSUPPORTED, COLLAR_DEPTH_UNSUPPORTED or COLLAR_CLOSURE_UNSUPPORTED for a
 * combination it cannot draft (an input error: the pattern is refused with a bilingual message).
 */
export function draftCollar(ctx: DraftContext): DraftContext {
  const issue = collarCombinationIssue(ctx.spec);
  if (issue) throw new DraftingError(issue, `The ${ctx.spec.neckline?.collar} collar cannot be drafted here`);
  const holders = neckHolders(ctx.pieces);
  const pieces = collarPieces(ctx, holders);
  const neckPiece = pieces[0]!;
  const neckMm =
    edgeLengthMm(neckPiece, COLLAR_EDGE_IDS.neckBack) + edgeLengthMm(neckPiece, COLLAR_EDGE_IDS.neckFront);
  return withResolved(withPieces(ctx, [...ctx.pieces, ...pieces]), {
    [COLLAR_KEYS.neckMm]: neckMm,
    [COLLAR_KEYS.bodiceNeckMm]: holders.back.lengthMm + holders.front.lengthMm,
  });
}

/**
 * Whether the design has a collar on a bodice neck.
 *
 * @param spec - The design.
 * @returns True for a dress or blouse with a collar.
 */
function hasCollar(spec: DesignSpec): boolean {
  return spec.category !== "skirt" && spec.neckline !== undefined && spec.neckline.collar !== "none";
}

/** Peter pan, shirt (stand and fall) and mandarin collars. */
export const collarModule: FeatureModule = {
  id: "collar",
  order: COLLAR_ORDER,
  appliesTo: hasCollar,
  draft: draftCollar,
  validations: COLLAR_RULES,
};
