/**
 * The neckline feature module (issue #139, FR-PAT-05, FR-PAT-07): reshapes the bodice neck of both halves to the
 * catalogue style, applies `depthFrontMm` within limits and adds the front and back facings with their
 * interfacing (decision 139).
 */
import type { DesignSpec } from "@tafsila/schemas";
import { DraftingError } from "../../errors/drafting-error";
import { pathLength } from "../../geometry";
import { type DraftContext, withPieces, withResolved } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { type DraftedNeck, NECK_HALVES, draftNeck } from "./draft-neck";
import { facingPieces } from "./facing";
import { NECKLINE_RULES, NECK_RESOLVED_KEYS } from "./rules";
import { spliceNeck } from "./splice";

/** After the bodice shaping modules (5), which decide which piece holds the neck; before the sleeve (30). */
export const NECKLINE_ORDER = 10;

/** Both sides of a sewn neck seam count: front and back halves are each cut on the fold. */
const HALVES_PER_SIDE = 2;

/**
 * The numbers the rules read back.
 *
 * @param d - The drafted neck.
 * @returns Resolved values by key.
 */
function resolvedValues(d: DraftedNeck): Record<string, number> {
  const { depth, widen } = d.resolution;
  const halfNeckMm = pathLength(d.halves.front.neck.segments) + pathLength(d.halves.back.neck.segments);
  return {
    [NECK_RESOLVED_KEYS.frontDepth]: depth.front.valueMm,
    [NECK_RESOLVED_KEYS.frontRequested]: depth.front.requestedMm,
    [NECK_RESOLVED_KEYS.frontMin]: depth.front.minMm,
    [NECK_RESOLVED_KEYS.frontMax]: depth.front.maxMm,
    [NECK_RESOLVED_KEYS.backDepth]: depth.back.valueMm,
    [NECK_RESOLVED_KEYS.backRequested]: depth.back.requestedMm,
    [NECK_RESOLVED_KEYS.backMin]: depth.back.minMm,
    [NECK_RESOLVED_KEYS.backMax]: depth.back.maxMm,
    [NECK_RESOLVED_KEYS.widen]: widen.valueMm,
    [NECK_RESOLVED_KEYS.widenRequested]: widen.requestedMm,
    [NECK_RESOLVED_KEYS.openingMm]: halfNeckMm * HALVES_PER_SIDE,
  };
}

/**
 * Drafts the neckline: new necks spliced into the bodice pieces (kept in place), then the facings and their
 * interfacing appended.
 *
 * @param ctx - Context after the bodice shaping modules.
 * @returns The new context.
 * @throws {DraftingError} PIPELINE_STEP_ORDER without a bodice or a neckline in the design.
 */
export function draftNeckline(ctx: DraftContext): DraftContext {
  const neckline = ctx.spec.neckline;
  if (!neckline) throw new DraftingError("PIPELINE_STEP_ORDER", "The neckline module needs a neckline");
  const d = draftNeck(ctx, neckline);
  const spliced = new Map(
    NECK_HALVES.map((half) => [
      d.halves[half].piece.id,
      spliceNeck(d.halves[half].piece, d.halves[half].neck, ctx.options),
    ]),
  );
  const facings = NECK_HALVES.flatMap((half) =>
    facingPieces(
      {
        half,
        neck: d.halves[half].neck.segments,
        bodicePieceId: d.halves[half].piece.id,
        widthMm: d.facingWidthMm,
      },
      ctx.options,
    ),
  );
  const pieces = [...ctx.pieces.map((p) => spliced.get(p.id) ?? p), ...facings];
  return withResolved(withPieces(ctx, pieces), resolvedValues(d));
}

/**
 * Whether the design has a bodice neckline to draft.
 *
 * @param spec - The design.
 * @returns True for a dress or blouse with a neckline.
 */
function hasNeckline(spec: DesignSpec): boolean {
  return spec.neckline !== undefined && spec.category !== "skirt";
}

/** Every catalogue neckline, front and back, with its facings. */
export const necklineModule: FeatureModule = {
  id: "neckline",
  order: NECKLINE_ORDER,
  appliesTo: hasNeckline,
  draft: draftNeckline,
  validations: NECKLINE_RULES,
};
