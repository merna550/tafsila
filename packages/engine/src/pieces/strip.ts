/**
 * Rectangular strips (issues #140, #142): the waistband, the elastic casings, the flat waist facing, the sleeve cuff
 * and its placket. The sewn edge is split into one edge per run so each run pairs with the edge it sews to
 * (FR-VAL-01); a closure adds a declared overlap past the last run. Aldrich 6th ed., ch. 2.
 */
import type { Edge, EngineOptions, Piece } from "@tafsila/schemas";
import { buildEdges, type EdgeSpec } from "../blocks/shared/edges";
import { BAND_GRAIN_SHARE } from "../constants/waistband";
import { lineSeg, pt, type Segment } from "../geometry";
import { PIECE_NAMES } from "../i18n/pieces";
import type { PieceDraft } from "../pipeline/draft-context";

/** Prefix of the edges that sew to another piece; `seam-1` is the first run from the opening. */
export const STRIP_SEAM_EDGE_PREFIX = "seam-";
/** The declared closure overlap past the last run. */
export const OVERLAP_EDGE_ID = "overlap";
/** The far long edge (folded inside on a band, neatened on a facing). */
export const STRIP_FREE_EDGE_ID = "free";
/** The end where the closure overlap is. */
export const STRIP_END_EDGE_ID = "end";
/** The end at the first run. */
export const STRIP_START_EDGE_ID = "start";

/** One run of the sewn edge: its length and the edge it sews to. */
export interface StripRun {
  /** Length of this part of the sewn edge, in mm. */
  readonly lengthMm: number;
  /** The edge this run sews to, with any declared ease (ignored when the strip is not paired). */
  readonly pairsWith?: Edge["pairsWith"];
}

/** What a strip is made of. */
export interface StripSpec {
  /** Piece id (its name comes from the piece-name catalogue). */
  readonly id: string;
  /** Runs in strip order; their lengths add up to the sewn edge. */
  readonly runs: readonly StripRun[];
  /** Cut height across the strip, in mm (twice the finished width for a folded band). */
  readonly heightMm: number;
  /** Declared closure overlap past the last run, in mm (0 for none). */
  readonly overlapMm: number;
  /** True when nothing opens: the two ends are seamed into a loop and pair with each other. */
  readonly loop: boolean;
  /** Fabric it is cut from. */
  readonly fabric: Piece["cut"]["fabric"];
  /** Whether the edges declare their pairs (false for an interfacing). */
  readonly paired: boolean;
  /** Copies cut; 1 when left out (a cuff is cut once per sleeve). */
  readonly quantity?: number;
  /** The piece name when the id is not in the catalogue (a belt part, #145). */
  readonly name?: Piece["name"];
}

/**
 * The strip outline: the sewn edge along y = 0 from x = 0, one segment per run, then the overlap, the end, the free
 * edge back and the start.
 *
 * @param spec - The strip.
 * @returns The closed outline.
 */
function stripOutline(spec: StripSpec): Segment[] {
  const stops = spec.runs.reduce<number[]>((acc, run) => [...acc, acc.at(-1)! + run.lengthMm], [0]);
  const sewn = stops.slice(1).map((x, i) => lineSeg(pt(stops[i]!, 0), pt(x, 0)));
  const seamEndMm = stops.at(-1)!;
  const lengthMm = seamEndMm + spec.overlapMm;
  const overlap = spec.overlapMm > 0 ? [lineSeg(pt(seamEndMm, 0), pt(lengthMm, 0))] : [];
  const h = spec.heightMm;
  return [
    ...sewn,
    ...overlap,
    lineSeg(pt(lengthMm, 0), pt(lengthMm, h)),
    lineSeg(pt(lengthMm, h), pt(0, h)),
    lineSeg(pt(0, h), pt(0, 0)),
  ];
}

/**
 * Edge specs in path order. A loop has its two ends seamed together, so they pair with each other.
 *
 * @param spec - The strip.
 * @returns Edge specs.
 */
function stripEdgeSpecs(spec: StripSpec): EdgeSpec[] {
  const loop = spec.paired && spec.loop;
  const seams: EdgeSpec[] = spec.runs.map((run, i) => ({
    id: `${STRIP_SEAM_EDGE_PREFIX}${i + 1}`,
    kind: "other",
    segments: 1,
    ...(spec.paired && run.pairsWith ? { pairsWith: run.pairsWith } : {}),
  }));
  const overlap: EdgeSpec[] = spec.overlapMm > 0 ? [{ id: OVERLAP_EDGE_ID, kind: "other", segments: 1 }] : [];
  /**
   * The pair of one end when the strip is a loop.
   *
   * @param edgeId - The other end's edge id.
   * @returns The pair field, or nothing when the ends are free.
   */
  const endPair = (edgeId: string): Pick<EdgeSpec, "pairsWith"> =>
    loop ? { pairsWith: { pieceId: spec.id, edgeId, intendedEaseMm: 0 } } : {};
  return [
    ...seams,
    ...overlap,
    { id: STRIP_END_EDGE_ID, kind: "other", segments: 1, ...endPair(STRIP_START_EDGE_ID) },
    { id: STRIP_FREE_EDGE_ID, kind: "other", segments: 1 },
    { id: STRIP_START_EDGE_ID, kind: "other", segments: 1, ...endPair(STRIP_END_EDGE_ID) },
  ];
}

/**
 * Builds one strip, cut on the lengthwise grain.
 *
 * @param spec - The strip.
 * @param options - Engine options, for the seam allowances.
 * @returns The piece, ready for the finishing step.
 */
export function stripPiece(spec: StripSpec, options: Pick<EngineOptions, "seamAllowance">): PieceDraft {
  const stitchPath = stripOutline(spec);
  const lengthMm = stitchPath[spec.runs.length + (spec.overlapMm > 0 ? 1 : 0)]!.from.x;
  const midYMm = spec.heightMm / 2;
  return {
    id: spec.id,
    name: spec.name ?? PIECE_NAMES[spec.id]!,
    cut: { quantity: spec.quantity ?? 1, onFold: false, mirror: false, fabric: spec.fabric },
    stitchPath,
    edges: buildEdges(spec.id, stripEdgeSpecs(spec), options),
    notches: [],
    bodyLines: [],
    grainLine: [pt(lengthMm * BAND_GRAIN_SHARE.from, midYMm), pt(lengthMm * BAND_GRAIN_SHARE.to, midYMm)],
    darts: [],
  };
}
