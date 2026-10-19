/**
 * Zip closures (issue #143, FR-PAT-05, decision 143, 2): at the centre back or front the shell and its facings turn
 * from fold to seam; at the side the zip goes in the front's side seam (the left side when worn). Every zip seam gets
 * `ZIP_SEAM_ALLOWANCE_MM`; a zip shorter than the opening gets a paired zip-stop notch at its length from the top
 * (FR-VAL-04), and the zip is listed as a notion. Aldrich 6th ed., ch. 2, zips.
 */
import type { DesignSpec, Notch, Notion } from "@tafsila/schemas";
import {
  ZIP_END_CLEARANCE_MM,
  ZIP_LENGTH_MM,
  ZIP_LENGTH_STEP_MM,
  ZIP_TAPE_WIDTH_MM,
} from "../../constants/closure";
import { DraftingError } from "../../errors/drafting-error";
import { edgeSegments } from "../../pieces/measure";
import { type DraftContext, type PieceDraft, withNotion } from "../../pipeline/draft-context";
import { foldToSeam, withPiecesInPlace, withZipAllowance } from "./seam";
import {
  CENTRE_HALF,
  type CentrePosition,
  type ChainLink,
  centreFacings,
  chainLengthMm,
  locateOnChain,
  openingChain,
  SIDE_ZIP_HALF,
} from "./targets";

/** Id of the zip-stop notch. */
export const ZIP_STOP_ID = "zip-stop";

/** Id of the zip notion. */
export const ZIP_NOTION_ID = "zip";

/**
 * The zip length for a design: a number from the table, or the whole opening for `full` (rounded down to the step).
 *
 * @param spec - The design.
 * @param openingMm - Length of the opening.
 * @returns Zip length in mm and whether it runs the whole opening.
 * @throws {DraftingError} CLOSURE_ZIP_TOO_LONG when the zip does not stop `ZIP_END_CLEARANCE_MM` above the bottom.
 */
export function zipLengthFor(spec: DesignSpec, openingMm: number): { lengthMm: number; full: boolean } {
  const table: Partial<Record<DesignSpec["closure"]["position"], number | "full">> =
    ZIP_LENGTH_MM[spec.category];
  const value = table[spec.closure.position];
  if (value === "full" || value === undefined) {
    return { lengthMm: Math.floor(openingMm / ZIP_LENGTH_STEP_MM) * ZIP_LENGTH_STEP_MM, full: true };
  }
  if (value > openingMm - ZIP_END_CLEARANCE_MM) {
    throw new DraftingError(
      "CLOSURE_ZIP_TOO_LONG",
      `A ${value} mm zip does not fit a ${Math.round(openingMm)} mm opening`,
    );
  }
  return { lengthMm: value, full: false };
}

/**
 * Distance along an edge from its start, for a distance down from its top (the end with the smaller y).
 *
 * @param link - The chain link.
 * @param downMm - Distance from the link's top.
 * @returns Distance from the edge start.
 */
function atFromStart(link: ChainLink, downMm: number): number {
  const segments = edgeSegments(link.piece, link.edgeId);
  const startsAtTop = segments[0]!.from.y <= segments.at(-1)!.to.y;
  return startsAtTop ? downMm : link.lengthMm - downMm;
}

/**
 * The zip-stop notch on the link where the zip ends; it pairs with the same edge on the mirrored copy (centre) or
 * with the back's side seam (side).
 *
 * @param chain - The opening.
 * @param lengthMm - Zip length.
 * @returns The link's piece with the notch.
 */
function withStopNotch(chain: readonly ChainLink[], lengthMm: number): PieceDraft {
  const { link, downMm } = locateOnChain(chain, lengthMm);
  const own = link.piece.edges.find((e) => e.id === link.edgeId)!;
  const partner = own.pairsWith ?? { pieceId: link.piece.id, edgeId: link.edgeId };
  const notch: Notch = {
    id: ZIP_STOP_ID,
    edgeId: link.edgeId,
    atMm: atFromStart(link, downMm),
    pairsWith: { pieceId: partner.pieceId, edgeId: partner.edgeId },
  };
  return { ...link.piece, notches: [...link.piece.notches, notch] };
}

/**
 * The zip notion.
 *
 * @param lengthMm - Zip length.
 * @param position - Where it goes.
 * @returns The notion.
 */
function zipNotion(lengthMm: number, position: DesignSpec["closure"]["position"]): Notion {
  const where = {
    "center-back": { ar: "في المنتصف الخلفي", en: "centre back" },
    "center-front": { ar: "في المنتصف الأمامي", en: "centre front" },
    side: { ar: "في الجنب الأيسر", en: "left side seam" },
  }[position];
  return {
    id: ZIP_NOTION_ID,
    kind: "zip",
    name: { ar: `سوستة ${where.ar}`, en: `Zip, ${where.en}` },
    lengthMm,
    widthMm: ZIP_TAPE_WIDTH_MM,
    quantity: 1,
  };
}

/**
 * Turns the centre line of one half from fold to seam: the shell chain and the facings on it.
 *
 * @param ctx - Context after the garment modules.
 * @param position - Centre back or front.
 * @returns The new context.
 */
export function centreSeams(ctx: DraftContext, position: CentrePosition): DraftContext {
  const half = CENTRE_HALF[position];
  const shell = openingChain(ctx, half, true).map((l) => foldToSeam(l.piece, l.edgeId, true));
  const facings = centreFacings(half).flatMap(({ pieceId, edgeId }) =>
    ctx.pieces.filter((p) => p.id === pieceId).map((p) => foldToSeam(p, edgeId, false)),
  );
  return withPiecesInPlace(ctx, [...shell, ...facings]);
}

/**
 * Drafts a zip closure.
 *
 * @param ctx - Context after the garment modules.
 * @returns The new context.
 * @throws {DraftingError} CLOSURE_ZIP_TOO_LONG or CLOSURE_TARGET_MISSING.
 */
export function draftZip(ctx: DraftContext): DraftContext {
  const { position } = ctx.spec.closure;
  const seamed = position === "side" ? ctx : centreSeams(ctx, position);
  const half = position === "side" ? SIDE_ZIP_HALF : CENTRE_HALF[position];
  const chain = openingChain(seamed, half, position !== "side");
  const zip = zipLengthFor(ctx.spec, chainLengthMm(chain));
  const refs = chain.flatMap((l) => {
    const pair = l.piece.edges.find((e) => e.id === l.edgeId)?.pairsWith;
    const own = `${l.piece.id}/${l.edgeId}`;
    const other = pair && `${pair.pieceId}/${pair.edgeId}`;
    return other && other !== own ? [own, other] : [own];
  });
  const notched = zip.full ? seamed : withPiecesInPlace(seamed, [withStopNotch(chain, zip.lengthMm)]);
  return withNotion(withZipAllowance(notched, refs), zipNotion(zip.lengthMm, position));
}
