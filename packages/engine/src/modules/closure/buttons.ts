/**
 * Button closures (issue #143, FR-PAT-05, decision 143, 3 to 5): down the centre front or back, from the top of the
 * opening to the hem (blouse: the waist), every piece on that centre line gets the button extension, the shell gets evenly spaced button and
 * buttonhole marks on the centre line and a traced front facing with its interfacing, and the buttons are listed as a
 * notion. Aldrich 6th ed., ch. 3, button fronts.
 */
import type { Mark, Notion, PieceEdgeKind } from "@tafsila/schemas";
import {
  BUTTON_DIAMETER_MM,
  BUTTON_EXTENSION_MM,
  BUTTON_FIRST_FROM_TOP_MM,
  BUTTON_LAST_FROM_BOTTOM_MM,
  FRONT_FACING_WIDTH_MM,
} from "../../constants/closure";
import { FOLD_EDGE_KIND } from "../../constants/finishing";
import { DraftingError } from "../../errors/drafting-error";
import { add, scale } from "../../geometry";
import { facingNameText } from "../../i18n/pieces";
import { buttonholeMark, buttonMark, type ButtonStop, evenButtonStopsMm } from "../../pieces/button-marks";
import { type DraftContext, type PieceDraft, withNotion } from "../../pipeline/draft-context";
import { outwardNormal, withExtension } from "./extension";
import { facingEdges, facingGrain, traceFacing } from "./facing";
import { withPiecesInPlace } from "./seam";
import {
  CENTRE_EDGE_ID,
  CENTRE_HALF,
  type CentrePosition,
  type ChainLink,
  type Half,
  centreFacings,
  chainLengthMm,
  downAlong,
  locateOnChain,
  openingChain,
  straightEdge,
} from "./targets";

/** Id of the button notion. */
export const BUTTON_NOTION_ID = "buttons";

/** A front facing is cut as a mirrored pair. */
const FACING_PAIR = 2;

/**
 * The button positions on one link of the opening.
 *
 * @param chain - The whole opening.
 * @param link - The link.
 * @param stopsMm - Every button's distance from the top of the opening.
 * @returns The stops on this link, numbered across the whole opening.
 */
function stopsOn(chain: readonly ChainLink[], link: ChainLink, stopsMm: readonly number[]): ButtonStop[] {
  const edge = straightEdge(link.piece, link.edgeId);
  const down = downAlong(edge);
  const towardEdge = outwardNormal(link.piece, link.edgeId);
  return stopsMm.flatMap((mm, i) => {
    const { link: on, downMm } = locateOnChain(chain, mm);
    return on === link
      ? [{ key: String(i + 1), centre: add(edge.top, scale(down, downMm)), towardEdge }]
      : [];
  });
}

/**
 * The button and buttonhole marks of one link.
 *
 * @param stops - The stops on it.
 * @param half - The half the opening is on.
 * @returns The marks.
 */
function buttonMarks(stops: readonly ButtonStop[], half: Half): Mark[] {
  return stops.flatMap((stop) => [
    buttonMark(stop, BUTTON_DIAMETER_MM, half),
    buttonholeMark(stop, BUTTON_DIAMETER_MM, half),
  ]);
}

/**
 * The front facing traced from an extended shell piece, and its interfacing.
 *
 * @param shell - The extended shell piece.
 * @param edgeId - Its extended centre edge.
 * @returns The two pieces.
 */
export function frontFacingPieces(shell: PieceDraft, edgeId: string): PieceDraft[] {
  const traced = traceFacing(shell, edgeId, FRONT_FACING_WIDTH_MM);
  const grainLine = facingGrain(shell, edgeId, FRONT_FACING_WIDTH_MM);
  const stitchPath = traced.map((t) => t.segment);
  return [false, true].map((interfacing) => ({
    id: `${shell.id}-facing${interfacing ? "-interfacing" : ""}`,
    name: facingNameText(shell.name, interfacing),
    cut: { quantity: FACING_PAIR, onFold: false, mirror: true, fabric: interfacing ? "interfacing" : "main" },
    stitchPath,
    edges: facingEdges(shell, traced, !interfacing, edgeId),
    notches: [],
    bodyLines: [],
    grainLine,
    darts: [],
  }));
}

/**
 * Adds the extension to a facing that lies on the centre front fold (the neck facing), leaving others as they are.
 *
 * @param piece - The facing.
 * @param edgeId - Its centre edge.
 * @returns The new facing.
 */
function extendedFacing(piece: PieceDraft, edgeId: string): PieceDraft {
  const kind: PieceEdgeKind | undefined = piece.edges.find((e) => e.id === edgeId)?.kind;
  return kind === FOLD_EDGE_KIND ? withExtension(piece, edgeId, BUTTON_EXTENSION_MM) : piece;
}

/**
 * The buttons notion.
 *
 * @param count - Number of buttons.
 * @param half - The half the opening is on.
 * @returns The notion.
 */
function buttonNotion(count: number, half: Half): Notion {
  const where = half === "front" ? { ar: "للأمام", en: "Front" } : { ar: "للخلف", en: "Back" };
  return {
    id: BUTTON_NOTION_ID,
    kind: "button",
    name: {
      ar: `زراير ${BUTTON_DIAMETER_MM} مم ${where.ar}`,
      en: `${where.en} buttons, ${BUTTON_DIAMETER_MM} mm`,
    },
    lengthMm: BUTTON_DIAMETER_MM,
    widthMm: BUTTON_DIAMETER_MM,
    quantity: count,
  };
}

/**
 * Drafts a centre-front button closure.
 *
 * @param ctx - Context after the garment modules.
 * @returns The new context.
 * @throws {DraftingError} CLOSURE_TARGET_MISSING, CLOSURE_CENTRE_NOT_STRAIGHT or CLOSURE_FACING_INVALID.
 */
export function draftButtons(ctx: DraftContext): DraftContext {
  const half = CENTRE_HALF[ctx.spec.closure.position as CentrePosition];
  const edgeId = CENTRE_EDGE_ID[half];
  const chain = openingChain(ctx, half, true);
  const split = chain.find((link) => link.edgeId !== edgeId);
  if (split) {
    throw new DraftingError(
      "CLOSURE_UNSUPPORTED",
      `Buttons need a centre line, but ${split.piece.id} is split into panels`,
    );
  }
  const stopsMm = evenButtonStopsMm(
    BUTTON_FIRST_FROM_TOP_MM,
    chainLengthMm(chain) - BUTTON_LAST_FROM_BOTTOM_MM,
  );
  const shells = chain.map((link) => {
    const marks = buttonMarks(stopsOn(chain, link, stopsMm), half);
    return withExtension(
      { ...link.piece, marks: [...(link.piece.marks ?? []), ...marks] },
      edgeId,
      BUTTON_EXTENSION_MM,
    );
  });
  const facings = centreFacings(half).flatMap(({ pieceId, edgeId: facingEdge }) =>
    ctx.pieces.filter((p) => p.id === pieceId).map((p) => extendedFacing(p, facingEdge)),
  );
  const traced = shells.flatMap((shell) => frontFacingPieces(shell, edgeId));
  return withNotion(
    withPiecesInPlace(ctx, [...shells, ...facings, ...traced]),
    buttonNotion(stopsMm.length, half),
  );
}
