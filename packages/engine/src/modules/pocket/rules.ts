/**
 * Pocket validation (issue #145, FR-VAL-04): the distance between a bag's notches equals the distance between the
 * shell's notches on the side seam, within the notch tolerance.
 */
import type { ValidationCheck } from "@tafsila/schemas";
import { POCKET_OPENING_MM, POCKET_OPENING_TOLERANCE_MM } from "../../constants/pocket";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../../validation/messages";
import { BAG_IDS, POCKET_BOTTOM_NOTCH_ID, POCKET_TOP_NOTCH_ID } from "./side-seam";

/**
 * Distance between the two opening notches of a piece, or undefined when it lacks them.
 *
 * @param piece - A shell or bag piece.
 * @returns Distance in mm.
 */
function openingMm(piece: PieceDraft): number | undefined {
  const top = piece.notches.find((n) => n.id === POCKET_TOP_NOTCH_ID)?.atMm;
  const bottom = piece.notches.find((n) => n.id === POCKET_BOTTOM_NOTCH_ID)?.atMm;
  return top === undefined || bottom === undefined ? undefined : Math.abs(bottom - top);
}

/**
 * One check per bag against the shell piece that carries the same notches.
 *
 * @param ctx - Finished context.
 * @returns The checks.
 */
function openingChecks(ctx: DraftContext): ValidationCheck[] {
  const shell = ctx.pieces.filter((p) => !BAG_IDS.some((b) => b === p.id) && openingMm(p) !== undefined);
  const expectedMm = shell[0] ? openingMm(shell[0])! : POCKET_OPENING_MM;
  const shellId = shell[0]?.id ?? "side";
  return BAG_IDS.flatMap((id) => {
    const bag = ctx.pieces.find((p) => p.id === id);
    const measuredMm = bag && openingMm(bag);
    if (measuredMm === undefined) return [];
    const ok = Math.abs(measuredMm - expectedMm) <= POCKET_OPENING_TOLERANCE_MM;
    const code = ok ? "POCKET_OPENING_MATCH_OK" : "POCKET_OPENING_MATCH_MISMATCH";
    return [
      {
        id: "FR-VAL-04" as const,
        code,
        status: ok ? ("pass" as const) : ("fail" as const),
        message: formatMessage(code, { first: id, second: shellId, mm: measuredMm, expected: expectedMm }),
        measuredMm,
        expectedMm,
        refs: [id, shellId],
      },
    ];
  });
}

/** The bag opening matches the shell opening (FR-VAL-04). */
export const pocketOpeningRule: ValidationRule = {
  id: "FR-VAL-04",
  code: "POCKET_OPENING_MATCH_MISMATCH",
  appliesTo: (ctx) => ctx.pieces.some((p) => p.id === BAG_IDS[0]),
  run: (ctx) => openingChecks(ctx)[0]!,
  runMany: openingChecks,
};
