/**
 * The dart-free bodice (issue #138, `bodice.shaping: none`, decision 138, 6). The block already gives the waist dart's
 * intake to the side seam when the design has no darts (decision 128, 7); this module also removes the bust dart:
 * the front side waist rises by the dart's opening, so the side seam still sews to the back, and the intake hangs as
 * length ease at the centre front instead of shaping the bust. Good for loose and semi-fitted designs; a fitted
 * design gets a warning (FR-VAL-08), never a silent "fitted" claim.
 */
import type { Point, ValidationCheck } from "@tafsila/schemas";
import { FRONT_PIECE_ID, type BodiceDraft } from "../../blocks/bodice";
import { buildEdges, type EdgeSpec } from "../../blocks/shared/edges";
import { add, distance, lineSeg, perpendicular, pt, scale, sub } from "../../geometry";
import { type DraftContext, type PieceDraft, withPiece } from "../../pipeline/draft-context";
import type { FeatureModule, ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../../validation/messages";
import { BODICE_SHAPING_ORDER, bodiceOf } from "./princess";

/**
 * The two points at the given distances from two centres (circle-circle crossing), or none.
 *
 * @param first - First centre.
 * @param ra - Distance from the first centre, in mm.
 * @param second - Second centre.
 * @param rb - Distance from the second centre, in mm.
 * @returns The crossings (0 or 2).
 */
function circleCrossings(first: Point, ra: number, second: Point, rb: number): Point[] {
  const d = distance(first, second);
  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const h2 = ra * ra - along * along;
  if (d === 0 || h2 < 0) return [];
  const unit = scale(sub(second, first), 1 / d);
  const foot = add(first, scale(unit, along));
  const off = scale(perpendicular(unit), Math.sqrt(h2));
  return [add(foot, off), sub(foot, off)];
}

/**
 * The raised front side waist of a dart-free front: the point whose side seam (from the underarm) is as long as the
 * back side seam and whose waist edge (to the centre front) is as long as the block's, so both the side seam match
 * (FR-VAL-01) and the waist circumference (FR-VAL-03) are kept. It sits about one bust dart opening above the block's
 * side waist: that is the intake released as length ease (decision 138, 6).
 *
 * @param d - The bodice block (drafted without waist darts).
 * @returns The new side waist point.
 */
export function dartFreeSideWaist(d: BodiceDraft): Point {
  const waistCF = d.keyPoints["bodice.front.waistCF"];
  const sideWaist = d.keyPoints["bodice.front.sideWaist"];
  const underarm = d.keyPoints["bodice.front.underarm"];
  const dartMm = d.keyPoints["bodice.front.bustDartLower"].y - d.keyPoints["bodice.front.bustDartUpper"].y;
  const raised = pt(sideWaist.x, sideWaist.y - dartMm);
  const backSideMm = distance(d.keyPoints["bodice.back.underarm"], d.keyPoints["bodice.back.sideWaist"]);
  const crossings = circleCrossings(underarm, backSideMm, waistCF, distance(waistCF, sideWaist));
  const [first, second] = crossings;
  if (!first || !second) return raised;
  return distance(second, raised) < distance(first, raised) ? second : first;
}

/**
 * The front piece without the bust dart: the side seam runs straight from the underarm to the raised side waist.
 *
 * @param d - The bodice block (drafted without waist darts).
 * @param ctx - The run, for the seam allowance options.
 * @returns The new front piece.
 */
function dartFreeFront(d: BodiceDraft, ctx: DraftContext): PieceDraft {
  const front = d.front;
  const side = front.edges.find((e) => e.id === "side")!;
  const waist = front.edges.find((e) => e.id === "waist")!;
  const sideWaist = dartFreeSideWaist(d);
  const stitchPath = [
    ...front.stitchPath.slice(0, side.fromSegment),
    lineSeg(d.keyPoints["bodice.front.underarm"], sideWaist),
    lineSeg(sideWaist, d.keyPoints["bodice.front.waistCF"]),
    ...front.stitchPath.slice(waist.toSegment + 1),
  ];
  const specs: EdgeSpec[] = front.edges.map((e) => ({
    id: e.id,
    kind: e.kind ?? "other",
    segments: e.id === "side" || e.id === "waist" ? 1 : e.toSegment - e.fromSegment + 1,
    ...(e.pairsWith ? { pairsWith: e.pairsWith } : {}),
  }));
  return { ...front, stitchPath, edges: buildEdges(FRONT_PIECE_ID, specs, ctx.options), darts: [] };
}

/**
 * The fit check of a dart-free bodice: a pass for loose and semi-fitted, a warning for fitted (decision 138, 6).
 *
 * @param ctx - Finished drafting context.
 * @returns One FR-VAL-08 check.
 */
function dartFreeFitCheck(ctx: DraftContext): ValidationCheck {
  const fitted = ctx.spec.bodice?.fit === "fitted";
  const code = fitted ? "BODICE_DART_FREE_FITTED" : "BODICE_DART_FREE_OK";
  return {
    id: "FR-VAL-08",
    code,
    status: fitted ? "warn" : "pass",
    message: formatMessage(code, {}),
    refs: [FRONT_PIECE_ID],
  };
}

/** A fitted bodice cannot be shaped without darts or seams: warn instead of claiming it. */
export const dartFreeFitRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "BODICE_DART_FREE_FITTED",
  appliesTo: (ctx) => ctx.spec.bodice?.shaping === "none",
  run: dartFreeFitCheck,
};

/** `bodice.shaping: none`: no bust dart and no waist darts. */
export const dartFreeBodiceModule: FeatureModule = {
  id: "bodice/none",
  order: BODICE_SHAPING_ORDER,
  appliesTo: (spec) => spec.bodice?.shaping === "none",
  draft: (ctx) => withPiece(ctx, dartFreeFront(bodiceOf(ctx), ctx)),
  validations: [dartFreeFitRule],
};
