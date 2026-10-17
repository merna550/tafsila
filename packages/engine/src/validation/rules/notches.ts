/** Paired-notch alignment validation (FR-VAL-04). */
import type { Edge, Notch, ValidationCheck } from "@tafsila/schemas";
import { NOTCH_ALIGNMENT_TOLERANCE_MM } from "../../constants/validation";
import { edgeLengthMm } from "../../pieces/measure";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../messages";

/** One notch with its owning piece and edge. */
interface OwnedNotch {
  readonly piece: PieceDraft;
  readonly edge: Edge;
  readonly notch: Notch;
}

/**
 * Stable reference used in reports.
 *
 * @param item - Owned notch.
 * @returns `piece/edge#notch` reference.
 */
function notchRef(item: OwnedNotch): string {
  return `${item.piece.id}/${item.edge.id}#${item.notch.id}`;
}

/**
 * Finds all notches on a named edge, in sewing-distance order.
 *
 * @param ctx - Finished drafting context.
 * @param pieceId - Owning piece id.
 * @param edgeId - Edge id.
 * @returns Owned notches in distance order.
 */
function notchesOn(ctx: DraftContext, pieceId: string, edgeId: string): OwnedNotch[] {
  const piece = ctx.pieces.find((candidate) => candidate.id === pieceId);
  const edge = piece?.edges.find((candidate) => candidate.id === edgeId);
  if (!piece || !edge) return [];
  return piece.notches
    .filter((notch) => notch.edgeId === edgeId)
    .sort((a, b) => a.atMm - b.atMm || a.id.localeCompare(b.id, "en"))
    .map((notch) => ({ piece, edge, notch }));
}

/**
 * Collects paired notches once, plus broken-reference rows that cannot be paired.
 *
 * @param ctx - Finished drafting context.
 * @returns Unique source/target notch pairs.
 */
function notchPairs(ctx: DraftContext): { source: OwnedNotch; target?: OwnedNotch }[] {
  const seen = new Set<string>();
  const output: { source: OwnedNotch; target?: OwnedNotch }[] = [];
  for (const piece of [...ctx.pieces].sort((a, b) => a.id.localeCompare(b.id, "en"))) {
    for (const edge of piece.edges) {
      const sources = notchesOn(ctx, piece.id, edge.id);
      sources.forEach((source, index) => {
        const pair = source.notch.pairsWith ?? edge.pairsWith;
        if (!pair) {
          const key = notchRef(source);
          if (!seen.has(key)) {
            seen.add(key);
            output.push({ source });
          }
          return;
        }
        const candidates = notchesOn(ctx, pair.pieceId, pair.edgeId);
        const fallbackIndex = pair.reversed ? candidates.length - 1 - index : index;
        const target =
          candidates.find((candidate) => candidate.notch.id === source.notch.id) ?? candidates[fallbackIndex];
        const key = target
          ? [notchRef(source), notchRef(target)].sort((a, b) => a.localeCompare(b, "en")).join("|")
          : notchRef(source);
        if (seen.has(key)) return;
        seen.add(key);
        output.push({ source, target });
      });
    }
  }
  return output.sort((a, b) => notchRef(a.source).localeCompare(notchRef(b.source), "en"));
}

/**
 * Builds a failure for a notch whose partner is missing.
 *
 * @param source - Source notch.
 * @returns Broken-reference check.
 */
function brokenNotchCheck(source: OwnedNotch): ValidationCheck {
  const sourceRef = notchRef(source);
  const pair = source.notch.pairsWith ?? source.edge.pairsWith;
  const targetRef = `${pair?.pieceId ?? "?"}/${pair?.edgeId ?? "?"}`;
  return {
    id: "FR-VAL-04",
    code: "NOTCH_BROKEN_REF",
    status: "fail",
    message: formatMessage("NOTCH_BROKEN_REF", { first: sourceRef, second: targetRef }),
    refs: [sourceRef, targetRef],
  };
}

/**
 * Builds the measured check for two existing notches.
 *
 * @param source - Source notch.
 * @param target - Matching target notch.
 * @returns Alignment check with measured offset.
 */
function measuredNotchCheck(source: OwnedNotch, target: OwnedNotch): ValidationCheck {
  const sourceRef = notchRef(source);
  const targetRef = notchRef(target);
  const pair = source.notch.pairsWith ?? source.edge.pairsWith;
  const targetAtMm = pair?.reversed
    ? edgeLengthMm(target.piece, target.edge.id, { closeDarts: true }) - target.notch.atMm
    : target.notch.atMm;
  const measuredMm = Math.abs(source.notch.atMm - targetAtMm);
  const passes = measuredMm <= NOTCH_ALIGNMENT_TOLERANCE_MM;
  const code = passes ? "NOTCH_OK" : "NOTCH_MISMATCH";
  return {
    id: "FR-VAL-04",
    code,
    status: passes ? "pass" : "fail",
    message: formatMessage(code, { first: sourceRef, second: targetRef, mm: measuredMm }),
    measuredMm,
    expectedMm: 0,
    refs: [sourceRef, targetRef],
  };
}

/**
 * Builds one notch-alignment check.
 *
 * @param source - Source notch.
 * @param target - Matching notch, or undefined for a broken reference.
 * @returns Alignment or broken-reference check.
 */
function notchCheck(source: OwnedNotch, target: OwnedNotch | undefined): ValidationCheck {
  return target ? measuredNotchCheck(source, target) : brokenNotchCheck(source);
}

/**
 * Builds one report row per paired notch.
 *
 * @param ctx - Finished drafting context.
 * @returns Notch-alignment validation checks.
 */
function notchChecks(ctx: DraftContext): readonly ValidationCheck[] {
  return notchPairs(ctx).map(({ source, target }) => notchCheck(source, target));
}

/** Validates every notch position from the same sewing end of its paired edge. */
export const notchAlignmentRule: ValidationRule = {
  id: "FR-VAL-04",
  code: "NOTCH_MISMATCH",
  appliesTo: (ctx) => ctx.pieces.some((piece) => piece.notches.length > 0),
  run: (ctx) => notchChecks(ctx)[0]!,
  runMany: notchChecks,
};

/** Core paired-notch rules. */
export const NOTCH_RULES: readonly ValidationRule[] = [notchAlignmentRule];
