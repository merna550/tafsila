/**
 * Bust dart manipulation for the princess bodice (issue #138, decision 138, 1): the side-seam bust dart is closed by
 * pivoting the upper side of the front about a point level with the dart on the bust point's vertical, so its
 * intake opens into the princess line instead. Aldrich 6th ed., ch. 3, "dart manipulation: pivot method".
 */
import type { Point } from "@tafsila/schemas";
import { angleRad, pt, rotateAbout, sub, type Shape, type Moved } from "../../geometry";

/** The three points that describe the bust dart for the pivot. */
export interface BustDartPoints {
  /** The bust point. */
  readonly bustPoint: Point;
  /** Upper leg end, on the side seam. */
  readonly upper: Point;
  /** Lower leg end, on the side seam. */
  readonly lower: Point;
}

/** A dart closure: the pivot, the turn that closes the dart, and a function that applies it. */
export interface DartPivot {
  /** Centre of the turn: x of the bust point, y half way between the legs, so both legs are equally long. */
  readonly pivot: Point;
  /** Turn angle in radians (positive turns +x towards +y) that carries the upper leg onto the lower one. */
  readonly angleRad: number;
  /** Turns any shape about the pivot by the closing angle. */
  readonly turn: <S extends Shape>(shape: S) => Moved<S>;
}

/**
 * The pivot that closes the bust dart. The block's legs share their x and sit symmetric about the dart's mid-line
 * (decision 128, 2), so a pivot on that mid-line is equally far from both: the turned upper leg lands exactly on the
 * lower one and the side seam keeps its length. On the bust point's vertical it stays within a few mm of the bust
 * point, where the princess line passes.
 *
 * @param dart - The bust point and the two leg ends.
 * @returns The pivot, the closing angle and the turn.
 */
export function bustDartPivot(dart: BustDartPoints): DartPivot {
  const pivot = pt(dart.bustPoint.x, (dart.upper.y + dart.lower.y) / 2);
  const closingRad = angleRad(sub(dart.lower, pivot)) - angleRad(sub(dart.upper, pivot));
  return {
    pivot,
    angleRad: closingRad,
    turn: <S extends Shape>(shape: S) => rotateAbout(shape, pivot, closingRad),
  };
}
