/* eslint-disable no-magic-numbers -- test data: the shared 200 x 300 mm rectangle and its grain line at 10 % and 90 % of the height */
/** Hand-made pieces for the nesting unit tests: variants of the shared rectangle fixture. */
import type { Piece, PatternResult, Point } from "@tafsila/schemas";
import { rectanglePattern } from "@tafsila/test-fixtures";

/** What a test rectangle piece needs. */
export interface RectPieceInput {
  /** Piece id. */
  readonly id?: string;
  /** Width on the sheet (x), in mm. */
  readonly widthMm?: number;
  /** Height on the sheet (y), in mm. */
  readonly heightMm?: number;
  /** Cut instruction overrides. */
  readonly cut?: Partial<Piece["cut"]>;
  /** Grain line; defaults to pointing down the sheet (+y). */
  readonly grainLine?: [Point, Point];
}

/**
 * Closed path of line segments through corners.
 *
 * @param corners - Corners in order.
 * @returns The path.
 */
export function polygonPath(corners: readonly Point[]): Piece["cutPath"] {
  return corners.map((from, i) => ({ kind: "line" as const, from, to: corners[(i + 1) % corners.length]! }));
}

/**
 * A rectangle piece with its corner at the origin; a fold piece gets a `fold` edge on x = 0, as the engine draws it.
 *
 * @param input - Size, cut and grain overrides.
 * @returns The piece.
 */
export function rectPiece(input: RectPieceInput = {}): Piece {
  const base = rectanglePattern.pieces[0]!;
  const w = input.widthMm ?? 200;
  const h = input.heightMm ?? 300;
  const corners = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const cut = { ...base.cut, ...input.cut };
  return {
    ...base,
    id: input.id ?? base.id,
    cut,
    stitchPath: polygonPath(corners),
    cutPath: polygonPath(corners),
    edges: cut.onFold ? [{ id: "cf", fromSegment: 3, toSegment: 3, kind: "fold", seamAllowanceMm: 0 }] : [],
    grainLine: input.grainLine ?? [
      { x: w / 2, y: 0.1 * h },
      { x: w / 2, y: 0.9 * h },
    ],
    bbox: { widthMm: w, heightMm: h },
  };
}

/**
 * A pattern holding the given pieces.
 *
 * @param pieces - The pieces.
 * @returns The pattern.
 */
export function patternOf(...pieces: Piece[]): PatternResult {
  return { ...rectanglePattern, pieces };
}
