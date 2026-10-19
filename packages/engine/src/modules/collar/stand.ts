/**
 * The collar stand shared by the shirt and mandarin collars (issue #141, decision 141, 5-6). Aldrich 6th ed., ch. 5,
 * "Shirt collar with stand" and "Mandarin collar": the neck edge runs straight from CB and curves up to a rise at CF;
 * the top edge is the neck moved up by the stand height, and the CF end is square to the neck. The neck edge is as
 * long as the bodice half neck by construction: the curve takes the front neck's run and the straight part the rest.
 */
import type { EngineOptions, Segment } from "@tafsila/schemas";
import { BUTTON_EXTENSION_MM } from "../../constants/closure";
import {
  STAND_C1_RUN_SHARE,
  STAND_C2_RISE_SHARE,
  STAND_C2_RUN_SHARE,
  STAND_EXTENSION_RADIUS_MM,
} from "../../constants/collar";
import { DraftingError } from "../../errors/drafting-error";
import {
  add,
  cubicLength,
  cubicSeg,
  lineSeg,
  offsetPath,
  pathLength,
  pt,
  reversePath,
  scale,
  splitAtLength,
  tangentAtLength,
  translate,
  type Point,
} from "../../geometry";
import type { EdgeSpec } from "../../blocks/shared/edges";
import type { PieceDraft } from "../../pipeline/draft-context";
import { roundJoint } from "./corner";
import {
  COLLAR_EDGE_IDS,
  COLLAR_PIECE_IDS,
  type CollarHolders,
  type CollarNeck,
  type CollarOpening,
  type CollarPieceSpec,
  collarCut,
  collarPiece,
  grainNearEnd,
  neckEdgeSpecs,
  neckNotches,
} from "./pieces";

/** A drafted stand before its ends are shaped. */
export interface StandShape {
  /** The neck edge, CB (at the origin) to CF, body below (+y). */
  readonly neckPath: readonly Segment[];
  /** The neck split at the shoulder. */
  readonly neck: CollarNeck;
  /** The top edge, CB to CF. */
  readonly top: readonly Segment[];
  /** The straight part of the neck edge, in mm. */
  readonly straightMm: number;
}

/** How the ends of a stand are shaped. */
export interface StandEnds {
  /** Where the stand opens. */
  readonly opening: Exclude<CollarOpening, "pair">;
  /** Whether the stand runs on past CF by the button extension. */
  readonly extension: boolean;
  /** Radius of the open end's top corner, 0 for a square end. */
  readonly endRadiusMm: number;
}

/** An outline with its edge runs, in path order. */
interface Run {
  /** Edge spec, without the segment count. */
  readonly spec: Omit<EdgeSpec, "segments">;
  /** Segments of the edge. */
  readonly segments: readonly Segment[];
}

/**
 * The stand neck edge for the bodice half neck: a straight line from CB, then a cubic curving up `riseMm` over the
 * front neck's length (flat start, lifting late).
 *
 * @param holders - The bodice neck holders.
 * @param riseMm - Rise at CF.
 * @returns The neck path, CB to CF.
 * @throws {DraftingError} COLLAR_STAND_UNSOLVABLE when the curve is longer than the half neck.
 */
export function standNeckPath(holders: CollarHolders, riseMm: number): Segment[] {
  const halfNeckMm = holders.back.lengthMm + holders.front.lengthMm;
  const runMm = holders.front.lengthMm;
  const curve = cubicSeg(
    pt(0, 0),
    pt(runMm * STAND_C1_RUN_SHARE, 0),
    pt(runMm * STAND_C2_RUN_SHARE, -riseMm * STAND_C2_RISE_SHARE),
    pt(runMm, -riseMm),
  );
  const straightMm = halfNeckMm - cubicLength(curve);
  if (straightMm <= 0)
    throw new DraftingError("COLLAR_STAND_UNSOLVABLE", "The stand curve is longer than the neck");
  return [lineSeg(pt(0, 0), pt(straightMm, 0)), translate(curve, pt(straightMm, 0))];
}

/**
 * Drafts the stand: neck edge, its split at the shoulder and the top edge.
 *
 * @param holders - The bodice neck holders.
 * @param heightMm - Stand height.
 * @param riseMm - Rise at CF.
 * @returns The stand shape.
 */
export function standShape(holders: CollarHolders, heightMm: number, riseMm: number): StandShape {
  const neckPath = standNeckPath(holders, riseMm);
  const [back, front] = splitAtLength(neckPath, holders.back.lengthMm);
  return {
    neckPath,
    neck: { back, front },
    top: offsetPath(neckPath, heightMm),
    straightMm: neckPath[0]!.to.x,
  };
}

/**
 * The button extension past CF: the neck line carried on `BUTTON_EXTENSION_MM` along its end tangent, up square to
 * the top and back to the CF top point, both outer corners rounded.
 *
 * @param neckEnd - CF on the neck edge.
 * @param topEnd - CF on the top edge.
 * @param along - Unit tangent of the neck at CF.
 * @returns The extension segments, neck end to top end.
 */
function extensionRun(neckEnd: Point, topEnd: Point, along: Point): Segment[] {
  const out = scale(along, BUTTON_EXTENSION_MM);
  const lower = add(neckEnd, out);
  const upper = add(topEnd, out);
  const first = roundJoint([lineSeg(neckEnd, lower)], [lineSeg(lower, upper)], STAND_EXTENSION_RADIUS_MM);
  const second = roundJoint(first.after, [lineSeg(upper, topEnd)], STAND_EXTENSION_RADIUS_MM);
  return [...first.before, first.arc, ...second.before, second.arc, ...second.after];
}

