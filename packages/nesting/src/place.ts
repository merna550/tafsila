/**
 * Bottom-left fill of one shape on the strip (ADR-313 item 1): the first column where any allowed turn fits, then the
 * lowest free y, or the highest in a folded layout so ordinary pieces stay at the selvedge and leave the fold free.
 */
import { type Point, pt } from "@tafsila/engine/geometry";
import { HALF_TURN_DEG, SLICE_MM } from "./constants";
import { type Occupancy, freeOffsets } from "./occupancy";
import { type Profile, columnProfile } from "./rasterize";
import type { Shape, Turn } from "./types";

/** A shape in one allowed turn, with its outline and column profile. */
export interface TurnedShape {
  /** The turn. */
  readonly turn: Turn;
  /** The outline after the turn, box at (0, 0). */
  readonly polygon: readonly Point[];
  /** Covered y-intervals per column. */
  readonly profile: Profile;
}

/** Where the fill put a shape. */
export interface Spot {
  /** Strip column of the shape's first column. */
  readonly column: number;
  /** y offset of the shape's box, in mm. */
  readonly offsetMm: number;
  /** The turn used. */
  readonly turn: TurnedShape;
}

/**
 * The point map of a turn. A half turn spins the shape about its box centre; a fold shape is flipped along x instead,
 * because its fold edge must stay on y = 0 (ADR-313 item 1).
 *
 * @param shape - The prepared shape.
 * @param turn - 0 or 180.
 * @returns A map from the shape's frame to the turned frame (box still at (0, 0)).
 */
export function turnMap(shape: Shape, turn: Turn): (p: Point) => Point {
  if (turn !== HALF_TURN_DEG) return (p) => p;
  const { lengthMm, widthMm } = shape.bbox;
  return (p) => pt(lengthMm - p.x, shape.fold ? p.y : widthMm - p.y);
}

/**
 * The outline of a shape after a turn.
 *
 * @param shape - The prepared shape.
 * @param turn - 0 or 180.
 * @returns The turned outline, box at (0, 0).
 */
export function turnedPolygon(shape: Shape, turn: Turn): readonly Point[] {
  return shape.polygon.map(turnMap(shape, turn));
}

/**
 * Every allowed turn of a shape with its profile, computed once and reused by every piece order.
 *
 * @param shape - The prepared shape.
 * @returns One entry per allowed turn, in the shape's order.
 */
export function turnsOf(shape: Shape): TurnedShape[] {
  return shape.allowedTurns.map((turn) => {
    const polygon = turnedPolygon(shape, turn);
    return { turn, polygon, profile: columnProfile(polygon, SLICE_MM) };
  });
}

/**
 * The first column where one turn fits, and the chosen offset there.
 *
 * @param occupancy - The strip.
 * @param turned - The shape in one turn.
 * @param maxOffsetMm - Largest offset inside the usable width (0 for a fold shape, which stays on the fold).
 * @param preferHigh - True to take the highest free offset (folded layout).
 * @returns The spot; past the strip's end the columns are empty, so a shape no wider than the strip always fits.
 */
function firstFit(occupancy: Occupancy, turned: TurnedShape, maxOffsetMm: number, preferHigh: boolean): Spot {
  for (let column = 0; ; column++) {
    const ranges = freeOffsets(occupancy, column, turned.profile, maxOffsetMm);
    if (ranges.length > 0) {
      const offsetMm = preferHigh ? ranges[ranges.length - 1]![1] : ranges[0]![0];
      return { column, offsetMm, turn: turned };
    }
  }
}

/**
 * Tells whether spot a beats spot b: an earlier column, then the preferred offset; the earlier turn wins ties.
 *
 * @param a - Candidate spot.
 * @param b - Best spot so far.
 * @param preferHigh - True when a higher offset is better.
 * @returns True when a is strictly better.
 */
function better(a: Spot, b: Spot, preferHigh: boolean): boolean {
  if (a.column !== b.column) return a.column < b.column;
  return preferHigh ? a.offsetMm > b.offsetMm : a.offsetMm < b.offsetMm;
}

/**
 * Finds where a shape goes on the strip.
 *
 * @param occupancy - The strip.
 * @param shape - The prepared shape (its width must not exceed the usable width).
 * @param turns - The shape's turns from `turnsOf`.
 * @param strip - The usable width and whether the layout is folded.
 * @param strip.usableWidthMm - Width across the fabric, in mm.
 * @param strip.folded - True for a folded layout.
 * @returns The best spot over the allowed turns.
 */
export function findSpot(
  occupancy: Occupancy,
  shape: Shape,
  turns: readonly TurnedShape[],
  strip: { usableWidthMm: number; folded: boolean },
): Spot {
  const maxOffsetMm = shape.fold ? 0 : strip.usableWidthMm - shape.bbox.widthMm;
  const preferHigh = strip.folded && !shape.fold;
  let best: Spot | undefined;
  for (const turned of turns) {
    const spot = firstFit(occupancy, turned, maxOffsetMm, preferHigh);
    if (!best || better(spot, best, preferHigh)) best = spot;
  }
  return best!;
}
