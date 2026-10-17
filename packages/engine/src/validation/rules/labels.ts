/** Grain-line and piece-information rules for every pattern piece (FR-VAL-06). */
import type { ValidationCheck } from "@tafsila/schemas";
import { GEOMETRY_EPSILON_MM } from "../../constants/geometry";
import { distance } from "../../geometry";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../messages";

/**
 * Builds the shared passing result for a piece-information rule.
 *
 * @returns A passing FR-VAL-06 check.
 */
function labelsPass(): ValidationCheck {
  return { id: "FR-VAL-06", code: "LABELS_OK", status: "pass", message: formatMessage("LABELS_OK") };
}

/** Fails when a piece has no usable grain line. */
export const grainLineRule: ValidationRule = {
  id: "FR-VAL-06",
  code: "LABELS_NO_GRAIN",
  appliesTo: () => true,
  run: (ctx: DraftContext): ValidationCheck => {
    const refs = ctx.pieces
      .filter((piece) => distance(piece.grainLine[0], piece.grainLine[1]) <= GEOMETRY_EPSILON_MM)
      .map((piece) => piece.id)
      .sort((a, b) => a.localeCompare(b, "en"));
    return refs.length === 0
      ? labelsPass()
      : {
          id: "FR-VAL-06",
          code: "LABELS_NO_GRAIN",
          status: "fail",
          message: formatMessage("LABELS_NO_GRAIN", { piece: refs[0]! }),
          refs,
        };
  },
};

/** Fails when a piece lacks either its Arabic or English name. */
export const pieceNameRule: ValidationRule = {
  id: "FR-VAL-06",
  code: "LABELS_NO_NAME",
  appliesTo: () => true,
  run: (ctx: DraftContext): ValidationCheck => {
    const refs = ctx.pieces
      .filter((piece) => piece.name.ar.trim() === "" || piece.name.en.trim() === "")
      .map((piece) => piece.id)
      .sort((a, b) => a.localeCompare(b, "en"));
    return refs.length === 0
      ? labelsPass()
      : {
          id: "FR-VAL-06",
          code: "LABELS_NO_NAME",
          status: "fail",
          message: formatMessage("LABELS_NO_NAME", { piece: refs[0]! }),
          refs,
        };
  },
};

/** Fails when a piece has no positive cut quantity. */
export const cutQuantityRule: ValidationRule = {
  id: "FR-VAL-06",
  code: "LABELS_NO_CUT_INFO",
  appliesTo: () => true,
  run: (ctx: DraftContext): ValidationCheck => {
    const refs = ctx.pieces
      .filter((piece) => piece.cut.quantity < 1)
      .map((piece) => piece.id)
      .sort((a, b) => a.localeCompare(b, "en"));
    return refs.length === 0
      ? labelsPass()
      : {
          id: "FR-VAL-06",
          code: "LABELS_NO_CUT_INFO",
          status: "fail",
          message: formatMessage("LABELS_NO_CUT_INFO", { piece: refs[0]! }),
          refs,
        };
  },
};

/** All grain-line and piece-information rules. */
export const LABEL_RULES: readonly ValidationRule[] = [grainLineRule, pieceNameRule, cutQuantityRule];
