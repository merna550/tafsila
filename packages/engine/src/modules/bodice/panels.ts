/**
 * Builds the centre and side princess panels of either half from their drafted lines (issue #138, decision 138, 4):
 * the same edge layout, cut, notch and body lines front and back, so the geometry files only draw lines.
 */
import type { BodyLine, Edge, EngineOptions, Point, Segment } from "@tafsila/schemas";
import { ARMHOLE_EDGE_ID } from "../../blocks/bodice";
import { bodiceCut, grainLine } from "../../blocks/bodice/piece-parts";
import { buildEdges, type EdgeSpec } from "../../blocks/shared/edges";
import { lineSeg, segmentLength } from "../../geometry";
import { PIECE_NAMES } from "../../i18n/pieces";
import type { PieceDraft } from "../../pipeline/draft-context";
import { STYLE_EDGE_ID, bustNotch, sidePanelCut, sidePanelGrain, type PanelTops } from "./panel-parts";

/** Seam allowance options. */
type SeamOptions = Pick<EngineOptions, "seamAllowance">;

/** The lines both panels of one half share. */
export interface HalfLines {
  /** The half's top, cut where the style line starts (the side part already turned, at the front). */
  readonly tops: PanelTops;
  /** Centre panel seam, style start to the centre waist leg (two stretches). */
  readonly centreStyle: readonly [Segment, Segment];
  /** Side panel seam, side waist leg to the style start (two stretches). */
  readonly sideStyle: readonly [Segment, Segment];
  /** Waist ends of the seam: centre leg, side leg. */
  readonly legs: readonly [Point, Point];
}

/** What a centre panel needs beyond the shared lines. */
export interface CentrePanelSpec {
  /** Piece id. */
  readonly id: string;
  /** The side panel of the same half. */
  readonly sideId: string;
  /** The neck edge, centre line to neck point. */
  readonly neck: readonly Segment[];
  /** Neck point on the centre line (nape or centre front neck). */
  readonly neckCentre: Point;
  /** Waist point on the centre line. */
  readonly waistCentre: Point;
  /** Id of the fold edge (`cf` or `cb`). */
  readonly foldEdgeId: string;
  /** The shoulder seam pairing. */
  readonly shoulderPair: Edge["pairsWith"];
  /** The panel's share of the bust line. */
  readonly bust: BodyLine;
}

/** What a side panel needs beyond the shared lines. */
export interface SidePanelSpec {
  /** Piece id. */
  readonly id: string;
  /** The centre panel of the same half. */
  readonly centreId: string;
  /** Side seam, underarm to side waist. */
  readonly sideSeam: readonly Segment[];
  /** The side seam pairing. */
  readonly sidePair: Edge["pairsWith"];
  /** The shoulder seam pairing, when the panel has part of the shoulder. */
  readonly shoulderPair: Edge["pairsWith"];
  /** The panel's share of the bust line. */
  readonly bust: BodyLine;
  /** y of the underarm, where the grain line may start. */
  readonly underarmY: number;
}

/** The waist body line every panel declares on its waist edge. */
const WAIST_LINE: BodyLine = { id: "bodice-waist", measurement: "waist", kind: "edge", edgeId: "waist" };

/**
 * The style edge spec, paired with the other panel of the half (the two run in opposite directions).
 *
 * @param partnerId - The other panel.
 * @returns The edge spec.
 */
function styleEdge(partnerId: string): EdgeSpec {
  return {
    id: STYLE_EDGE_ID,
    kind: "other",
    segments: 2,
    pairsWith: { pieceId: partnerId, edgeId: STYLE_EDGE_ID, reversed: true },
  };
}

/**
 * The centre panel of a half: neck, inner shoulder (and upper armhole for an armhole line), princess seam, waist to
 * the centre line, centre line on the fold.
 *
 * @param lines - The half's shared lines.
 * @param spec - The centre panel's own data.
 * @param options - Engine options, for the seam allowances.
 * @returns The panel in progress.
 */
export function centrePanel(lines: HalfLines, spec: CentrePanelSpec, options: SeamOptions): PieceDraft {
  const { tops } = lines;
  const armholeSegments = tops.centre.length - tops.centreShoulderSegments;
  const specs: EdgeSpec[] = [
    { id: "neck", kind: "neckline", segments: spec.neck.length },
    { id: "shoulder", kind: "other", segments: tops.centreShoulderSegments, pairsWith: spec.shoulderPair },
    ...(armholeSegments > 0
      ? [{ id: ARMHOLE_EDGE_ID, kind: "armhole" as const, segments: armholeSegments }]
      : []),
    styleEdge(spec.sideId),
    { id: "waist", kind: "other", segments: 1 },
    { id: spec.foldEdgeId, kind: "fold", segments: 1 },
  ];
  return {
    id: spec.id,
    name: PIECE_NAMES[spec.id]!,
    cut: bodiceCut(),
    stitchPath: [
      ...spec.neck,
      ...tops.centre,
      ...lines.centreStyle,
      lineSeg(lines.legs[0], spec.waistCentre),
      lineSeg(spec.waistCentre, spec.neckCentre),
    ],
    edges: buildEdges(spec.id, specs, options),
    notches: [bustNotch(segmentLength(lines.centreStyle[0]), spec.sideId)],
    bodyLines: [spec.bust, WAIST_LINE],
    grainLine: grainLine(spec.neckCentre.y, spec.waistCentre.y),
    darts: [],
  };
}

/**
 * The side panel of a half: outer shoulder and armhole (or lower armhole), side seam, waist to the princess seam,
 * princess seam back up to the style start.
 *
 * @param lines - The half's shared lines.
 * @param spec - The side panel's own data.
 * @param options - Engine options, for the seam allowances.
 * @returns The panel in progress.
 */
export function sidePanel(lines: HalfLines, spec: SidePanelSpec, options: SeamOptions): PieceDraft {
  const { tops, legs } = lines;
  const sideWaist = spec.sideSeam.at(-1)!.to;
  const shoulder: EdgeSpec[] =
    tops.sideShoulderSegments > 0
      ? [{ id: "shoulder", kind: "other", segments: tops.sideShoulderSegments, pairsWith: spec.shoulderPair }]
      : [];
  const specs: EdgeSpec[] = [
    ...shoulder,
    { id: ARMHOLE_EDGE_ID, kind: "armhole", segments: tops.side.length - tops.sideShoulderSegments },
    { id: "side", kind: "side", segments: spec.sideSeam.length, pairsWith: spec.sidePair },
    { id: "waist", kind: "other", segments: 1 },
    styleEdge(spec.centreId),
  ];
  return {
    id: spec.id,
    name: PIECE_NAMES[spec.id]!,
    cut: sidePanelCut(),
    stitchPath: [...tops.side, ...spec.sideSeam, lineSeg(sideWaist, legs[1]), ...lines.sideStyle],
    edges: buildEdges(spec.id, specs, options),
    notches: [bustNotch(segmentLength(lines.sideStyle[0]), spec.centreId)],
    bodyLines: [spec.bust, WAIST_LINE],
    grainLine: sidePanelGrain([legs[1].x, sideWaist.x], spec.underarmY, Math.min(sideWaist.y, legs[1].y)),
    darts: [],
  };
}
