/** Woven-ease and fabric-width plausibility warnings (FR-VAL-08). */
import type { DesignSpec, EngineOptions, Measurements, ValidationCheck } from "@tafsila/schemas";
import { GEOMETRY_EPSILON_MM } from "../../constants/geometry";
import { samplePath } from "../../geometry";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import type { TotalEaseMm } from "../../resolve/types";
import { formatMessage } from "../messages";

/** Ease lines that can make a woven pattern implausibly tight. */
const EASE_LINES: readonly (keyof TotalEaseMm)[] = ["bust", "waist", "hip", "upperArm"];

/** Minimal result needed from the resolve step by the negative-ease rule. */
export interface EaseResolution {
  /** Total ease in mm at each checked body line. */
  readonly totalEaseMm: TotalEaseMm;
}

/** A replaceable resolver lets the negative branch be tested even while today's profiles are non-negative. */
export type EaseResolver = (
  spec: DesignSpec,
  measurements: Measurements,
  options: Pick<EngineOptions, "easeProfile">,
) => EaseResolution;

/**
 * Builds the shared passing result for a plausibility rule.
 *
 * @returns A passing FR-VAL-08 check.
 */
function plausibilityPass(): ValidationCheck {
  return { id: "FR-VAL-08", code: "PLAUS_OK", status: "pass", message: formatMessage("PLAUS_OK") };
}

/**
 * Creates the negative-ease rule, with an injectable resolver for its otherwise unreachable warning fixture.
 *
 * @param resolveEase - Pure resolver used by the drafting pipeline.
 * @returns A rule warning on the first negative woven-ease line.
 */
export function createNegativeEaseRule(resolveEase: EaseResolver = resolveDraftInputs): ValidationRule {
  return {
    id: "FR-VAL-08",
    code: "PLAUS_NEGATIVE_EASE",
    appliesTo: (ctx) => ctx.spec.fabricType === "woven",
    run: (ctx: DraftContext): ValidationCheck => {
      const totals = resolveEase(ctx.spec, ctx.measurements, ctx.options).totalEaseMm;
      const line = EASE_LINES.find((candidate) => totals[candidate] < 0);
      if (line === undefined) return plausibilityPass();
      const measuredMm = totals[line];
      return {
        id: "FR-VAL-08",
        code: "PLAUS_NEGATIVE_EASE",
        status: "warn",
        message: formatMessage("PLAUS_NEGATIVE_EASE", { line, mm: measuredMm }),
        measuredMm,
        expectedMm: 0,
      };
    },
  };
}

/** Production negative-ease rule using the same resolver as the drafting pipeline. */
export const negativeEaseRule = createNegativeEaseRule();

/**
 * Measures a cutting path perpendicular to its grain line.
 *
 * @param piece - Finished piece to measure.
 * @returns Width across the grain in mm, doubled when cut on the fold; zero for a missing grain direction.
 */
function widthAcrossGrainMm(piece: DraftContext["pieces"][number]): number {
  const [start, end] = piece.grainLine;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const grainLengthMm = Math.hypot(dx, dy);
  if (grainLengthMm <= GEOMETRY_EPSILON_MM || piece.cutPath === undefined) return 0;
  const projections = samplePath(piece.cutPath).map(
    (point) => (-dy * point.x + dx * point.y) / grainLengthMm,
  );
  const extentMm = Math.max(...projections) - Math.min(...projections);
  return piece.cut.onFold ? extentMm * 2 : extentMm;
}

/** Warns when a piece cannot fit across the configured fabric width. */
export const fabricWidthRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "PLAUS_WIDER_THAN_FABRIC",
  appliesTo: () => true,
  run: (ctx: DraftContext): ValidationCheck => {
    const tooWide = ctx.pieces
      .map((piece) => ({ piece: piece.id, measuredMm: widthAcrossGrainMm(piece) }))
      .filter(({ measuredMm }) => measuredMm > ctx.options.fabricWidthMm)
      .sort((a, b) => b.measuredMm - a.measuredMm || a.piece.localeCompare(b.piece));
    if (tooWide.length === 0) return plausibilityPass();
    const widest = tooWide[0]!;
    return {
      id: "FR-VAL-08",
      code: "PLAUS_WIDER_THAN_FABRIC",
      status: "warn",
      message: formatMessage("PLAUS_WIDER_THAN_FABRIC", {
        piece: widest.piece,
        mm: widest.measuredMm,
        fabric: ctx.options.fabricWidthMm,
      }),
      measuredMm: widest.measuredMm,
      expectedMm: ctx.options.fabricWidthMm,
      refs: tooWide.map(({ piece }) => piece).sort((a, b) => a.localeCompare(b, "en")),
    };
  },
};

/** All plausibility rules. */
export const PLAUSIBILITY_RULES: readonly ValidationRule[] = [negativeEaseRule, fabricWidthRule];
