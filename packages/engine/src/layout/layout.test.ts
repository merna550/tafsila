import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { LABEL_CLEARANCE_MM, LABEL_MIN_SIZE_MM } from "../constants/labels";
import { bbox, distanceSegmentToRect, rectCorners, samplePath, pointInPolygon } from "../geometry";
import { DEFAULT_ENGINE_OPTIONS } from "../pipeline/generate-pattern";
import { createContext, type DraftContext, type PieceDraft } from "../pipeline/draft-context";
import {
  lShapePoints,
  polygonPiece,
  rectanglePoints,
  trapezoidPoints,
} from "../pipeline/test-support/shapes";
import { labelRect, obstaclesOf } from "./obstacles";
import { layout } from "./index";
import { placeLabelsStep } from "./place-labels";
import { scaleSquareStep } from "./scale-square";

const SHAPES = [rectanglePoints, lShapePoints, trapezoidPoints] as const;

/**
 * A context with the given pieces.
 *
 * @param pieces - Pieces.
 * @param clientLabel - Optional client label.
 * @returns The context.
 */
function ctxWith(pieces: PieceDraft[], clientLabel?: string): DraftContext {
  const options = { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: "M", ...(clientLabel ? { clientLabel } : {}) };
  return { ...createContext(vNeckHalfCircleDress, sizeM, options), pieces };
}

describe("label placement (FR-PAT-02)", () => {
  it("gives every piece a name, cut and size label", () => {
    const out = placeLabelsStep(ctxWith([polygonPiece("a", rectanglePoints(200, 300))], "Mona"));
    const labels = out.pieces[0]!.labels!;
    expect(labels.map((l) => l.kind)).toEqual(["name", "cut", "size"]);
    expect(labels[2]!.text.en).toContain("Mona");
  });

  it("keeps the labels inside the piece, clear of every line, or puts them below the piece (property)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHAPES),
        fc.integer({ min: 20, max: 450 }),
        fc.integer({ min: 20, max: 450 }),
        (shape, w, h) => {
          const piece = polygonPiece("p", shape(w, h));
          const placed = placeLabelsStep(ctxWith([piece])).pieces[0]!;
          const obstacles = obstaclesOf(placed);
          const box = bbox(obstacles.outline);
          const rects = placed.labels!.map(labelRect);
          const below = rects.every((r) => r.minY >= box.maxY);
          const inside = rects.every(
            (r) =>
              rectCorners(r).every((c) => pointInPolygon(c, obstacles.outline)) &&
              obstacles.stretches.every(
                ([a, b]) => distanceSegmentToRect(r, a, b) >= LABEL_CLEARANCE_MM - 1e-9,
              ),
          );
          expect(below || inside).toBe(true);
          expect(placed.labels!.every((l) => (l.sizeMm ?? 0) >= LABEL_MIN_SIZE_MM)).toBe(true);
        },
      ),
      { numRuns: 60 },
    );
  });

  it("puts a tiny piece's labels outside, below it", () => {
    const placed = placeLabelsStep(ctxWith([polygonPiece("loop", rectanglePoints(30, 20))])).pieces[0]!;
    expect(placed.labels!.every((l) => labelRect(l).minY >= 20)).toBe(true);
  });

  it("is deterministic and idempotent", () => {
    const ctx = ctxWith([polygonPiece("a", lShapePoints(300, 400))]);
    const once = placeLabelsStep(ctx);
    expect(placeLabelsStep(ctx)).toEqual(once);
    expect(placeLabelsStep(once).pieces[0]!.labels).toEqual(once.pieces[0]!.labels);
  });
});

describe("scale square", () => {
  it("sits inside a 300 x 400 piece, clear of its grain line and labels", () => {
    const out = layout(ctxWith([polygonPiece("a", rectanglePoints(300, 400))]));
    const squares = out.pieces[0]!.labels!.filter((l) => l.kind === "scale-square");
    expect(squares).toHaveLength(1);
    const rect = labelRect(squares[0]!);
    expect(rect.maxX - rect.minX).toBe(100);
    const outline = samplePath(out.pieces[0]!.stitchPath);
    expect(rectCorners(rect).every((c) => pointInPolygon(c, outline))).toBe(true);
    const grain = out.pieces[0]!.grainLine;
    expect(distanceSegmentToRect(rect, grain[0], grain[1])).toBeGreaterThan(0);
  });

  it("is absent when no piece can hold it, and never doubled", () => {
    const small = layout(ctxWith([polygonPiece("a", rectanglePoints(80, 80))]));
    expect(small.pieces[0]!.labels!.some((l) => l.kind === "scale-square")).toBe(false);
    const big = ctxWith([
      polygonPiece("a", rectanglePoints(300, 400)),
      polygonPiece("b", rectanglePoints(300, 500)),
    ]);
    const twice = scaleSquareStep(scaleSquareStep(layout(big)));
    const count = twice.pieces.flatMap((p) => p.labels!).filter((l) => l.kind === "scale-square").length;
    expect(count).toBe(1);
    expect(twice.pieces[1]!.labels!.some((l) => l.kind === "scale-square")).toBe(true);
  });
});
