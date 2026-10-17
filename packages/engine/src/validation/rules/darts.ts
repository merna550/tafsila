/** Dart-leg and bust-point-limit validation (FR-VAL-07). */
import type { Dart, ValidationCheck } from "@tafsila/schemas";
import { DART_LEG_TOLERANCE_MM } from "../../constants/validation";
import { dartLegLengthsMm } from "../../pieces/measure";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../messages";

/**
 * Signed setback of a dart apex from its declared bust-point boundary.
 *
 * @param dart - Dart with optional bust-point metadata.
 * @returns Signed setback in mm, or undefined without a declared limit.
 */
function apexSetbackMm(dart: Dart): number | undefined {
  const limit = dart.bustPointLimit;
  if (!limit) return undefined;
  const delta = dart.apex[limit.axis] - limit.point[limit.axis];
  return limit.direction === "positive" ? delta : -delta;
}

/**
 * Builds one leg-length report row per dart.
 *
 * @param ctx - Finished drafting context.
 * @returns Dart-leg validation checks.
 */
function dartLegChecks(ctx: DraftContext): readonly ValidationCheck[] {
  return ctx.pieces.flatMap((piece) =>
    [...piece.darts]
      .sort((a, b) => a.id.localeCompare(b.id, "en"))
      .map((dart) => {
        const ref = `${piece.id}/${dart.id}`;
        const [firstMm, secondMm] = dartLegLengthsMm(dart);
        const measuredMm = Math.abs(firstMm - secondMm);
        const passes = measuredMm <= DART_LEG_TOLERANCE_MM;
        const code = passes ? "DART_LEGS_OK" : "DART_LEGS_MISMATCH";
        return {
          id: "FR-VAL-07",
          code,
          status: passes ? "pass" : "fail",
          message: formatMessage(code, { ref, mm: measuredMm }),
          measuredMm,
          expectedMm: 0,
          refs: [ref],
        };
      }),
  );
}

/** Validates both legs of every dart, with measured deltas in the report. */
export const dartLegRule: ValidationRule = {
  id: "FR-VAL-07",
  code: "DART_LEGS_MISMATCH",
  appliesTo: (ctx) => ctx.pieces.some((piece) => piece.darts.length > 0),
  run: (ctx) => dartLegChecks(ctx)[0]!,
  runMany: dartLegChecks,
};

/**
 * Builds one bust-point-limit report row per annotated dart.
 *
 * @param ctx - Finished drafting context.
 * @returns Dart-apex validation checks.
 */
function dartApexChecks(ctx: DraftContext): readonly ValidationCheck[] {
  return ctx.pieces.flatMap((piece) =>
    piece.darts.flatMap((dart) => {
      const measuredMm = apexSetbackMm(dart);
      if (measuredMm === undefined) return [];
      const expectedMm = dart.bustPointLimit!.setbackMm;
      const passes = measuredMm >= expectedMm;
      const code = passes ? "DART_APEX_OK" : "DART_APEX_PAST_LIMIT";
      const ref = `${piece.id}/${dart.id}`;
      return [
        {
          id: "FR-VAL-07",
          code,
          status: passes ? "pass" : "fail",
          message: formatMessage(code, { ref, mm: measuredMm, expected: expectedMm }),
          measuredMm,
          expectedMm,
          refs: [ref],
        },
      ];
    }),
  );
}

/** Validates declared bust-point setback limits for dart apexes. */
export const dartApexRule: ValidationRule = {
  id: "FR-VAL-07",
  code: "DART_APEX_PAST_LIMIT",
  appliesTo: (ctx) =>
    ctx.pieces.some((piece) => piece.darts.some((dart) => dart.bustPointLimit !== undefined)),
  run: (ctx) => dartApexChecks(ctx)[0]!,
  runMany: dartApexChecks,
};

/** Core dart rules. */
export const DART_RULES: readonly ValidationRule[] = [dartLegRule, dartApexRule];
