/**
 * The numbered marking steps of one piece (issue #284, FR-CUT-01): the reference lines, then the cut line corner by
 * corner (curves as offset points), notches, darts, the grain line and the final cut. Order and labels are in
 * decision 284.
 */
import type { Piece, Point } from "@tafsila/schemas";
import { CUT_FRAME_SAMPLES_PER_CURVE, CUT_STRAIGHT_TOLERANCE_MM } from "../constants/cut";
import { closestPointOnPolyline, norm, pathLength, pointAtLength, pt, samplePath } from "../geometry";
import { edgeSegments } from "../pieces/measure";
import { cutFrame, toFrame } from "./frame";
import { curvePoints } from "./curve-points";
import { type CutRun, cutRuns, reverseRun, runStart } from "./runs";
import type {
  CutFrame,
  CutPoint,
  CutPointKind,
  CutStep,
  CutStepKey,
  CutStepParams,
  PieceCutSteps,
} from "./types";

/** Letters in the Latin alphabet, the base of the point labels. */
const ALPHABET_SIZE = 26;

/** Char code of `A`. */
const LETTER_A_CODE = 65;

/** The points and steps of a piece while they are being built. */
interface StepList {
  /** The piece's frame. */
  readonly frame: CutFrame;
  /** Points so far, in label order. */
  readonly points: CutPoint[];
  /** Steps so far, numbered from 1. */
  readonly steps: CutStep[];
}

/** The parts of a piece the steps read. */
export type CutPiece = Pick<
  Piece,
  "id" | "name" | "cut" | "stitchPath" | "cutPath" | "edges" | "notches" | "darts" | "grainLine"
>;

/**
 * The label of the i-th point: `A`..`Z`, then `AA`, `AB`.. (bijective base 26).
 *
 * @param index - Zero-based point index.
 * @returns The label.
 * @example
 * pointLabel(26) // "AA"
 */
export function pointLabel(index: number): string {
  let label = "";
  for (let rest = index + 1; rest > 0; rest = Math.floor((rest - 1) / ALPHABET_SIZE)) {
    label = String.fromCharCode(LETTER_A_CODE + ((rest - 1) % ALPHABET_SIZE)) + label;
  }
  return label;
}

/**
 * A distance a hair below zero (sampling noise at the piece's extremes) read as zero.
 *
 * @param mm - The distance.
 * @returns The distance, never a tiny negative.
 */
function clampNoise(mm: number): number {
  return mm < 0 && mm > -CUT_STRAIGHT_TOLERANCE_MM ? 0 : mm;
}

/**
 * Adds a numbered step.
 *
 * @param list - The list being built.
 * @param key - The step's message key.
 * @param points - Labels of the points it uses.
 * @param params - Values for its text.
 */
function addStep(list: StepList, key: CutStepKey, points: readonly string[], params: CutStepParams): void {
  list.steps.push({ n: list.steps.length + 1, key, points, params });
}

/**
 * Adds a point and the step that marks it.
 *
 * @param list - The list being built.
 * @param kind - What the point is.
 * @param at - Where it is, in piece mm.
 * @returns The point's label.
 */
function markPoint(list: StepList, kind: CutPointKind, at: Point): string {
  const label = pointLabel(list.points.length);
  const position = toFrame(list.frame, at);
  const point: CutPoint = {
    label,
    kind,
    at,
    alongMm: clampNoise(position.along),
    acrossMm: clampNoise(position.across),
  };
  list.points.push(point);
  addStep(list, `cut.mark.${kind}`, [label], {
    point: label,
    alongMm: point.alongMm,
    acrossMm: point.acrossMm,
  });
  return label;
}

/**
 * Distance of a piece point from the frame origin, used to find the corner nearest it.
 *
 * @param frame - The frame.
 * @param p - The point.
 * @returns Distance in mm.
 */
function distanceFromOrigin(frame: CutFrame, p: Point): number {
  const { along, across } = toFrame(frame, p);
  return norm(pt(along, across));
}

/**
 * The cut-line runs in walking order: from the corner nearest the origin, along the top edge first.
 *
 * @param runs - The runs in path order.
 * @param frame - The frame.
 * @returns The runs to walk, each starting where the previous ends.
 */
function walkOrder(runs: readonly CutRun[], frame: CutFrame): CutRun[] {
  const distances = runs.map((run) => distanceFromOrigin(frame, runStart(run)));
  const first = distances.indexOf(Math.min(...distances));
  const rotated = [...runs.slice(first), ...runs.slice(0, first)];
  const forwardNext = rotated[1] ? runStart(rotated[1]) : rotated[0]!.segments.at(-1)!.to;
  const backwardNext = runStart(rotated.at(-1)!);
  const backwards = toFrame(frame, backwardNext).along < toFrame(frame, forwardNext).along;
  return backwards ? [...rotated].reverse().map(reverseRun) : rotated;
}

