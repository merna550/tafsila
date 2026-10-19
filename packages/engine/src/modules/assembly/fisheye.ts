/**
 * Fisheye darts and the waist body line of a bodice that runs below the waist (issue #144, decision 144, 4).
 * Aldrich, Metric Pattern Cutting for Women's Wear, ch. 3 "One-piece dress block": the waist dart continues below the
 * waist to a lower apex, at the skirt method's dart length (Aldrich ch. 2 "Skirt block").
 */
import type { BodyLine, Dart, Point } from "@tafsila/schemas";
import { FISHEYE_HIP_CLEARANCE_MM, INTERIOR_DART_EDGE_ID } from "../../constants/assembly";
import { SKIRT_DART_LENGTH_MM } from "../../constants/skirt-block";
import { add, distance, lerp, normalize, perpendicular, scale, sub } from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";
import type { GarmentHalf } from "./waist-seam";

/** Id of the bodice waist dart. */
const WAIST_DART_ID = "waist-dart";

/** Id of the lower half of a fisheye dart. */
export const LOWER_DART_ID = "waist-dart-lower";

/** Id of the bodice waist body line (kept, so FR-VAL-03 still measures the waist). */
const WAIST_LINE_ID = "bodice-waist";

/**
 * The lower apex of a fisheye dart: on the bisector of the waist legs, below the waist, at the skirt dart length for
 * the half, kept `FISHEYE_HIP_CLEARANCE_MM` above the hip line. Both lower legs are equal by construction.
 *
 * @param legs - The waist legs of the bodice dart.
 * @param half - Front or back.
 * @param hipY - y of the hip line.
 * @returns The lower apex.
 */
export function lowerApex(legs: readonly [Point, Point], half: GarmentHalf, hipY: number): Point {
  const mouth = lerp(legs[0], legs[1], 1 / 2);
  const across = perpendicular(normalize(sub(legs[1], legs[0])));
  const down = across.y < 0 ? scale(across, -1) : across;
  const lengthMm = Math.min(SKIRT_DART_LENGTH_MM[half], hipY - mouth.y - FISHEYE_HIP_CLEARANCE_MM);
  return add(mouth, scale(down, lengthMm));
}

/**
 * The darts of a piece once its waist dart becomes a fisheye: the upper half keeps the bodice apex and legs, the lower
 * half shares the legs. Both lie inside the piece (`INTERIOR_DART_EDGE_ID`). Other darts are kept.
 *
 * @param piece - The bodice piece.
 * @param half - Front or back.
 * @param hipY - y of the hip line.
 * @returns The new dart list.
 */
export function fisheyeDarts(piece: PieceDraft, half: GarmentHalf, hipY: number): Dart[] {
  return piece.darts.flatMap((dart) => {
    if (dart.id !== WAIST_DART_ID) return [dart];
    const upper: Dart = { ...dart, edgeId: INTERIOR_DART_EDGE_ID };
    const lower: Dart = {
      id: LOWER_DART_ID,
      edgeId: INTERIOR_DART_EDGE_ID,
      apex: lowerApex(dart.legs, half, hipY),
      legs: dart.legs,
    };
    return [upper, lower];
  });
}

/**
 * The waist body line along the old waist row, from one end of the waist to the other. A fisheye dart it crosses is
 * left out of the measured length, as the closed dart would be.
 *
 * @param piece - The bodice piece as drafted.
 * @param ends - First and last point of its waist edge.
 * @returns The polyline body line.
 */
export function waistBodyLine(piece: PieceDraft, ends: readonly [Point, Point]): BodyLine {
  const intakeMm = piece.darts
    .filter((d) => d.id === WAIST_DART_ID)
    .reduce((sum, d) => sum + distance(d.legs[0], d.legs[1]), 0);
  return {
    id: WAIST_LINE_ID,
    measurement: "waist",
    kind: "polyline",
    points: [ends[0], ends[1]],
    ...(intakeMm > 0 ? { overlapMm: intakeMm } : {}),
  };
}

/**
 * The piece's body lines: bust kept, waist redrawn along the waist row, hip added.
 *
 * @param piece - The bodice piece as drafted.
 * @param waist - The waist body line.
 * @param hip - The hip body line.
 * @returns The new list.
 */
export function bodyLinesBelowWaist(piece: PieceDraft, waist: BodyLine, hip: BodyLine): BodyLine[] {
  return [...piece.bodyLines.filter((l) => l.id !== WAIST_LINE_ID), waist, hip];
}
