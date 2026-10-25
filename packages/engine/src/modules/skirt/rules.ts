/**
 * Validation rules of the straight and A-line skirt modules (issue #135): walking ease (FR-VAL-08) and the slit
 * length (FR-VAL-08). Decision 135-straight-a-line-skirt.
 */
import type { DesignSpec, ValidationCheck } from "@tafsila/schemas";
import { SKIRT_PIECE_ID } from "../../blocks/skirt/edges";
import { SLIT_MAX_LENGTH_KEY, SLIT_SKIRT_TYPES, WALKING_HEM_MIN_MM } from "../../constants/skirt-style";
import { bodyLineMultiplier } from "../../pieces/body-lines";
import { edgeLengthMm } from "../../pieces/measure";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../../validation/messages";

/** The skirt pieces' ids. */
const SKIRT_PIECE_IDS: ReadonlySet<string> = new Set(Object.values(SKIRT_PIECE_ID));

/**
 * Finished hem circumference of the skirt: each skirt piece's hem times the copies it is cut in.
 *
 * @param ctx - Context after drafting.
 * @returns Hem circumference in mm.
 */
export function hemCircumferenceMm(ctx: DraftContext): number {
  return ctx.pieces
    .filter((piece) => SKIRT_PIECE_IDS.has(piece.id))
    .reduce((sum, piece) => sum + edgeLengthMm(piece, "hem") * bodyLineMultiplier(piece), 0);
}

/**
 * True when the skirt hem is below the knee.
 *
 * @param ctx - Context with resolved inputs.
 * @returns Whether the resolved length passes the knee.
 */
function belowKnee(ctx: DraftContext): boolean {
  const lengthMm = ctx.inputs?.skirtLengthMm;
  return lengthMm !== undefined && lengthMm > ctx.measurements.waistToKnee;
}

/** Warns when a straight skirt below the knee has no slit and a hem too narrow to walk in (FR-VAL-08). */
export const walkingEaseRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "PLAUS_WALKING_EASE",
  appliesTo: (ctx) =>
    ctx.spec.skirt?.type === "straight" && ctx.spec.skirt.slit === undefined && belowKnee(ctx),
  run: (ctx): ValidationCheck => {
    const measuredMm = hemCircumferenceMm(ctx);
    const refs = [...SKIRT_PIECE_IDS].map((id) => `${id}/hem`);
    if (measuredMm >= WALKING_HEM_MIN_MM) {
      return { id: "FR-VAL-08", code: "PLAUS_OK", status: "pass", message: formatMessage("PLAUS_OK") };
    }
    return {
      id: "FR-VAL-08",
      code: "PLAUS_WALKING_EASE",
      status: "warn",
      message: formatMessage("PLAUS_WALKING_EASE", { mm: measuredMm, expected: WALKING_HEM_MIN_MM }),
      measuredMm,
      expectedMm: WALKING_HEM_MIN_MM,
      refs,
    };
  },
};

/** The slit of a design, when it has one. */
type Slit = NonNullable<NonNullable<DesignSpec["skirt"]>["slit"]>;

/**
 * The slit and the longest slit the seam takes, when the slit module drafted for this design.
 *
 * @param ctx - Context after drafting.
 * @returns The slit and its limit in mm.
 */
function slitAndLimit(ctx: DraftContext): { slit: Slit; maxMm: number } {
  return { slit: ctx.spec.skirt!.slit!, maxMm: ctx.resolved[SLIT_MAX_LENGTH_KEY]! };
}

/** Fails a slit whose top would reach the hip line (FR-VAL-08); the slit is then not cut. */
export const slitLengthRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "SLIT_ABOVE_HIP",
  appliesTo: (ctx) => ctx.resolved[SLIT_MAX_LENGTH_KEY] !== undefined && ctx.spec.skirt?.slit !== undefined,
  run: (ctx): ValidationCheck => {
    const { slit, maxMm } = slitAndLimit(ctx);
    const passes = slit.lengthMm <= maxMm;
    const code = passes ? "SLIT_OK" : "SLIT_ABOVE_HIP";
    return {
      id: "FR-VAL-08",
      code,
      status: passes ? "pass" : "fail",
      message: formatMessage(code, { mm: slit.lengthMm, expected: maxMm }),
      measuredMm: slit.lengthMm,
      expectedMm: maxMm,
    };
  },
};

/** Warns that a slit was asked for on a skirt type that has no slit drafting (FR-VAL-08). */
export const slitTypeRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "SLIT_NOT_DRAFTED",
  appliesTo: (ctx) => ctx.spec.skirt?.slit !== undefined && !SLIT_SKIRT_TYPES.has(ctx.spec.skirt.type),
  run: (ctx): ValidationCheck => ({
    id: "FR-VAL-08",
    code: "SLIT_NOT_DRAFTED",
    status: "warn",
    message: formatMessage("SLIT_NOT_DRAFTED", { type: ctx.spec.skirt!.type }),
  }),
};