/**
 * Whether a run lies on the fold: nothing to draw or cut there.
 *
 * @param run - The run.
 * @param frame - The frame.
 * @returns Whether it is the fold line itself.
 */
function onFold(run: CutRun, frame: CutFrame): boolean {
  if (frame.kind !== "fold" || run.kind !== "straight") return false;
  const ends = [runStart(run), run.segments.at(-1)!.to];
  return ends.every((p) => Math.abs(toFrame(frame, p).across) <= CUT_STRAIGHT_TOLERANCE_MM);
}

/**
 * Adds the cut-line steps: each corner, the offset points of each curve, and the connection to the next corner.
 *
 * @param list - The list being built.
 * @param piece - The piece.
 * @param stepMm - Gap between curve points, mm.
 */
function addCutLine(list: StepList, piece: CutPiece, stepMm: number): void {
  const runs = walkOrder(cutRuns(piece.cutPath), list.frame);
  const start = markPoint(list, "corner", runStart(runs[0]!));
  let current = start;
  runs.forEach((run, i) => {
    const inner = curvePoints(run, stepMm).map((p) => markPoint(list, "curve", p));
    const end = i === runs.length - 1 ? start : markPoint(list, "corner", runStart(runs[i + 1]!));
    if (!onFold(run, list.frame)) {
      const key = run.kind === "straight" ? "cut.connect.straight" : "cut.connect.curve";
      addStep(list, key, [current, ...inner, end], { from: current, to: end });
    }
    current = end;
  });
}

/**
 * Adds a mark for each notch, at the cut-line point nearest its place on the stitch line (decision 284 item 5).
 *
 * @param list - The list being built.
 * @param piece - The piece.
 */
function addNotches(list: StepList, piece: CutPiece): void {
  const cutLine = samplePath(piece.cutPath, CUT_FRAME_SAMPLES_PER_CURVE);
  for (const notch of piece.notches) {
    const edge = edgeSegments(piece, notch.edgeId);
    if (edge.length === 0) continue;
    const onStitch = pointAtLength(edge, Math.min(notch.atMm, pathLength(edge)));
    markPoint(list, "notch", closestPointOnPolyline(onStitch, cutLine));
  }
}

/**
 * Adds the two legs and the apex of each dart, on the stitch line, and the step that draws it.
 *
 * @param list - The list being built.
 * @param piece - The piece.
 */
function addDarts(list: StepList, piece: CutPiece): void {
  for (const dart of piece.darts) {
    const legA = markPoint(list, "dart", dart.legs[0]);
    const apex = markPoint(list, "dart", dart.apex);
    const legB = markPoint(list, "dart", dart.legs[1]);
    addStep(list, "cut.connect.dart", [legA, apex, legB], { legA, apex, legB });
  }
}

/**
 * Adds the two ends of the grain line and the step that draws it.
 *
 * @param list - The list being built.
 * @param piece - The piece.
 */
function addGrainLine(list: StepList, piece: CutPiece): void {
  const from = markPoint(list, "grain", piece.grainLine[0]);
  const to = markPoint(list, "grain", piece.grainLine[1]);
  addStep(list, "cut.connect.grain", [from, to], { from, to });
}

/**
 * The marking steps of one piece, numbered 1..N.
 *
 * @param piece - The piece.
 * @param stepMm - Gap between curve points, mm (already checked against FR-CUT-02).
 * @returns The frame, points and steps.
 * @throws {DraftingError} CUT_FOLD_NOT_STRAIGHT when the fold edge bends.
 */
export function pieceCutSteps(piece: CutPiece, stepMm: number): PieceCutSteps {
  const list: StepList = { frame: cutFrame(piece), points: [], steps: [] };
  addStep(list, list.frame.kind === "fold" ? "cut.reference.fold" : "cut.reference.grain", [], {});
  addStep(list, "cut.reference.top", [], {});
  addCutLine(list, piece, stepMm);
  addNotches(list, piece);
  addDarts(list, piece);
  addGrainLine(list, piece);
  const { quantity, onFold: folded, mirror, fabric } = piece.cut;
  addStep(list, "cut.cut", [], { quantity, onFold: folded ? 1 : 0, mirror: mirror ? 1 : 0, fabric });
  return { pieceId: piece.id, name: piece.name, frame: list.frame, points: list.points, steps: list.steps };
}
