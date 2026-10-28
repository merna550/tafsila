/**
 * `preparePieces`: a PatternResult and the fabric options in, the shapes to lay on each fabric out (FR-FAB-01,
 * FR-FAB-02, FR-FAB-05, FR-VAL-08; ADR-312 item 4, ADR-313 items 3 and 5). Pure and deterministic.
 */
import { type Point, bbox } from "@tafsila/engine/geometry";
import type { FabricOptions, PatternResult, Piece } from "@tafsila/schemas";
import { HALF_TURN_DEG } from "./constants";
import { nestingOutline } from "./flatten";
import { clipAtFold, foldLineY, toFoldFrame, unfoldAtFold } from "./fold";
import { type PointMap, mirrorAcrossGrain, toOrigin, toSelvedge } from "./grain";
import { shapeCopies } from "./quantity";
import type { DoesNotFit, FabricKind, PreparedFabrics, Shape, Turn } from "./types";

/** Fabric layers of a folded fabric: its usable width is the fabric width divided by this. */
const FOLDED_LAYERS = 2;

/** A piece's outline and grain line in the selvedge frame, before copies and placement. */
interface PieceOutline {
  /** Outline corners. */
  readonly polygon: Point[];
  /** Grain line, along +x. */
  readonly grainLine: [Point, Point];
  /** True when the outline is a half shape on the fold (y = 0). */
  readonly fold: boolean;
}

/**
 * Applies one map to an outline and its grain line.
 *
 * @param outline - The outline.
 * @param map - The point map.
 * @returns The moved outline.
 */
function mapOutline(outline: PieceOutline, map: PointMap): PieceOutline {
  return {
    polygon: outline.polygon.map(map),
    grainLine: [map(outline.grainLine[0]), map(outline.grainLine[1])],
    fold: outline.fold,
  };
}

/**
 * The piece's outline turned to the selvedge; a fold piece is also cut back to its fold line on y = 0.
 *
 * @param piece - The pattern piece.
 * @returns The half shape for a fold piece, else the whole shape.
 */
function selvedgeOutline(piece: Piece): PieceOutline {
  const turn = toSelvedge(piece.grainLine);
  const turned: PieceOutline = {
    polygon: nestingOutline(piece.cutPath).map(turn),
    grainLine: [turn(piece.grainLine[0]), turn(piece.grainLine[1])],
    fold: false,
  };
  if (!piece.cut.onFold) return turned;
  const toFold = toFoldFrame(turned.polygon, foldLineY(piece, turn, turned.polygon));
  const inFold = mapOutline(turned, toFold);
  return { ...inFold, polygon: clipAtFold(inFold.polygon), fold: true };
}

/**
 * The outline for one layout: a fold piece stays a half in a folded layout and is unfolded in an open one.
 *
 * @param outline - The selvedge outline from `selvedgeOutline`.
 * @param folded - True for the folded layout.
 * @returns The outline with its box at (0, 0).
 */
function layoutOutline(outline: PieceOutline, folded: boolean): PieceOutline {
  const shaped =
    outline.fold && !folded ? { ...outline, polygon: unfoldAtFold(outline.polygon), fold: false } : outline;
  return mapOutline(shaped, toOrigin(shaped.polygon));
}

/**
 * Builds one shape of a piece.
 *
 * @param piece - The pattern piece.
 * @param outline - Its outline for this layout, box at (0, 0).
 * @param copy - Copy number (from 1) and whether it is the mirror image.
 * @param copy.index - Copy number, from 1.
 * @param copy.mirrored - True for the mirror image.
 * @param allowedTurns - Turns the placement may use.
 * @returns The shape.
 */
function toShape(
  piece: Piece,
  outline: PieceOutline,
  copy: { index: number; mirrored: boolean },
  allowedTurns: readonly Turn[],
): Shape {
  const placed = copy.mirrored
    ? mapOutline(mapOutline(outline, mirrorAcrossGrain), toOriginOf(outline))
    : outline;
  const box = bbox(placed.polygon);
  return {
    id: `${piece.id}#${copy.index}`,
    pieceId: piece.id,
    polygon: placed.polygon,
    grainLine: placed.grainLine,
    allowedTurns,
    fold: placed.fold,
    mirrored: copy.mirrored,
    bbox: { lengthMm: box.maxX - box.minX, widthMm: box.maxY - box.minY },
  };
}

/**
 * The translation that brings a mirrored outline back to the box at (0, 0).
 *
 * @param outline - The unmirrored outline (box at the origin).
 * @returns The map for its mirror image.
 */
function toOriginOf(outline: PieceOutline): PointMap {
  return toOrigin(outline.polygon.map(mirrorAcrossGrain));
}

/**
 * Width of a piece across the fabric once opened out: a fold half doubles.
 *
 * @param outline - The selvedge outline.
 * @returns Width in mm.
 */
function openWidthMm(outline: PieceOutline): number {
  const box = bbox(outline.polygon);
  return outline.fold ? 2 * box.maxY : box.maxY - box.minY;
}

/**
 * Orders pieces by id in code-unit order, the same in every locale (NFR-08).
 *
 * @param a - First piece.
 * @param b - Second piece.
 * @returns Negative, zero or positive.
 */
function byId(a: Piece, b: Piece): number {
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

/** Shapes grouped by fabric kind. */
type ShapeLists = Record<FabricKind, Shape[]>;

/**
 * Prepares the pieces of a pattern for nesting on the chosen fabric: one shape per piece to cut, turned so its grain
 * runs along the selvedge, with fold and mirror rules of the layout applied. Pieces wider than the usable width are
 * reported in `doesNotFit` and left out of the lists (ADR-312 item 4).
 *
 * @param pattern - The engine output.
 * @param options - Fabric options (width, layout, nap; shrinkage and repeat are used by the length step).
 * @returns Shapes per fabric kind, the usable width and the pieces that do not fit.
 * @example
 * preparePieces(generatePattern(seedDress, sizeM), DEFAULT_FABRIC_OPTIONS).main.length // 7
 */
export function preparePieces(pattern: PatternResult, options: FabricOptions): PreparedFabrics {
  const folded = options.layout === "folded";
  const usableWidthMm = folded ? options.widthMm / FOLDED_LAYERS : options.widthMm;
  const allowedTurns: readonly Turn[] = options.directionalNap ? [0] : [0, HALF_TURN_DEG];
  const lists: ShapeLists = { main: [], lining: [], interfacing: [] };
  const doesNotFit: DoesNotFit[] = [];
  const pieces = [...pattern.pieces].sort(byId);
  for (const piece of pieces) {
    const selvedge = selvedgeOutline(piece);
    const outline = layoutOutline(selvedge, folded);
    const widthMm = bbox(outline.polygon).maxY;
    if (widthMm > usableWidthMm) {
      const fitsOpen = openWidthMm(selvedge) <= options.widthMm;
      doesNotFit.push({ pieceId: piece.id, widthMm, usableWidthMm, fitsOpen });
      continue;
    }
    shapeCopies(piece.cut, options.layout).forEach((copy, i) => {
      lists[piece.cut.fabric].push(
        toShape(piece, outline, { index: i + 1, mirrored: copy.mirrored }, allowedTurns),
      );
    });
  }
  const suggestOpen = folded && doesNotFit.some((d) => d.fitsOpen);
  return { layout: options.layout, usableWidthMm, ...lists, doesNotFit, suggestOpen };
}
