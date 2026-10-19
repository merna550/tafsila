/**
 * The sleeve style module (issue #142, FR-PAT-05): cap, puff, bishop and flutter sleeves, all started from the set-in
 * block (#134), and the combinations of type, length and cuff they refuse (decision 142).
 */
import type { DesignSpec } from "@tafsila/schemas";
import { armholeParts } from "../../blocks/bodice/armhole-parts";
import { draftSleeve } from "../../blocks/sleeve/draft-sleeve";
import { sleeveInputFrom, withSleeveArmholeNotches } from "../../blocks/sleeve/module";
import type { SleeveInput } from "../../blocks/sleeve/types";
import { DEFAULT_FABRIC_WEIGHT, GATHER_RATIO_BY_WEIGHT } from "../../constants/skirt-fullness";
import { BISHOP_HEM_DROP_MM, PUFF_HEM_DROP_MM, PUFF_HEM_GATHER_RATIO } from "../../constants/sleeve-style";
import { DraftingError } from "../../errors/drafting-error";
import { type DraftContext, withPiece } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { capSleevePiece } from "./cap-sleeve";
import { sleeveCombinationIssue } from "./combinations";
import { cuffSeamMm } from "./cuff-seam";
import { flutterPiece } from "./flutter";
import { spreadHem } from "./hem-spread";
import { limbAtHemMm } from "./limb";
import { blockOutline, type SleeveExtras, sleeveFromOutline } from "./outline";
import { withPartialSleeve } from "./partial";
import { puffCap } from "./puff-cap";

/** The sleeve of a design. */
type Sleeve = NonNullable<DesignSpec["sleeve"]>;

/** Same step as the set-in sleeve: after the bodice shaping, collar and skirt modules. */
export const SLEEVE_STYLE_ORDER = 30;

/** Sleeve types this module drafts. */
const STYLED_TYPES: ReadonlySet<Sleeve["type"]> = new Set(["cap", "puff", "bishop", "flutter"]);

/** Hem fullness of the gathered styles: gathered width over cuff seam, and the blouson drop (decision 142, 2). */
const HEM_FULLNESS = {
  puff: { ratio: PUFF_HEM_GATHER_RATIO, dropMm: PUFF_HEM_DROP_MM },
  bishop: { ratio: GATHER_RATIO_BY_WEIGHT[DEFAULT_FABRIC_WEIGHT], dropMm: BISHOP_HEM_DROP_MM },
} as const;

/**
 * Refuses a sleeve combination the table does not allow.
 *
 * @param spec - The design.
 * @throws {DraftingError} SLEEVE_LENGTH_UNSUPPORTED or SLEEVE_CUFF_UNSUPPORTED (input errors).
 */
export function assertSleeveCombination(spec: DesignSpec): void {
  const issue = sleeveCombinationIssue(spec);
  if (issue) {
    throw new DraftingError(
      issue,
      `A ${spec.sleeve?.type} ${spec.sleeve?.length} sleeve with ${spec.sleeve?.cuff}`,
    );
  }
}

/**
 * A puff or bishop sleeve: the set-in block with a puff head (puff only) and, when it has a cuff, the hem spread to
 * the cuff seam times the style's ratio and dropped.
 *
 * @param ctx - Context after the bodice block.
 * @param input - The sleeve input.
 * @param sleeve - The design's sleeve (puff or bishop).
 * @returns The new context.
 */
function gatheredSleeve(ctx: DraftContext, input: SleeveInput, sleeve: Sleeve): DraftContext {
  const block = draftSleeve(input, ctx.options);
  const puff = sleeve.type === "puff" ? puffCap(block, input.bicepHalfMm * 2) : undefined;
  const base = blockOutline(block.piece);
  const capped = puff ? { ...base, capBack: puff.capBack, capFront: puff.capFront } : base;
  const fullness = HEM_FULLNESS[sleeve.type as keyof typeof HEM_FULLNESS];
  const outline =
    sleeve.cuff === "none"
      ? capped
      : spreadHem(capped, cuffSeamMm(sleeve.cuff, limbAtHemMm(ctx, block)) * fullness.ratio, fullness.dropMm);
  const armholes = input.armholes!;
  const extras: SleeveExtras = {
    gatherMm: puff?.gatherMm ?? { back: 0, front: 0 },
    marks: puff?.marks ?? [],
    armholes,
  };
  const piece = sleeveFromOutline(block.piece, outline, extras, ctx.options);
  return withPiece(withSleeveArmholeNotches(ctx, armholes), piece);
}

/**
 * Drafts the styled sleeve.
 *
 * @param ctx - Context after the bodice block.
 * @returns The context with the sleeve piece and the marked bodice armholes.
 * @throws {DraftingError} an input error for a refused combination, or the set-in block's errors.
 */
export function draftStyledSleeve(ctx: DraftContext): DraftContext {
  assertSleeveCombination(ctx.spec);
  const input = sleeveInputFrom(ctx);
  const armholes = input.armholes ?? armholeParts(ctx.pieces);
  const withParts = { ...input, armholes };
  const sleeve = ctx.spec.sleeve!;
  if (sleeve.type === "cap") {
    const block = draftSleeve(withParts, ctx.options);
    return withPartialSleeve(ctx, capSleevePiece(block, armholes, ctx.options), armholes);
  }
  if (sleeve.type === "flutter") {
    const length = sleeve.length as "cap" | "short";
    return withPartialSleeve(ctx, flutterPiece(withParts, length, armholes, ctx.options), armholes);
  }
  return gatheredSleeve(ctx, withParts, sleeve);
}

/** Cap, puff, bishop and flutter sleeves. */
export const sleeveStyleModule: FeatureModule = {
  id: "sleeve/style",
  order: SLEEVE_STYLE_ORDER,
  appliesTo: (spec) => spec.sleeve !== undefined && STYLED_TYPES.has(spec.sleeve.type),
  draft: draftStyledSleeve,
};