/**
 * The CF end and the top edge: a fold, the button extension, a rounded open end or a square open end.
 *
 * @param shape - The stand.
 * @param ends - How the ends are shaped.
 * @returns The CF end run and the top edge, CF to CB.
 */
function frontRuns(shape: StandShape, ends: StandEnds): [Run, Segment[]] {
  const neckEnd = shape.neckPath.at(-1)!.to;
  const topEnd = shape.top.at(-1)!.to;
  const topBack = reversePath(shape.top);
  const cfLine = [lineSeg(neckEnd, topEnd)];
  if (ends.opening === "cf-fold")
    return [{ spec: { id: COLLAR_EDGE_IDS.cf, kind: "fold" }, segments: cfLine }, topBack];
  if (ends.extension) {
    const along = tangentAtLength(shape.neckPath, pathLength(shape.neckPath));
    return [
      {
        spec: { id: COLLAR_EDGE_IDS.extension, kind: "other" },
        segments: extensionRun(neckEnd, topEnd, along),
      },
      topBack,
    ];
  }
  if (ends.endRadiusMm <= 0)
    return [{ spec: { id: COLLAR_EDGE_IDS.cf, kind: "other" }, segments: cfLine }, topBack];
  const joint = roundJoint(cfLine, topBack, ends.endRadiusMm);
  return [
    { spec: { id: COLLAR_EDGE_IDS.cf, kind: "other" }, segments: [...joint.before, joint.arc] },
    joint.after,
  ];
}

/**
 * The top edge and the CB end: a fold, or (open at CB) the top corner rounded.
 *
 * @param topBack - The top edge, CF to CB.
 * @param heightMm - Stand height at CB.
 * @param ends - How the ends are shaped.
 * @returns The top edge and the CB end run.
 */
function backRuns(topBack: readonly Segment[], heightMm: number, ends: StandEnds): [Segment[], Run] {
  const cbLine = [lineSeg(pt(0, -heightMm), pt(0, 0))];
  if (ends.opening === "cb-fold")
    return [[...topBack], { spec: { id: COLLAR_EDGE_IDS.cb, kind: "fold" }, segments: cbLine }];
  const joint = roundJoint(topBack, cbLine, ends.endRadiusMm);
  return [
    joint.before,
    { spec: { id: COLLAR_EDGE_IDS.cb, kind: "other" }, segments: [joint.arc, ...joint.after] },
  ];
}

/** What a stand piece needs besides its shape. */
export interface StandPieceInput {
  /** Piece id. */
  readonly id: string;
  /** The bodice neck holders. */
  readonly holders: CollarHolders;
  /** Stand height. */
  readonly heightMm: number;
  /** How the ends are shaped. */
  readonly ends: StandEnds;
  /** The top edge's pair (the shirt collar fall), if any. */
  readonly topPair?: NonNullable<EdgeSpec["pairsWith"]>;
  /** Whether the edges declare pairs and carry notches (false for an interfacing). */
  readonly paired: boolean;
}

/**
 * The outline, edges and grain line of a stand piece (cut info and notches are the caller's).
 *
 * @param shape - The stand.
 * @param input - Id, ends and pairs.
 * @returns The piece spec without cut and notches.
 */
export function standPieceParts(
  shape: StandShape,
  input: StandPieceInput,
): Pick<CollarPieceSpec, "id" | "outline" | "edges" | "grainLine"> {
  const [front, topBack] = frontRuns(shape, input.ends);
  const [top, back] = backRuns(topBack, input.heightMm, input.ends);
  const topRun: Run = {
    spec: {
      id: COLLAR_EDGE_IDS.top,
      kind: "other",
      ...(input.paired && input.topPair ? { pairsWith: input.topPair } : {}),
    },
    segments: top,
  };
  const runs = [front, topRun, back];
  const neckEnd = shape.neckPath.at(-1)!.to;
  const along = tangentAtLength(shape.neckPath, pathLength(shape.neckPath));
  const grainLine =
    input.ends.opening === "cf-fold"
      ? grainNearEnd(neckEnd, shape.top.at(-1)!.to, scale(along, -1))
      : grainNearEnd(pt(0, 0), pt(0, -input.heightMm), pt(1, 0));
  return {
    id: input.id,
    outline: [...shape.neck.back, ...shape.neck.front, ...runs.flatMap((r) => r.segments)],
    edges: [
      ...neckEdgeSpecs(shape.neck, input.holders, input.paired),
      ...runs.map((r) => ({ ...r.spec, segments: r.segments.length })),
    ],
    grainLine,
  };
}

/**
 * The stand (cut twice: outer and inner) with its notches, and the stand interfacing.
 *
 * @param shape - The stand.
 * @param input - Id-free stand input: holders, height, ends and the top pair.
 * @param options - Engine options, for the seam allowances.
 * @returns The stand and its interfacing.
 */
export function standPieces(
  shape: StandShape,
  input: Omit<StandPieceInput, "id" | "paired">,
  options: Pick<EngineOptions, "seamAllowance">,
): [PieceDraft, PieceDraft] {
  const { opening } = input.ends;
  const stand = standPieceParts(shape, { ...input, id: COLLAR_PIECE_IDS.stand, paired: true });
  const interfacing = standPieceParts(shape, {
    ...input,
    id: COLLAR_PIECE_IDS.standInterfacing,
    paired: false,
  });
  return [
    collarPiece(
      { ...stand, cut: collarCut(opening, "main", 2), notches: neckNotches(input.holders) },
      options,
    ),
    collarPiece({ ...interfacing, cut: collarCut(opening, "interfacing"), notches: [] }, options),
  ];
}
