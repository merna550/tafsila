/**
 * Property tests of the closure module (issue #143) across the size matrix: button marks evenly spaced, symmetric and
 * inside their piece; zip-stop notches on both paired edges within 2 mm (FR-VAL-04) at the zip length; and no
 * duplicate or dangling edge references.
 */
import type { DesignSpec, Mark, PatternResult, Piece } from "@tafsila/schemas";
import {
  SIZE_MATRIX,
  bishopSleeveBlouse,
  buttonFrontBlouse,
  buttonFrontDress,
  centreBackZipDress,
  centreFrontZipDress,
  princessShoulderBlouse,
  shirtCollarBlouse,
  sideZipDress,
  straightKneeSkirt,
} from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BUTTONHOLE_PAST_CENTRE_MM, BUTTON_MAX_SPACING_MM } from "../../constants/closure";
import { distance, pointInPolygon, samplePath } from "../../geometry";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

/** SRS notch tolerance (FR-VAL-04). */
const TOLERANCE_MM = 2;

/** Floating-point slack on equal spacing, in mm. */
const SPACING_EPSILON_MM = 1e-6;

/** Wall-clock allowance on a busy CI runner with coverage; locally each test takes well under a tenth of it. */
const PIPELINE_TEST_TIMEOUT_MS = 30_000;

/** Sampled design × size pairs per run. */
const RUNS = 10;

/** Designs with buttons: front and back, plain and princess, blouse and dress, and a wrist cuff. */
const BUTTON_DESIGNS: readonly DesignSpec[] = [
  buttonFrontBlouse,
  buttonFrontDress,
  shirtCollarBlouse,
  { ...princessShoulderBlouse, closure: { type: "buttons", position: "center-front" } },
  { ...buttonFrontBlouse, closure: { type: "buttons", position: "center-back" } },
  bishopSleeveBlouse,
];

/** Designs with a zip that stops short of the bottom: centre back, side and centre front. */
const ZIP_DESIGNS: readonly DesignSpec[] = [
  centreBackZipDress,
  sideZipDress,
  centreFrontZipDress,
  straightKneeSkirt,
];

/**
 * Whether a point lies inside a piece's stitch outline.
 *
 * @param piece - The piece.
 * @param p - The point.
 * @returns True inside.
 */
function inside(piece: Piece, p: { x: number; y: number }): boolean {
  return pointInPolygon(p, samplePath(piece.stitchPath));
}

/**
 * Checks every button and buttonhole mark of a piece: inside the outline, each hole next to its button.
 *
 * @param piece - The piece.
 * @param marks - Its marks.
 */
function expectMarksInside(piece: Piece, marks: readonly Mark[]): void {
  for (const mark of marks) {
    if (mark.shape === "point") expect(inside(piece, mark.at), `${piece.id}/${mark.id}`).toBe(true);
    else {
      expect(inside(piece, mark.from), `${piece.id}/${mark.id}`).toBe(true);
      expect(inside(piece, mark.to), `${piece.id}/${mark.id}`).toBe(true);
    }
  }
  const buttons = marks.filter((m) => m.kind === "button");
  const holes = marks.filter((m) => m.kind === "buttonhole");
  if (piece.id === "cuff") return;
  expect(holes).toHaveLength(buttons.length);
  for (const button of buttons) {
    const hole = holes.find((h) => h.id === button.id.replace("button-", "buttonhole-"))!;
    if (button.shape !== "point" || hole.shape !== "line") throw new Error("wrong mark shapes");
    expect(distance(button.at, hole.from)).toBeCloseTo(BUTTONHOLE_PAST_CENTRE_MM, 6);
  }
}

/**
 * Gaps between consecutive buttons on each piece (a button opening may run over the bodice and the skirt).
 *
 * @param result - The pattern.
 * @returns Gaps in mm, piece by piece.
 */
function buttonGapsMm(result: PatternResult): number[] {
  return result.pieces
    .filter((piece) => piece.id !== "cuff")
    .flatMap((piece) => {
      const ys = (piece.marks ?? []).flatMap((m) =>
        m.kind === "button" && m.shape === "point" ? [m.at.y] : [],
      );
      const sorted = ys.toSorted((a, b) => a - b);
      return sorted.slice(1).map((y, i) => y - sorted[i]!);
    });
}

/**
 * Every edge reference resolves and no piece repeats an edge id.
 *
 * @param result - The pattern.
 */
function expectNoDanglingRefs(result: PatternResult): void {
  for (const piece of result.pieces) {
    const ids = piece.edges.map((e) => e.id);
    expect(new Set(ids).size, piece.id).toBe(ids.length);
    for (const ref of [...piece.edges.map((e) => e.pairsWith), ...piece.notches.map((n) => n.pairsWith)]) {
      if (!ref) continue;
      const other = result.pieces.find((p) => p.id === ref.pieceId);
      expect(
        other?.edges.some((e) => e.id === ref.edgeId),
        `${piece.id} -> ${ref.pieceId}/${ref.edgeId}`,
      ).toBe(true);
    }
  }
}

describe("closure properties", () => {
  it(
    "keeps button marks inside their piece, evenly spaced and symmetric, across the size matrix",
    () => {
      fc.assert(
        fc.property(fc.constantFrom(...BUTTON_DESIGNS), fc.constantFrom(...SIZE_MATRIX), (spec, entry) => {
          const result = generatePattern(spec, entry.measurements, DEFAULT_ENGINE_OPTIONS);
          expect(result.validation.status).not.toBe("fail");
          for (const piece of result.pieces) {
            const marks = (piece.marks ?? []).filter((m) => m.kind === "button" || m.kind === "buttonhole");
            expectMarksInside(piece, marks);
          }
          const gaps = buttonGapsMm(result);
          for (const gap of gaps) {
            expect(Math.abs(gap - gaps[0]!)).toBeLessThanOrEqual(SPACING_EPSILON_MM);
            expect(gap).toBeLessThanOrEqual(BUTTON_MAX_SPACING_MM + SPACING_EPSILON_MM);
          }
          expectNoDanglingRefs(result);
        }),
        { numRuns: RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it(
    "puts the zip stop on both paired edges within 2 mm, with every notch aligned, across the size matrix",
    () => {
      fc.assert(
        fc.property(fc.constantFrom(...ZIP_DESIGNS), fc.constantFrom(...SIZE_MATRIX), (spec, entry) => {
          const result = generatePattern(spec, entry.measurements, DEFAULT_ENGINE_OPTIONS);
          const stops = result.pieces.flatMap((p) =>
            p.notches.filter((n) => n.id === "zip-stop").map((n) => ({ piece: p, notch: n })),
          );
          expect(stops.length).toBeGreaterThan(0);
          for (const { piece, notch } of stops) {
            const partner = result.pieces.find((p) => p.id === notch.pairsWith!.pieceId)!;
            const mate = partner.notches.find(
              (n) => n.id === "zip-stop" && n.edgeId === notch.pairsWith!.edgeId,
            )!;
            expect(Math.abs(mate.atMm - notch.atMm), piece.id).toBeLessThanOrEqual(TOLERANCE_MM);
          }
          const notchRows = result.validation.checks.filter((c) => c.id === "FR-VAL-04");
          expect(notchRows.filter((c) => c.status !== "pass")).toEqual([]);
          expect(result.validation.status).not.toBe("fail");
          expectNoDanglingRefs(result);
        }),
        { numRuns: RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );
});
