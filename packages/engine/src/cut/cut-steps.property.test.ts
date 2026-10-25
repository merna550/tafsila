import type { DesignSpec, Point } from "@tafsila/schemas";
import * as fixtures from "@tafsila/test-fixtures";
import { SIZE_MATRIX } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { distance, distancePointToPolyline, lerp, samplePath } from "../geometry";
import { generatePattern } from "../pipeline/generate-pattern";
import { connectionCurve } from "./curve-points";
import { fromFrame, toFrame } from "./frame";
import { cutSteps } from "./index";
import type { PieceCutSteps } from "./types";

/** Every design of the catalogue, as the sewing-order property test lists them. */
const DESIGNS = Object.entries(fixtures).filter(
  (entry): entry is [string, DesignSpec] =>
    typeof entry[1] === "object" && entry[1] !== null && "category" in entry[1] && "closure" in entry[1],
);

/** Rebuilt points must land this close to the cut line, mm (AC 1). */
const POINT_TOLERANCE_MM = 0.5;

/** Connections must stay this close to the cut line, mm (AC 1, NFR-01). */
const CONNECTION_TOLERANCE_MM = 1;

/** Straight connections are checked every this many mm. */
const STRAIGHT_SAMPLE_MM = 5;

/** Slack on the measured gaps: chords are a little shorter than the arc they span. */
const GAP_SLACK_MM = 0.5;

/** Divides the gap slack into the noise allowed on the lowest across distance (0.05 mm). */
const ROUND_NOISE = 10;

/** A curve shorter than this many steps may have shorter gaps (decision 284 item 2). */
const LONG_CURVE_STEPS = 5;

/** The band below the step that a gap must fall in on a long curve (FR-CUT-02). */
const GAP_BAND_MM = 5;

/** Most halvings of one gap on a tight bend (decision 284 item 8). */
const MAX_HALVINGS = 8;

/**
 * The positions of a step's points.
 *
 * @param piece - The piece's steps.
 * @param labels - Point labels.
 * @returns Their positions in piece mm.
 */
function positionsOf(piece: PieceCutSteps, labels: readonly string[]): Point[] {
  return labels.map((label) => piece.points.find((p) => p.label === label)!.at);
}

/**
 * Whether a gap is within the step band, or a gap of that band halved one or more times on a tight bend.
 *
 * @param gapMm - The gap.
 * @param stepMm - The step.
 * @returns Whether it is allowed.
 */
function allowedGap(gapMm: number, stepMm: number): boolean {
  for (let halvings = 0; halvings <= MAX_HALVINGS; halvings += 1) {
    const whole = gapMm * 2 ** halvings;
    if (whole >= stepMm - GAP_BAND_MM - GAP_SLACK_MM && whole <= stepMm + GAP_SLACK_MM) return true;
  }
  return false;
}

/**
 * The smallest across distance the cut line itself reaches: 0, except where a V or sweetheart neckline's allowance
 * crosses the fold (engine bug #301, outside this issue), so the frame cannot be blamed for it.
 *
 * @param piece - The piece's steps.
 * @param cutLine - The piece's cut line, sampled.
 * @returns The lowest allowed across distance, mm.
 */
function lowestOnCutLine(piece: PieceCutSteps, cutLine: readonly Point[]): number {
  const across = Math.min(...cutLine.map((p) => toFrame(piece.frame, p).across));
  return Math.min(0, across) - GAP_SLACK_MM / ROUND_NOISE;
}

/**
 * Checks every point: distances not below the cut line's own, and cut-line points rebuilt on the cut line (AC 1).
 *
 * @param piece - The piece's steps.
 * @param cutLine - The piece's cut line, sampled.
 */
