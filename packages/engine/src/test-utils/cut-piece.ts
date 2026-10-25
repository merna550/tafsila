/** Small hand-made pieces for the direct-cut tests (issue #284; not part of the engine API). */
import type { Piece, Point, Segment } from "@tafsila/schemas";
import { lineSeg, pt } from "../geometry";
import type { CutPiece } from "../cut/steps";

/** Where the default grain line starts, as a share of the height. */
const GRAIN_FROM_SHARE = 0.25;

/** Where the default grain line ends, as a share of the height. */
const GRAIN_TO_SHARE = 0.75;

/** Options of {@link rectanglePiece}. */
export interface RectangleOptions {
  /** Width (x), mm. */
  readonly widthMm?: number;
  /** Height (y), mm. */
  readonly heightMm?: number;
  /** Top-left corner, mm. */
  readonly at?: Point;
  /** Whether the left edge is a fold. */
  readonly fold?: boolean;
  /** Grain line; vertical through the middle when left out. */
  readonly grainLine?: readonly [Point, Point];
  /** Notches on the edges. */
  readonly notches?: Piece["notches"];
  /** Darts. */
  readonly darts?: Piece["darts"];
}

/**
 * A rectangle piece whose stitch and cut lines are the same, clockwise from the top-left: top, right, bottom, left.
 *
 * @param options - Size, place, fold, grain, notches and darts.
 * @returns The piece.
 */
export function rectanglePiece(options: RectangleOptions = {}): CutPiece {
  const { widthMm = 200, heightMm = 300, at = pt(0, 0), fold = false } = options;
  const a = at;
  const b = pt(at.x + widthMm, at.y);
  const c = pt(at.x + widthMm, at.y + heightMm);
  const d = pt(at.x, at.y + heightMm);
  const path: Segment[] = [lineSeg(a, b), lineSeg(b, c), lineSeg(c, d), lineSeg(d, a)];
  const edges: Piece["edges"] = ["top", "right", "bottom", "left"].map((id, i) => ({
    id,
    fromSegment: i,
    toSegment: i,
    seamAllowanceMm: 0,
    ...(fold && id === "left" ? { kind: "fold" as const } : {}),
  }));
  const midX = at.x + widthMm / 2;
  return {
    id: "test-rect",
    name: { ar: "مستطيل", en: "Rectangle" },
    cut: { quantity: 2, onFold: fold, mirror: !fold, fabric: "main" },
    stitchPath: path,
    cutPath: path,
    edges,
    notches: options.notches ?? [],
    darts: options.darts ?? [],
    grainLine: options.grainLine
      ? [options.grainLine[0], options.grainLine[1]]
      : [pt(midX, at.y + heightMm * GRAIN_FROM_SHARE), pt(midX, at.y + heightMm * GRAIN_TO_SHARE)],
  };
}
