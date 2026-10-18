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
import { BACK_PIECE_ID, FRONT_PIECE_ID } from "../bodice/piece-parts";
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
 * Notches of the front bodice armhole: the balance notch from the underarm, and the shoulder point at the tip.
 *
 * @param armholeMm - Front armhole length.
 * @returns The front notch and the shoulder notch.
 */
export function frontArmholeNotches(armholeMm: number): Notch[] {
  return [
    {
      id: SLEEVE_NOTCH.front,
      edgeId: BODICE_ARMHOLE_EDGE,
      atMm: armholeMm - SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
      pairsWith: { pieceId: SLEEVE_PIECE_ID, edgeId: SLEEVE_EDGE.capFront, alignFrom: "end" },
    },
    {
      id: SLEEVE_NOTCH.shoulder,
      edgeId: BODICE_ARMHOLE_EDGE,
      atMm: 0,
      pairsWith: { pieceId: SLEEVE_PIECE_ID, edgeId: SLEEVE_EDGE.capFront },
    },
  ];
}

/**
 * Notches of the sleeve cap. The back cap edge runs underarm to shoulder point (opposite to the bodice), the
 * front one shoulder point to underarm (the same way as the bodice).
 *
 * @param capFrontMm - Length of the front cap edge.
 * @returns The back double notch, the shoulder notch and the front notch.
 */
export function sleeveCapNotches(capFrontMm: number): Notch[] {
  const back: Notch[] = BACK_IDS.map((id, i) => ({
    id,
    edgeId: SLEEVE_EDGE.capBack,
    atMm: BACK_FROM_UNDERARM_MM[i]!,
    pairsWith: { pieceId: BACK_PIECE_ID, edgeId: BODICE_ARMHOLE_EDGE, reversed: true, alignFrom: "start" },
  }));
  return [
    ...back,
    {
      id: SLEEVE_NOTCH.shoulder,
      edgeId: SLEEVE_EDGE.capFront,
      atMm: 0,
      pairsWith: { pieceId: FRONT_PIECE_ID, edgeId: BODICE_ARMHOLE_EDGE },
    },
    {
      id: SLEEVE_NOTCH.front,
      edgeId: SLEEVE_EDGE.capFront,
      atMm: capFrontMm - SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
      pairsWith: { pieceId: FRONT_PIECE_ID, edgeId: BODICE_ARMHOLE_EDGE, alignFrom: "end" },
    },
  ];
}
