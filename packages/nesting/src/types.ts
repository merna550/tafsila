/** Types of the prepared nesting input: shapes per fabric kind, ready to place on a strip (decision 315). */
import type { FabricLayout, Piece, Point } from "@tafsila/schemas";
import type { HALF_TURN_DEG } from "./constants";

/** Which fabric a piece is cut from: main, lining or interfacing (FR-FAB-05). */
export type FabricKind = Piece["cut"]["fabric"];

/** A turn the placement may give a shape, in degrees: 0 or 180 (ADR-312 item 4; no cross-grain turns in v1). */
export type Turn = 0 | typeof HALF_TURN_DEG;

/**
 * One outline to lay on the fabric, in mm. x runs along the selvedge (the strip length) and y across the fabric; the
 * outline's box starts at (0, 0). In a folded layout y = 0 is the fold.
 */
export interface Shape {
  /** Stable id: `<pieceId>#<n>`, n counting from 1 per piece. */
  readonly id: string;
  /** The pattern piece this shape cuts. */
  readonly pieceId: string;
  /** Corners of the outline in order (no repeated closing point), pushed out by the simplification tolerance. */
  readonly polygon: readonly Point[];
  /** The piece's grain line after the turn to the selvedge: always parallel to x, pointing to +x. */
  readonly grainLine: readonly [Point, Point];
  /** Turns the placement may use: `[0]` with directional nap, `[0, 180]` without. */
  readonly allowedTurns: readonly Turn[];
  /** True for a fold piece in a folded layout: its fold edge lies on y = 0 and must stay there. */
  readonly fold: boolean;
  /** True when this shape is the mirror image of the piece (the second of a pair in an open layout). */
  readonly mirrored: boolean;
  /** Size of the outline's box: `lengthMm` along the selvedge, `widthMm` across the fabric. */
  readonly bbox: { readonly lengthMm: number; readonly widthMm: number };
}

/** A piece wider across the fabric than the usable width: reported and left out of the lists (FR-VAL-08). */
export interface DoesNotFit {
  /** The piece that does not fit. */
  readonly pieceId: string;
  /** Its width across the fabric in this layout, in mm. */
  readonly widthMm: number;
  /** The usable width it was checked against, in mm. */
  readonly usableWidthMm: number;
  /** True when the piece would fit if the fabric were opened out. */
  readonly fitsOpen: boolean;
}

/** The result of `preparePieces`: one shape list per fabric kind, plus the pieces that do not fit. */
export interface PreparedFabrics {
  /** The layout the shapes were prepared for. */
  readonly layout: FabricLayout;
  /** Width the shapes may use across the fabric: half the fabric folded, all of it open. */
  readonly usableWidthMm: number;
  /** Shapes of the main fabric, sorted by piece id then copy number. */
  readonly main: readonly Shape[];
  /** Shapes of the lining. */
  readonly lining: readonly Shape[];
  /** Shapes of the interfacing. */
  readonly interfacing: readonly Shape[];
  /** Pieces too wide for the usable width, sorted by piece id. */
  readonly doesNotFit: readonly DoesNotFit[];
  /** True when the folded layout left a piece out that the open layout would hold (the UI suggests "open"). */
  readonly suggestOpen: boolean;
}