function checkPoints(piece: PieceCutSteps, cutLine: readonly Point[]): void {
  const lowest = lowestOnCutLine(piece, cutLine);
  for (const point of piece.points) {
    expect(point.alongMm).toBeGreaterThanOrEqual(0);
    expect(point.acrossMm).toBeGreaterThanOrEqual(lowest);
    if (point.kind === "dart" || point.kind === "grain") continue;
    const rebuilt = fromFrame(piece.frame, point.alongMm, point.acrossMm);
    expect(distancePointToPolyline(rebuilt, cutLine)).toBeLessThanOrEqual(POINT_TOLERANCE_MM);
  }
}

/**
 * Checks a straight connection: two points, and the ruler line within 1 mm of the cut line every 5 mm (AC 1).
 *
 * @param points - The connection's points.
 * @param cutLine - The piece's cut line, sampled.
 */
function checkStraight(points: readonly Point[], cutLine: readonly Point[]): void {
  expect(points).toHaveLength(2);
  const count = Math.max(1, Math.ceil(distance(points[0]!, points[1]!) / STRAIGHT_SAMPLE_MM));
  for (let i = 0; i <= count; i += 1) {
    const p = lerp(points[0]!, points[1]!, i / count);
    expect(distancePointToPolyline(p, cutLine)).toBeLessThanOrEqual(CONNECTION_TOLERANCE_MM);
  }
}

/**
 * Checks a curve connection: the smooth curve within 1 mm of the cut line (AC 1) and the gaps (AC 2).
 *
 * @param points - The connection's points.
 * @param cutLine - The piece's cut line, sampled.
 * @param stepMm - The curve step.
 */
function checkCurve(points: readonly Point[], cutLine: readonly Point[], stepMm: number): void {
  for (const p of samplePath(connectionCurve(points), 16)) {
    expect(distancePointToPolyline(p, cutLine)).toBeLessThanOrEqual(CONNECTION_TOLERANCE_MM);
  }
  const gaps = points.slice(1).map((p, i) => distance(points[i]!, p));
  for (const gap of gaps) expect(gap).toBeLessThanOrEqual(stepMm + GAP_SLACK_MM);
  const longCurve = gaps.reduce((sum, gap) => sum + gap, 0) > LONG_CURVE_STEPS * stepMm;
  for (const gap of longCurve ? gaps : []) expect(allowedGap(gap, stepMm)).toBe(true);
}

/**
 * Checks one piece's steps against its cut line (AC 1, AC 2).
 *
 * @param piece - The piece's steps.
 * @param cutLine - The piece's cut line, sampled.
 * @param stepMm - The curve step.
 */
function checkPiece(piece: PieceCutSteps, cutLine: readonly Point[], stepMm: number): void {
  expect(piece.steps.map((s) => s.n)).toEqual(piece.steps.map((_, i) => i + 1));
  checkPoints(piece, cutLine);
  for (const step of piece.steps) {
    if (step.key === "cut.connect.straight") checkStraight(positionsOf(piece, step.points), cutLine);
    if (step.key === "cut.connect.curve") checkCurve(positionsOf(piece, step.points), cutLine, stepMm);
  }
}

describe("direct-cut steps, every design in the catalogue (issue #284, AC 1, AC 2)", () => {
  it("has designs to test", () => {
    expect(DESIGNS.length).toBeGreaterThan(30);
  });

  it("rebuilds every point on the cut line and keeps every connection within 1 mm of it", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DESIGNS),
        fc.constantFrom(...SIZE_MATRIX),
        fc.constantFrom(20, 25, 30),
        ([, spec], entry, curveStepMm) => {
          const result = generatePattern(spec, entry.measurements);
          const steps = cutSteps(result, { curveStepMm });
          steps.pieces.forEach((piece, i) => {
            checkPiece(piece, samplePath(result.pieces[i]!.cutPath, 64), curveStepMm);
          });
        },
      ),
      { numRuns: 12 },
    );
  }, 120_000);

  it("is deterministic", () => {
    const result = generatePattern(fixtures.seedDress, SIZE_MATRIX[1]!.measurements);
    expect(cutSteps(result)).toEqual(cutSteps(result));
  });
});
