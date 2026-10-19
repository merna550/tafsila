/**
 * The cap sleeve (issue #142, decision 142, 3). Aldrich 6th ed., ch. 2 (sleeve variations: cap sleeve): the set-in
 * block cap between the back and front balance notches, closed by a curved hem through the hem line at the grain, with
 * no underarm seam. Self-lined: cut four, the hem sewn right sides together and turned through.
 */
import type { EngineOptions } from "@tafsila/schemas";
import type { BodiceArmholeParts } from "../../blocks/bodice/armhole-parts";
import { SLEEVE_EDGE } from "../../blocks/sleeve/ids";
import type { SleeveDraft } from "../../blocks/sleeve/types";
import {
  SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM,
  SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
} from "../../constants/sleeve-block";
import { PARTIAL_SLEEVE_GRAIN_INSET_MM } from "../../constants/sleeve-style";
import { curveThroughPoints, pathLength, pt, splitAtLength, sub, subPath } from "../../geometry";
import { edgeLengthMm, edgeSegments } from "../../pieces/measure";
import type { PieceDraft } from "../../pipeline/draft-context";
import { partialSleevePiece } from "./partial";

/** Id of the cap sleeve piece. */
export const CAP_SLEEVE_PIECE_ID = "cap-sleeve";

/** Layers of a self-lined cap sleeve per arm. */
const SELF_LINED_LAYERS = 2;

/** Arms. */
const PAIR = 2;

/**
 * Drafts the cap sleeve from the set-in block.
 *
 * @param block - The set-in sleeve block of the same length (cap or short).
 * @param armholes - Bodice pieces holding each armhole.
 * @param options - Engine options, for the seam allowances.
 * @returns The cap sleeve piece.
 */
export function capSleevePiece(
  block: SleeveDraft,
  armholes: BodiceArmholeParts,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft {
  const whole = [
    ...edgeSegments(block.piece, SLEEVE_EDGE.capBack),
    ...edgeSegments(block.piece, SLEEVE_EDGE.capFront),
  ];
  const span = subPath(
    whole,
    SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM,
    pathLength(whole) - SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
  );
  const backMm = edgeLengthMm(block.piece, SLEEVE_EDGE.capBack) - SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM;
  const [capBack, capFront] = splitAtLength(span, backMm);
  const frontEnd = capFront.at(-1)!.to;
  const backEnd = capBack[0]!.from;
  const hemMid = pt(0, block.hemYMm);
  const hem = curveThroughPoints([frontEnd, hemMid, backEnd], sub(hemMid, frontEnd), sub(backEnd, hemMid));
  return partialSleevePiece(
    {
      id: CAP_SLEEVE_PIECE_ID,
      quantity: PAIR * SELF_LINED_LAYERS,
      capBack,
      capFront,
      rest: hem,
      restEdges: [{ id: SLEEVE_EDGE.hem, kind: "other", segments: hem.length }],
      grainLine: [pt(0, PARTIAL_SLEEVE_GRAIN_INSET_MM), pt(0, block.hemYMm - PARTIAL_SLEEVE_GRAIN_INSET_MM)],
    },
    armholes,
    options,
  );
}
