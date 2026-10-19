/**
 * The waistband feature module (issue #140, FR-PAT-05): adds the waist finish the design asks for to a drafted
 * skirt, the elastic as a notion cut by length, and the numbers its rules read back (decision 140).
 */
import type { DesignSpec } from "@tafsila/schemas";
import { isPanelSkirt } from "../../constants/skirt-fullness";
import { ELASTIC_LENGTH_RATIO } from "../../constants/elastic";
import { ELASTIC_WIDTH_MM } from "../../constants/waistband";
import { DraftingError } from "../../errors/drafting-error";
import { waistPieces } from "../../pieces/waist-seam";
import {
  type DraftContext,
  type PieceDraft,
  withNotion,
  withPieces,
  withResolved,
} from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import {
  closureOverlapMm,
  contourBand,
  elasticCasing,
  flatFacing,
  straightBand,
  tracedFacing,
} from "./finishes";
import { WAISTBAND_KEYS, WAISTBAND_RULES } from "./rules";

/** After every skirt module (10 to 30), which draw the waist the finish sews to. */
export const WAISTBAND_ORDER = 40;

/** Id of the waist elastic notion. */
export const ELASTIC_NOTION_ID = "waist-elastic";

/**
 * Whether the skirt has a shaped waist to trace (a block or circle skirt), rather than a straight gathered top.
 *
 * @param spec - The design.
 * @returns True for straight, A-line and circle skirts.
 */
function shapedSkirt(spec: DesignSpec): boolean {
  return spec.skirt !== undefined && !isPanelSkirt(spec.skirt.type);
}

/**
 * The pieces of the finish the design asks for. A contour band needs a shaped waist; on a gathered, pleated or
 * tiered skirt it is drafted as a straight band, with a warning (decision 140, 4).
 *
 * @param ctx - Context with the skirt drafted.
 * @returns The finish pieces.
 */
function finishPieces(ctx: DraftContext): PieceDraft[] {
  const shaped = shapedSkirt(ctx.spec);
  switch (ctx.spec.waistband) {
    case "straight":
      return straightBand(ctx);
    case "contour":
      return shaped ? contourBand(ctx) : straightBand(ctx);
    case "elastic":
      return elasticCasing(ctx);
    default:
      return shaped ? tracedFacing(ctx) : flatFacing(ctx);
  }
}

/**
 * Adds the waist elastic as a notion: body waist × `ELASTIC_LENGTH_RATIO` (decision 140, 3).
 *
 * @param ctx - Context after the finish pieces.
 * @returns The context with the notion and its length read back.
 */
function withElastic(ctx: DraftContext): DraftContext {
  if (ctx.spec.waistband !== "elastic") return ctx;
  const lengthMm = ctx.measurements.waist * ELASTIC_LENGTH_RATIO;
  const notion = {
    id: ELASTIC_NOTION_ID,
    kind: "elastic" as const,
    name: { ar: "أستك الوسط", en: "Waist elastic" },
    lengthMm,
    widthMm: ELASTIC_WIDTH_MM,
    quantity: 1,
  };
  return withResolved(withNotion(ctx, notion), { [WAISTBAND_KEYS.elasticMm]: lengthMm });
}

/**
 * Drafts the waist finish.
 *
 * @param ctx - Context after the skirt modules.
 * @returns The new context.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when no skirt waist was drafted.
 */
export function draftWaistband(ctx: DraftContext): DraftContext {
  if (waistPieces(ctx.pieces).length === 0) {
    throw new DraftingError("PIPELINE_STEP_ORDER", "The waistband module needs a drafted skirt waist");
  }
  const contourFlat = ctx.spec.waistband === "contour" && !shapedSkirt(ctx.spec);
  const next = withResolved(withPieces(ctx, [...ctx.pieces, ...finishPieces(ctx)]), {
    [WAISTBAND_KEYS.overlapMm]: ctx.spec.waistband === "straight" || contourFlat ? closureOverlapMm(ctx) : 0,
    [WAISTBAND_KEYS.contourFlat]: contourFlat ? 1 : 0,
  });
  return withElastic(next);
}

/**
 * Whether the design asks for a waist finish this module draws: a skirt with a `waistband` value. A dress joins its
 * skirt to the bodice at the waist seam, so it takes no band (decision 140, 5).
 *
 * @param spec - The design.
 * @returns True for a skirt with a waistband value.
 */
function wantsWaistband(spec: DesignSpec): boolean {
  return spec.category === "skirt" && spec.skirt !== undefined && spec.waistband !== undefined;
}

/** Straight, contour and elastic waistbands, or a waist facing for `none`. */
export const waistbandModule: FeatureModule = {
  id: "waistband",
  order: WAISTBAND_ORDER,
  appliesTo: wantsWaistband,
  draft: draftWaistband,
  validations: WAISTBAND_RULES,
};
