/** Structural rules that every finished pattern piece must pass (FR-VAL-05). */
import type { Piece, ValidationCheck } from "@tafsila/schemas";
import { isClosed, samePoint, samplePath, selfIntersections } from "../../geometry";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../messages";

/**
 * Builds the shared passing result for a structural rule.
 *
 * @returns A passing FR-VAL-05 check.
 */
function structuralPass(): ValidationCheck {
  return { id: "FR-VAL-05", code: "STRUCT_OK", status: "pass", message: formatMessage("STRUCT_OK") };
}

/**
 * Reports whether two paths differ geometrically within the engine tolerance.
 *
 * @param first - First path.
 * @param second - Second path.
 * @returns True when the sampled paths have different points.
 */
function pathsDiffer(first: Piece["stitchPath"], second: Piece["stitchPath"]): boolean {
  const a = samplePath(first);
  const b = samplePath(second);
  return a.length !== b.length || a.some((point, index) => !samePoint(point, b[index]!));
}

/**
 * Counts crossings without letting malformed geometry make validation throw.
 *
 * @param path - Closed outline to inspect.
 * @returns Number of crossings, or one structural problem for malformed closed geometry.
 */
function crossingCount(path: Piece["stitchPath"]): number {
  if (!isClosed(path)) return 0;
  try {
    return selfIntersections(path).length;
  } catch {
    return 1;
  }
}

/** Fails when a stitch or cut outline is open. */
export const closedOutlineRule: ValidationRule = {
  id: "FR-VAL-05",
  code: "STRUCT_OPEN_PATH",
  appliesTo: () => true,
  run: (ctx: DraftContext): ValidationCheck => {
    const refs = ctx.pieces
      .filter(
        (piece) => !isClosed(piece.stitchPath) || piece.cutPath === undefined || !isClosed(piece.cutPath),
      )
      .map((piece) => piece.id)
      .sort((a, b) => a.localeCompare(b, "en"));
    if (refs.length === 0) return structuralPass();
    return {
      id: "FR-VAL-05",
      code: "STRUCT_OPEN_PATH",
      status: "fail",
      message: formatMessage("STRUCT_OPEN_PATH", { piece: refs[0]! }),
      refs,
    };
  },
};

/** Fails when a closed stitch or cut outline crosses itself. */
export const selfIntersectionRule: ValidationRule = {
  id: "FR-VAL-05",
  code: "STRUCT_SELF_INTERSECTION",
  appliesTo: () => true,
  run: (ctx: DraftContext): ValidationCheck => {
    const crossings = ctx.pieces
      .map((piece) => ({
        piece: piece.id,
        count: crossingCount(piece.stitchPath) + (piece.cutPath ? crossingCount(piece.cutPath) : 0),
      }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => a.piece.localeCompare(b.piece));
    if (crossings.length === 0) return structuralPass();
    const first = crossings[0]!;
    return {
      id: "FR-VAL-05",
      code: "STRUCT_SELF_INTERSECTION",
      status: "fail",
      message: formatMessage("STRUCT_SELF_INTERSECTION", { piece: first.piece, count: first.count }),
      refs: crossings.map(({ piece }) => piece),
    };
  },
};

/** Fails when a cut edge lacks allowance or a non-fold piece has no distinct cutting line. */
export const seamAllowancePresentRule: ValidationRule = {
  id: "FR-VAL-05",
  code: "STRUCT_MISSING_SA",
  appliesTo: () => true,
  run: (ctx: DraftContext): ValidationCheck => {
    const refs = ctx.pieces.flatMap((piece) => {
      const edgeRefs = piece.edges
        .filter((edge) => edge.kind !== "fold" && edge.seamAllowanceMm <= 0)
        .map((edge) => `${piece.id}/${edge.id}`);
      const allEdgesFold = piece.edges.length > 0 && piece.edges.every((edge) => edge.kind === "fold");
      const hasDistinctCutPath = piece.cutPath !== undefined && pathsDiffer(piece.stitchPath, piece.cutPath);
      const cutPathRefs = !allEdgesFold && !hasDistinctCutPath ? [piece.id] : [];
      return [...edgeRefs, ...cutPathRefs];
    });
    const uniqueRefs = [...new Set(refs)].sort((a, b) => a.localeCompare(b, "en"));
    if (uniqueRefs.length === 0) return structuralPass();
    const first = uniqueRefs.find((ref) => ref.includes("/")) ?? uniqueRefs[0]!;
    const [piece, edge = "cut-path"] = first.split("/");
    return {
      id: "FR-VAL-05",
      code: "STRUCT_MISSING_SA",
      status: "fail",
      message: formatMessage("STRUCT_MISSING_SA", { piece: piece!, edge }),
      refs: uniqueRefs,
    };
  },
};

/** All structural rules, before labels and plausibility checks. */
export const STRUCTURAL_RULES: readonly ValidationRule[] = [
  closedOutlineRule,
  selfIntersectionRule,
  seamAllowancePresentRule,
];
