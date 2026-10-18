/**
 * Balance notches of the set-in sleeve and of the bodice armhole it is sewn into (issue #134, decision 134, 3):
 * a single notch at the front, a double notch at the back, both measured from the underarm where the cap
 * carries no ease, and a shoulder-point notch at the top of the front cap edge, on the shoulder seam.
 */
import type { Notch } from "@tafsila/schemas";
import {
  SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM,
  SLEEVE_DOUBLE_NOTCH_GAP_MM,
  SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
} from "../../constants/sleeve-block";
import type { BodiceArmholeParts } from "../bodice/armhole-parts";
import { BODICE_ARMHOLE_EDGE, SLEEVE_EDGE, SLEEVE_NOTCH, SLEEVE_PIECE_ID } from "./ids";

/** Distances of the back double notch from the underarm. */
const BACK_FROM_UNDERARM_MM = [
  SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM,
  SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM + SLEEVE_DOUBLE_NOTCH_GAP_MM,
] as const;

/** Back notch ids, in the order of {@link BACK_FROM_UNDERARM_MM}. */
const BACK_IDS = [SLEEVE_NOTCH.back1, SLEEVE_NOTCH.back2] as const;

/**
 * Notches of the back bodice armhole. The armhole runs shoulder tip to underarm, so each sits at the armhole
 * length minus its distance from the underarm, and is compared from the edge end.
 *
 * @param armholeMm - Back armhole length.
 * @returns The double notch.
 */
export function backArmholeNotches(armholeMm: number): Notch[] {
  return BACK_IDS.map((id, i) => ({
    id,
    edgeId: BODICE_ARMHOLE_EDGE,
    atMm: armholeMm - BACK_FROM_UNDERARM_MM[i]!,
    pairsWith: { pieceId: SLEEVE_PIECE_ID, edgeId: SLEEVE_EDGE.capBack, reversed: true, alignFrom: "end" },
  }));
}

/**
 * The front balance notch of the bodice armhole, measured from the underarm (on the armhole part at the underarm).
 *
 * @param armholeMm - Length of the front armhole part that ends at the underarm.
 * @returns The front notch.
 */
export function frontArmholeNotch(armholeMm: number): Notch {
  return {
    id: SLEEVE_NOTCH.front,
    edgeId: BODICE_ARMHOLE_EDGE,
    atMm: armholeMm - SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
    pairsWith: { pieceId: SLEEVE_PIECE_ID, edgeId: SLEEVE_EDGE.capFront, alignFrom: "end" },
  };
}

/**
 * The shoulder-point notch at the tip of the front bodice armhole (on the armhole part at the shoulder tip).
 *
 * @returns The shoulder notch.
 */
export function shoulderArmholeNotch(): Notch {
  return {
    id: SLEEVE_NOTCH.shoulder,
    edgeId: BODICE_ARMHOLE_EDGE,
    atMm: 0,
    pairsWith: { pieceId: SLEEVE_PIECE_ID, edgeId: SLEEVE_EDGE.capFront },
  };
}

/**
 * Notches of the sleeve cap. The back cap edge runs underarm to shoulder point (opposite to the bodice), the
 * front one shoulder point to underarm (the same way as the bodice).
 *
 * Each pairs with the bodice armhole part it sits on: the back and front notches with the part at the underarm, the
 * shoulder notch with the part at the shoulder tip (decision 138, 5).
 *
 * @param capFrontMm - Length of the front cap edge.
 * @param armholes - Bodice pieces holding each armhole, shoulder tip first.
 * @returns The back double notch, the shoulder notch and the front notch.
 */
export function sleeveCapNotches(capFrontMm: number, armholes: BodiceArmholeParts): Notch[] {
  const backUnderarmPiece = armholes.back.at(-1)!;
  const frontUnderarmPiece = armholes.front.at(-1)!;
  const frontTipPiece = armholes.front[0]!;
  const back: Notch[] = BACK_IDS.map((id, i) => ({
    id,
    edgeId: SLEEVE_EDGE.capBack,
    atMm: BACK_FROM_UNDERARM_MM[i]!,
    pairsWith: {
      pieceId: backUnderarmPiece,
      edgeId: BODICE_ARMHOLE_EDGE,
      reversed: true,
      alignFrom: "start",
    },
  }));
  return [
    ...back,
    {
      id: SLEEVE_NOTCH.shoulder,
      edgeId: SLEEVE_EDGE.capFront,
      atMm: 0,
      pairsWith: { pieceId: frontTipPiece, edgeId: BODICE_ARMHOLE_EDGE },
    },
    {
      id: SLEEVE_NOTCH.front,
      edgeId: SLEEVE_EDGE.capFront,
      atMm: capFrontMm - SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
      pairsWith: { pieceId: frontUnderarmPiece, edgeId: BODICE_ARMHOLE_EDGE, alignFrom: "end" },
    },
  ];
}
