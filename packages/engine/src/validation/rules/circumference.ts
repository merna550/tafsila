/** Geometry-derived bust, waist and hip circumference validation (FR-VAL-03). */
import type { BodyLine, ValidationCheck } from "@tafsila/schemas";
import { CIRCUMFERENCE_TOLERANCE_MM } from "../../constants/validation";
import { bodyLineLengthMm, bodyLineMultiplier } from "../../pieces/body-lines";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../messages";

/** One piece contribution to a full-garment body line. */
interface Contribution {
  readonly piece: PieceDraft;
  readonly line: BodyLine;
}

/**
 * Groups body-line declarations by garment line id.
 *
 * @param ctx - Finished drafting context.
 * @returns Piece contributions keyed by garment body-line id.
 */
function bodyLineGroups(ctx: DraftContext): Map<string, Contribution[]> {
  const groups = new Map<string, Contribution[]>();
  for (const piece of ctx.pieces) {
    for (const line of piece.bodyLines) {
      groups.set(line.id, [...(groups.get(line.id) ?? []), { piece, line }]);
    }
  }
  return groups;
}

/**
 * Builds one report row per declared garment circumference.
 *
 * @param ctx - Finished drafting context.
 * @returns Circumference validation checks.
 */
function circumferenceChecks(ctx: DraftContext): readonly ValidationCheck[] {
  if (!ctx.inputs) return [];
  return [...bodyLineGroups(ctx).entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([id, contributions]) => {
      const refs = contributions
        .map(({ piece }) => `${piece.id}/body-line:${id}`)
        .sort((a, b) => a.localeCompare(b, "en"));
      const measured = contributions.map(({ piece, line }) => ({
        piece,
        line,
        lengthMm: bodyLineLengthMm(piece, line),
      }));
      const broken = measured.find(({ lengthMm }) => lengthMm === undefined);
      if (broken) {
        return {
          id: "FR-VAL-03",
          code: "CIRCUMFERENCE_BROKEN_LINE",
          status: "fail",
          message: formatMessage("CIRCUMFERENCE_BROKEN_LINE", { line: id, piece: broken.piece.id }),
          refs,
        };
      }
      const measurement = contributions[0]!.line.measurement;
      const measuredMm = measured.reduce(
        (sum, item) => sum + item.lengthMm! * bodyLineMultiplier(item.piece),
        0,
      );
      const expectedMm = ctx.measurements[measurement] + ctx.inputs!.totalEaseMm[measurement];
      const passes = Math.abs(measuredMm - expectedMm) <= CIRCUMFERENCE_TOLERANCE_MM;
      const code = passes ? "CIRCUMFERENCE_OK" : "CIRCUMFERENCE_MISMATCH";
      return {
        id: "FR-VAL-03",
        code,
        status: passes ? "pass" : "fail",
        message: formatMessage(code, { line: id, mm: measuredMm, expected: expectedMm }),
        measuredMm,
        expectedMm,
        refs,
      };
    });
}

/** Validates each declared garment circumference independently. */
export const circumferenceRule: ValidationRule = {
  id: "FR-VAL-03",
  code: "CIRCUMFERENCE_MISMATCH",
  appliesTo: (ctx) => ctx.inputs !== undefined && ctx.pieces.some((piece) => piece.bodyLines.length > 0),
  run: (ctx) => circumferenceChecks(ctx)[0]!,
  runMany: circumferenceChecks,
};

/** Core circumference rules. */
export const CIRCUMFERENCE_RULES: readonly ValidationRule[] = [circumferenceRule];
