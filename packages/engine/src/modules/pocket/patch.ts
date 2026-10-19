/**
 * Patch pockets (issue #145, decision 145): one rectangular piece, cut twice, and four dashed placement lines on the
 * front shell. The top edge is a hem; the other three turn under. A fold piece shows one placement, which mirrors
 * when it is cut, so the mark says "both sides".
 */
import type { Mark, Point } from "@tafsila/schemas";
import { buildEdges } from "../../blocks/shared/edges";
import {
  PATCH_CENTRE_SHARE,
  PATCH_GRAIN_SHARE,
  PATCH_POCKET_HEIGHT_MM,
  PATCH_POCKET_HEM_MM,
  PATCH_POCKET_TURN_UNDER_MM,
  PATCH_POCKET_WIDTH_MM,
  PATCH_TOP_BELOW_WAIST_MM,
  POCKET_HEM_CLEARANCE_MM,
} from "../../constants/pocket";
import { BUTTON_EXTENSION_MM } from "../../constants/closure";
import { DraftingError } from "../../errors/drafting-error";
import { lineSeg, pt } from "../../geometry";
import { PIECE_NAMES } from "../../i18n/pieces";
import { withEdgeAllowance } from "../../pieces/edge-allowance";
import { chainLengthMm, openingChain } from "../../pieces/seam-chain";
import { type DraftContext, type PieceDraft, withPiece, withPieces } from "../../pipeline/draft-context";
import { edgePointsTopFirst, waistDownMm, waistYAt, xOnEdgeAtY } from "./placement";

/** Id of the patch pocket piece. */
export const PATCH_POCKET_ID = "patch-pocket";

/** Margin kept between the placement rectangle and the piece outline, in mm. */
const EDGE_MARGIN_MM = 5;

/**
 * The patch pocket piece: top hem, then right, bottom and left turn-unders.
 *
 * @param ctx - Context, for the seam allowances.
 * @returns The piece.
 */
function patchPiece(ctx: DraftContext): PieceDraft {
  const [w, h] = [PATCH_POCKET_WIDTH_MM, PATCH_POCKET_HEIGHT_MM];
  const edges = buildEdges(
    PATCH_POCKET_ID,
    [
      { id: "top", kind: "hem", segments: 1 },
      { id: "right", kind: "other", segments: 1 },
      { id: "bottom", kind: "other", segments: 1 },
      { id: "left", kind: "other", segments: 1 },
    ],
    ctx.options,
  );
  return {
    id: PATCH_POCKET_ID,
    name: PIECE_NAMES[PATCH_POCKET_ID]!,
    cut: { quantity: 2, onFold: false, mirror: false, fabric: "main" },
    stitchPath: [
      lineSeg(pt(0, 0), pt(w, 0)),
      lineSeg(pt(w, 0), pt(w, h)),
      lineSeg(pt(w, h), pt(0, h)),
      lineSeg(pt(0, h), pt(0, 0)),
    ],
    edges,
    notches: [],
    bodyLines: [],
    grainLine: [pt(w / 2, h * PATCH_GRAIN_SHARE.from), pt(w / 2, h * PATCH_GRAIN_SHARE.to)],
    darts: [],
  };
}

/**
 * The four placement lines, one per side of the rectangle.
 *
 * @param corners - Top-left, top-right, bottom-right, bottom-left.
 * @returns The marks.
 */
function placementMarks(corners: readonly [Point, Point, Point, Point]): Mark[] {
  const names = ["top", "right", "bottom", "left"] as const;
  return names.map((name, i) => ({
    id: `pocket-placement-${name}`,
    kind: "pocket-placement",
    shape: "line",
    from: corners[i]!,
    to: corners[(i + 1) % names.length]!,
    ...(i === 0
      ? { text: { ar: "جيب مثبّت: مكانه على الجهتين", en: "Patch pocket: place here, both sides" } }
      : {}),
  }));
}

/**
 * Drafts the patch pockets.
 *
 * @param ctx - Context after the garment modules and the waistband.
 * @returns The context with the patch piece and the placement marks on the front shell.
 * @throws {DraftingError} POCKET_NO_ROOM when the patch does not fit above the hem or inside the front.
 */
export function draftPatchPockets(ctx: DraftContext): DraftContext {
  const front =
    ctx.pieces.find((p) => p.id === "skirt-front") ?? ctx.pieces.find((p) => p.id === "bodice-front");
  if (!front) throw new DraftingError("POCKET_TARGET_MISSING", "No front piece to place a patch pocket on");
  const chain = openingChain(ctx, "front", false);
  const topDownMm = waistDownMm(chain) + PATCH_TOP_BELOW_WAIST_MM;
  if (topDownMm + PATCH_POCKET_HEIGHT_MM + POCKET_HEM_CLEARANCE_MM > chainLengthMm(chain)) {
    throw new DraftingError(
      "POCKET_NO_ROOM",
      `The patch pocket does not fit above the hem (${topDownMm} mm down)`,
    );
  }
  const cfX = front.edges.some((e) => e.id === "cf")
    ? edgePointsTopFirst(front, "cf")[0]!.x
    : Math.min(...front.stitchPath.map((seg) => seg.from.x));
  const guessY = waistYAt(front, cfX) + PATCH_TOP_BELOW_WAIST_MM;
  const sideX = xOnEdgeAtY(front, "side", guessY + PATCH_POCKET_HEIGHT_MM / 2);
  const buttons = ctx.spec.closure.type === "buttons" && ctx.spec.closure.position === "center-front";
  const centreX = cfX + (buttons ? BUTTON_EXTENSION_MM : 0) + PATCH_CENTRE_SHARE * (sideX - cfX);
  const [left, right] = [centreX - PATCH_POCKET_WIDTH_MM / 2, centreX + PATCH_POCKET_WIDTH_MM / 2];
  if (left < cfX + EDGE_MARGIN_MM || right > sideX - EDGE_MARGIN_MM) {
    throw new DraftingError("POCKET_NO_ROOM", "The patch pocket is wider than the front at this size");
  }
  const [top, bottom] = [guessY, guessY + PATCH_POCKET_HEIGHT_MM];
  const marks = placementMarks([pt(left, top), pt(right, top), pt(right, bottom), pt(left, bottom)]);
  const marked = { ...front, marks: [...(front.marks ?? []), ...marks] };
  const withAllowance = withEdgeAllowance(
    withEdgeAllowance(ctx, [`${PATCH_POCKET_ID}/top`], PATCH_POCKET_HEM_MM),
    ["right", "bottom", "left"].map((e) => `${PATCH_POCKET_ID}/${e}`),
    PATCH_POCKET_TURN_UNDER_MM,
  );
  const pieces = withAllowance.pieces.map((p) => (p.id === front.id ? marked : p));
  return withPiece(withPieces(withAllowance, pieces), patchPiece(withAllowance));
}
