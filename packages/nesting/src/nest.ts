/**
 * `nest`: places the prepared shapes of each fabric kind on its strip (FR-FAB-02, NFR-08; ADR-313 item 1). Each kind is
 * filled with the three piece orders and the shortest strip is kept. Pure and deterministic: no random numbers, no
 * clock, ties broken by shape id.
 */
import { PIECE_ORDERS, SLICE_MM } from "./constants";
import type { Interval } from "./rasterize";
import { rowCount } from "./length";
import type { Occupancy } from "./occupancy";
import { occupy } from "./occupancy";
import { type TurnedShape, findSpot, turnsOf } from "./place";
import { sortShapes } from "./orders";
import type {
  DoesNotFit,
  FabricKind,
  NestKindResult,
  NestResult,
  PieceOrder,
  Placement,
  PreparedFabrics,
  Shape,
} from "./types";

/** The fabric kinds, in the order the result lists them (FR-FAB-05). */
export const FABRIC_KINDS: readonly FabricKind[] = ["main", "lining", "interfacing"];

/** What one fill of a strip produced. */
interface Fill {
  /** Placements in placement order. */
  readonly placements: Placement[];
  /** Each placement's `[start, end]` along the strip. */
  readonly bands: Interval[];
  /** Shapes wider than the strip. */
  readonly tooWide: Shape[];
}

/**
 * The copy number in a shape id `<pieceId>#<n>`.
 *
 * @param shapeId - The shape id.
 * @returns n.
 */
function copyIndexOf(shapeId: string): number {
  return Number(shapeId.slice(shapeId.lastIndexOf("#") + 1));
}

/**
 * Fills one strip with the shapes in the given order.
 *
 * @param shapes - Shapes, already sorted.
 * @param turns - Each shape's turns, by shape id.
 * @param strip - The usable width and whether the layout is folded.
 * @param strip.usableWidthMm - Width across the fabric, in mm.
 * @param strip.folded - True for a folded layout.
 * @returns The placements, their x-bands and the shapes that did not fit.
 */
function fill(
  shapes: readonly Shape[],
  turns: ReadonlyMap<string, readonly TurnedShape[]>,
  strip: { usableWidthMm: number; folded: boolean },
): Fill {
  const occupancy: Occupancy = [];
  const out: Fill = { placements: [], bands: [], tooWide: [] };
  for (const shape of shapes) {
    if (shape.bbox.widthMm > strip.usableWidthMm) {
      out.tooWide.push(shape);
      continue;
    }
    const spot = findSpot(occupancy, shape, turns.get(shape.id)!, strip);
    occupy(occupancy, spot.column, spot.turn.profile, spot.offsetMm);
    const xMm = spot.column * SLICE_MM;
    out.placements.push({
      shapeId: shape.id,
      pieceId: shape.pieceId,
      copyIndex: copyIndexOf(shape.id),
      xMm,
      yMm: spot.offsetMm,
      rotation: spot.turn.turn,
      mirrored: shape.mirrored,
    });
    out.bands.push([xMm, xMm + shape.bbox.lengthMm]);
  }
  return out;
}

/**
 * Used strip length of a fill: the largest x any placed shape reaches.
 *
 * @param f - The fill.
 * @returns Length in mm, 0 when nothing was placed.
 */
function stripLength(f: Fill): number {
  return f.bands.reduce((max, [, end]) => Math.max(max, end), 0);
}

/**
 * Reports shapes wider than the strip, one entry per piece.
 *
 * @param shapes - The shapes left out.
 * @param kind - Their fabric kind.
 * @param usableWidthMm - The usable width.
 * @returns The entries, sorted by piece id.
 */
function tooWideEntries(shapes: readonly Shape[], kind: FabricKind, usableWidthMm: number): DoesNotFit[] {
  const byPiece = new Map<string, DoesNotFit>();
  for (const s of shapes) {
    byPiece.set(s.pieceId, {
      pieceId: s.pieceId,
      fabric: kind,
      widthMm: s.bbox.widthMm,
      usableWidthMm,
      fitsOpen: false,
    });
  }
  return [...byPiece.values()].sort((a, b) => (a.pieceId < b.pieceId ? -1 : 1));
}

/**
 * Places the shapes of one fabric kind with each piece order and keeps the shortest strip (ADR-313 item 1).
 *
 * @param shapes - The kind's shapes.
 * @param kind - The fabric kind.
 * @param strip - The usable width and whether the layout is folded.
 * @param strip.usableWidthMm - Width across the fabric, in mm.
 * @param strip.folded - True for a folded layout.
 * @returns The best placement of this kind; its `doesNotFit` holds only shapes wider than the strip.
 * @example
 * nestShapes(prepared.main, "main", { usableWidthMm: 700, folded: true }).stripLengthMm
 */
export function nestShapes(
  shapes: readonly Shape[],
  kind: FabricKind,
  strip: { usableWidthMm: number; folded: boolean },
): NestKindResult {
  const turns = new Map(shapes.map((s) => [s.id, turnsOf(s)] as const));
  let best: { order: PieceOrder; fill: Fill; length: number } | undefined;
  for (const order of PIECE_ORDERS) {
    const f = fill(sortShapes(shapes, order), turns, strip);
    const length = stripLength(f);
    if (!best || length < best.length) best = { order, fill: f, length };
  }
  const chosen = best!;
  return {
    kind,
    placements: chosen.fill.placements,
    stripLengthMm: chosen.length,
    rows: rowCount(chosen.fill.bands),
    doesNotFit: tooWideEntries(chosen.fill.tooWide, kind, strip.usableWidthMm),
    order: chosen.order,
  };
}

/**
 * Places every fabric kind of a preparation (FR-FAB-02, FR-FAB-05). Each kind's `doesNotFit` lists the preparation's
 * too-wide pieces of that kind, then any shape wider than the strip.
 *
 * @param prepared - The output of `preparePieces`.
 * @returns One placement per fabric kind.
 * @example
 * nest(preparePieces(pattern, DEFAULT_FABRIC_OPTIONS)).main.stripLengthMm
 */
export function nest(prepared: PreparedFabrics): NestResult {
  const strip = { usableWidthMm: prepared.usableWidthMm, folded: prepared.layout === "folded" };
  const [main, lining, interfacing] = FABRIC_KINDS.map((kind) => {
    const result = nestShapes(prepared[kind], kind, strip);
    const fromPrep = prepared.doesNotFit.filter((d) => d.fabric === kind);
    return { ...result, doesNotFit: [...fromPrep, ...result.doesNotFit] };
  });
  return {
    layout: prepared.layout,
    usableWidthMm: prepared.usableWidthMm,
    main: main!,
    lining: lining!,
    interfacing: interfacing!,
    suggestOpen: prepared.suggestOpen,
  };
}
