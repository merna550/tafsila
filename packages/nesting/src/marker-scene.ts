/**
 * The marker scene: one fabric kind's placement as drawing data (cut outlines, grain lines, labels, fold and selvedge
 * lines), so the viewer, the PDF and the projector can draw the layout (FR-FAB-02; decision 316 item 4). Data only: no
 * SVG, no renderer. Its shape follows the engine's `PatternScene` (a sheet size and pieces with path data in mm).
 */
import { type Point, bbox, pt } from "@tafsila/engine/geometry";
import { turnMap } from "./place";
import type { FabricLayout, PatternResult, Piece } from "@tafsila/schemas";
import type { FabricKind, NestKindResult, Placement, PreparedFabrics, Shape } from "./types";

/** Decimal places written for every coordinate, as the engine renderer writes them (NFR-08). */
const DECIMALS = 2;

/** One placed shape, ready to draw. */
export interface MarkerPiece {
  /** The shape id, `<pieceId>#<n>`. */
  readonly shapeId: string;
  /** The pattern piece. */
  readonly pieceId: string;
  /** The piece name in both languages, for the label. */
  readonly name: Piece["name"];
  /** The placement it draws. */
  readonly placement: Placement;
  /** Cut outline on the strip, closed path data in mm. */
  readonly cutD: string;
  /** Grain line on the strip, path data in mm (points to +x, or −x after a half turn). */
  readonly grainD: string;
  /** Centre of the placed outline's box, where the label goes. */
  readonly labelAt: Point;
}

/** A line along the whole strip. */
export interface MarkerLine {
  /** The fold (y = 0 in a folded layout) or a selvedge. */
  readonly kind: "fold" | "selvedge";
  /** Path data in mm. */
  readonly d: string;
}

/** Everything a viewer draws for one fabric kind's layout. JSON-serialisable. */
export interface MarkerScene {
  /** The fabric kind. */
  readonly kind: FabricKind;
  /** Folded or open. */
  readonly layout: FabricLayout;
  /** Strip length along the selvedge (the sheet width), in mm. */
  readonly widthMm: number;
  /** Usable width across the fabric (the sheet height), in mm. */
  readonly heightMm: number;
  /** The placed shapes, in placement order. */
  readonly pieces: readonly MarkerPiece[];
  /** Fold and selvedge lines. */
  readonly lines: readonly MarkerLine[];
}

/**
 * Formats a coordinate with fixed decimals; `-0.00` is written as `0.00`.
 *
 * @param value - A number in mm.
 * @returns The text.
 */
function fmt(value: number): string {
  const text = value.toFixed(DECIMALS);
  return Number(text) === 0 ? (0).toFixed(DECIMALS) : text;
}

/**
 * Path data through points.
 *
 * @param points - The points, in order.
 * @param closed - True to close the path.
 * @returns `M x y L x y … [Z]`.
 */
function pathOf(points: readonly Point[], closed: boolean): string {
  const body = points.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(p.x)} ${fmt(p.y)}`).join(" ");
  return closed ? `${body} Z` : body;
}

/**
 * One placed shape as drawing data.
 *
 * @param shape - The prepared shape.
 * @param placement - Where it lies.
 * @param name - The piece name.
 * @returns The marker piece.
 */
function markerPiece(shape: Shape, placement: Placement, name: Piece["name"]): MarkerPiece {
  const turn = turnMap(shape, placement.rotation);
  /**
   * Moves a point of the shape to the strip: the turn, then the placement offset.
   *
   * @param p - A point in the shape's frame.
   * @returns The point on the strip.
   */
  const onStrip = (p: Point): Point => {
    const q = turn(p);
    return pt(q.x + placement.xMm, q.y + placement.yMm);
  };
  const outline = shape.polygon.map(onStrip);
  const box = bbox(outline);
  return {
    shapeId: shape.id,
    pieceId: shape.pieceId,
    name,
    placement,
    cutD: pathOf(outline, true),
    grainD: pathOf(shape.grainLine.map(onStrip), false),
    labelAt: pt((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2),
  };
}

/**
 * The fold and selvedge lines of a strip.
 *
 * @param layout - Folded or open.
 * @param lengthMm - Strip length.
 * @param widthMm - Usable width.
 * @returns A fold line at y = 0 and a selvedge at the far side when folded; two selvedges when open.
 */
function stripLines(layout: FabricLayout, lengthMm: number, widthMm: number): MarkerLine[] {
  /**
   * Path data of a line along the strip.
   *
   * @param y - Its y across the fabric.
   * @returns The path data.
   */
  const along = (y: number): string => pathOf([pt(0, y), pt(lengthMm, y)], false);
  return [
    { kind: layout === "folded" ? "fold" : "selvedge", d: along(0) },
    { kind: "selvedge", d: along(widthMm) },
  ];
}

/**
 * Builds the marker scene of one fabric kind.
 *
 * @param pattern - The pattern (for the piece names).
 * @param prepared - The preparation the placement used.
 * @param result - The kind's placement.
 * @returns The scene; its pieces are in placement order.
 * @example
 * buildMarkerScene(pattern, result.prepared, result.main).pieces.length
 */
export function buildMarkerScene(
  pattern: PatternResult,
  prepared: PreparedFabrics,
  result: NestKindResult,
): MarkerScene {
  const shapes = new Map(prepared[result.kind].map((s) => [s.id, s] as const));
  const names = new Map(pattern.pieces.map((p) => [p.id, p.name] as const));
  return {
    kind: result.kind,
    layout: prepared.layout,
    widthMm: result.stripLengthMm,
    heightMm: prepared.usableWidthMm,
    pieces: result.placements.map((pl) => markerPiece(shapes.get(pl.shapeId)!, pl, names.get(pl.pieceId)!)),
    lines: stripLines(prepared.layout, result.stripLengthMm, prepared.usableWidthMm),
  };
}
