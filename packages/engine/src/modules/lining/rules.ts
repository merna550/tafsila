/** Lining validation (issue #145, FR-VAL-08): the lining hem sits above the shell hem everywhere. */
import type { ValidationCheck } from "@tafsila/schemas";
import { LINING_HEM_RISE_MM, LINING_HEM_TOLERANCE_MM } from "../../constants/lining";
import { samplePath } from "../../geometry";
import { edgeSegments } from "../../pieces/measure";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage, shownMm } from "../../validation/messages";

/** Prefix of a lining piece id (kept in step with the module). */
const PREFIX = "lining-";

/**
 * The lowest point of a piece's hem.
 *
 * @param piece - A piece with a hem edge.
 * @returns The largest y of the hem (y runs down), or undefined without a hem.
 */
function hemBottom(piece: PieceDraft): number | undefined {
  const segments = edgeSegments(piece, "hem");
  return segments.length === 0 ? undefined : Math.max(...samplePath(segments).map((p) => p.y));
}

/**
 * One check per lining piece that has a hem.
 *
 * @param ctx - Finished context.
 * @returns The checks.
 */
function hemChecks(ctx: DraftContext): ValidationCheck[] {
  return ctx.pieces
    .filter((p) => p.id.startsWith(PREFIX))
    .flatMap((lining) => {
      const shell = ctx.pieces.find((p) => p.id === lining.id.slice(PREFIX.length));
      const [shellY, liningY] = [shell && hemBottom(shell), hemBottom(lining)];
      if (shellY === undefined || liningY === undefined) return [];
      const mm = shownMm(shellY - liningY);
      const expected = LINING_HEM_RISE_MM - LINING_HEM_TOLERANCE_MM;
      const ok = mm >= expected;
      const code = ok ? "LINING_HEM_CLEARANCE_OK" : "LINING_HEM_CLEARANCE_LOW";
      return [
        {
          id: "FR-VAL-08" as const,
          code,
          status: ok ? ("pass" as const) : ("warn" as const),
          message: formatMessage(code, { mm, expected }),
          measuredMm: mm,
          expectedMm: expected,
          refs: [lining.id],
        },
      ];
    });
}

/** The lining hem clears the shell hem (FR-VAL-08). */
export const LINING_HEM_RULE: ValidationRule = {
  id: "FR-VAL-08",
  code: "LINING_HEM_CLEARANCE_LOW",
  appliesTo: (ctx) => ctx.pieces.some((p) => p.id.startsWith(PREFIX)),
  run: (ctx) => hemChecks(ctx)[0]!,
  runMany: hemChecks,
};
