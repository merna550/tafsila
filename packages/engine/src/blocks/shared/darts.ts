/** Dart helpers shared by the blocks (issue #128; reused by #129, #133, #138). */
import type { Dart, Point } from "@tafsila/schemas";
import { add, distance, samePoint, scale, sub } from "../../geometry";
import type { ReadonlyPath } from "../../geometry";

/**
 * Trues a dart: the shorter leg is extended along its own line from the apex to the length of the longer
 * one, so both legs sew to the same length (decision 128, 3). Never mutates.
 *
 * @param apex - Dart apex.
 * @param legA - First leg end.
 * @param legB - Second leg end.
 * @returns The two leg ends, in the same order, trued.
 */
export function trueDartLegs(apex: Point, legA: Point, legB: Point): [Point, Point] {
  const lengthA = distance(apex, legA);
  const lengthB = distance(apex, legB);
  /**
   * Moves a leg end along its line to the target length.
   *
   * @param leg - Leg end.
   * @param from - Its current length.
   * @param to - The target length.
   * @returns The new leg end.
   */
  const extend = (leg: Point, from: number, to: number): Point => add(apex, scale(sub(leg, apex), to / from));
  if (lengthA < lengthB) return [extend(legA, lengthA, lengthB), { ...legB }];
  return [{ ...legA }, extend(legB, lengthB, lengthA)];
}

/**
 * Index of the outline segment that joins the two legs of a dart (the dart mouth).
 *
 * @param path - The outline.
 * @param dart - The dart, legs in path order.
 * @returns The segment index, or -1 when no segment joins the legs.
 */
export function dartMouthIndex(path: ReadonlyPath, dart: Pick<Dart, "legs">): number {
  const [a, b] = dart.legs;
  return path.findIndex(
    (seg) =>
      (samePoint(seg.from, a) && samePoint(seg.to, b)) || (samePoint(seg.from, b) && samePoint(seg.to, a)),
  );
}
