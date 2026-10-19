/** The bodice block drafter and its pipeline step (issue #128, FR-PAT-01, FR-PAT-05). */
import type { DesignSpec, EngineOptions, Measurements, Point } from "@tafsila/schemas";
import { DEFAULT_SEAM_ALLOWANCE_MM } from "@tafsila/schemas";
import { DraftingError } from "../../errors/drafting-error";
import { distance, pathLength } from "../../geometry";
import type { ResolvedDraftInputs } from "../../resolve/types";
import { type DraftContext, withPiece, withResolved } from "../../pipeline/draft-context";
import { backArmhole, backKeyPoints, backPiece } from "./back";
import { checkProportions, checkShoulder, deriveBodiceLengths } from "./derive";
import { frontArmhole, frontKeyPoints, frontPiece } from "./front";
import type { BackPoints, BodiceDraft, BodiceInput, BodiceKeyPoint, FrontPoints } from "./types";

/** Seam allowances used when `draftBodice` is called without options. */
const DEFAULT_SEAM_OPTIONS: Pick<EngineOptions, "seamAllowance"> = {
  seamAllowance: { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: {} },
};

/** Keys of `DraftContext.resolved` written by the bodice block, read by the sleeve block (#134). */
export const BODICE_RESOLVED_KEYS = {
  armholeBackMm: "bodice.armholeBackMm",
  armholeFrontMm: "bodice.armholeFrontMm",
  scyeDepthMm: "bodice.scyeDepthMm",
  waistDartFrontFromCentreMm: "bodice.waistDartFrontFromCentreMm",
  waistDartBackFromCentreMm: "bodice.waistDartBackFromCentreMm",
} as const;

/**
 * Where each waist dart sits along the waist with the darts closed: the distance from the centre line (CF or CB) to
 * the dart's centre-side leg, which is where the closed dart lies (issue #144). A dropped dart gives no value. Princess
 * seams meet the waist at the same legs (decision 138, 3), so the values hold for them too.
 *
 * @param keyPoints - The bodice key points.
 * @param hasDart - Whether the waist darts are drafted.
 * @returns The resolved values, keyed by `BODICE_RESOLVED_KEYS`.
 */
function waistDartPositions(
  keyPoints: Readonly<Record<BodiceKeyPoint, Point>>,
  hasDart: boolean,
): Record<string, number> {
  if (!hasDart) return {};
  const k = keyPoints;
  return {
    [BODICE_RESOLVED_KEYS.waistDartFrontFromCentreMm]: distance(
      k["bodice.front.waistCF"],
      k["bodice.front.waistDartLeft"],
    ),
    [BODICE_RESOLVED_KEYS.waistDartBackFromCentreMm]: distance(
      k["bodice.back.waistCB"],
      k["bodice.back.waistDartLeft"],
    ),
  };
}

/**
 * Prefixes the key point names with their block name, as in `referenceDrafts`.
 *
 * @param back - Back key points.
 * @param front - Front key points.
 * @returns Every key point by reference name.
 */
function namedKeyPoints(back: BackPoints, front: FrontPoints): Record<BodiceKeyPoint, Point> {
  const out: Record<string, Point> = {};
  for (const [name, p] of Object.entries(back)) out[`bodice.back.${name}`] = p;
  for (const [name, p] of Object.entries(front)) out[`bodice.front.${name}`] = p;
  return out;
}

/**
 * Drafts the bodice block, back and front halves, with bust and waist darts. Pure.
 * Aldrich 6th ed., ch. 2, bodice block, steps 1 to 9 (docs/engine/drafting-method.md), with the three
 * changes of decision 128 (equal shoulders, bust dart apex, waist dart truing).
 *
 * @param input - Body lengths and the finished widths from resolve.
 * @param options - Seam allowance table; defaults to the schema defaults.
 * @returns Both pieces, the key points, the armholes and the armscye depth.
 * @throws {DraftingError} BODICE_SHOULDER_INVALID, BODICE_LENGTHS_INVALID or BODICE_BUST_POINT_OUT_OF_BLOCK.
 */
export function draftBodice(
  input: BodiceInput,
  options: Pick<EngineOptions, "seamAllowance"> = DEFAULT_SEAM_OPTIONS,
): BodiceDraft {
  const lengths = deriveBodiceLengths(input);
  checkShoulder(lengths);
  const back = backKeyPoints(input, lengths);
  const front = frontKeyPoints(input, lengths);
  checkProportions(back, front);
  const hasDart = lengths.waistDartMm > 0;
  const armBack = backArmhole(back);
  const armFront = frontArmhole(front);
  return {
    back: backPiece(back, armBack, hasDart, options),
    front: frontPiece(front, armFront, hasDart, options),
    keyPoints: namedKeyPoints(back, front),
    armhole: {
      back: armBack,
      front: armFront,
      backLengthMm: pathLength(armBack),
      frontLengthMm: pathLength(armFront),
    },
    scyeDepthMm: lengths.scyeDepthMm,
    hasWaistDart: hasDart,
  };
}

/**
 * The bodice input from the run's measurements, spec and resolved inputs.
 *
 * @param m - Measurements.
 * @param spec - The design.
 * @param inputs - Resolved inputs (#126).
 * @returns The bodice input.
 */
export function bodiceInputFrom(m: Measurements, spec: DesignSpec, inputs: ResolvedDraftInputs): BodiceInput {
  return {
    neck: m.neck,
    shoulderWidth: m.shoulderWidth,
    backLength: m.backLength,
    frontLength: m.frontLength,
    bust: m.bust,
    bustPointDistance: m.bustPointDistance,
    bustHeight: m.bustHeight,
    bustQuarterMm: inputs.bustQuarterMm,
    bodiceWaistQuarterMm: inputs.bodiceWaistQuarterMm,
    acrossBackStyleEaseMm: inputs.acrossBackStyleEaseMm,
    waistDarts: spec.bodice?.shaping !== "none",
  };
}

/**
 * Pipeline step of the bodice block: drafts both halves, adds them as pieces and passes the armhole lengths
 * and the armscye depth on in `resolved` for the sleeve block (#134), and the waist dart positions for the skirt (#144).
 *
 * @param ctx - Context after the resolve step.
 * @returns A new context with `bodice-back` and `bodice-front`.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when the resolve step has not run; a `BODICE_*` code for bad proportions.
 */
export function bodiceBlock(ctx: DraftContext): DraftContext {
  if (!ctx.inputs) {
    throw new DraftingError("PIPELINE_STEP_ORDER", "The bodice block needs the resolve step first");
  }
  const draft = draftBodice(bodiceInputFrom(ctx.measurements, ctx.spec, ctx.inputs), ctx.options);
  const withPieces = withPiece(withPiece(ctx, draft.back), draft.front);
  return withResolved(withPieces, {
    [BODICE_RESOLVED_KEYS.armholeBackMm]: draft.armhole.backLengthMm,
    [BODICE_RESOLVED_KEYS.armholeFrontMm]: draft.armhole.frontLengthMm,
    [BODICE_RESOLVED_KEYS.scyeDepthMm]: draft.scyeDepthMm,
    ...waistDartPositions(draft.keyPoints, draft.hasWaistDart),
  });
}
