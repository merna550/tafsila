/** Property tests of the tiled PDF: any sheet size gives A4 pages, a fixed test square and no throw (issue #288). */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { PatternScene } from "@tafsila/engine";
import type { PatternResult } from "@tafsila/schemas";
import { buildA4Pdf } from "./a4-pdf";
import { markedRects, pageCount, pageSizes } from "./test-support/read-pdf";
import { seedMeta, seedResult, seedScene, testFonts } from "./test-support/seed-pdf";
import { A4_PT } from "./units";

/**
 * A pattern with one rectangular piece of the given size, so the sheet (and the tile count) follows it.
 *
 * @param w - Piece width in mm.
 * @param h - Piece height in mm.
 * @returns The result and its scene.
 */
function rectangle(w: number, h: number): { result: PatternResult; scene: PatternScene } {
  const base = seedResult.pieces[0]!;
  const corners = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const path = corners.map((from, i) => ({ kind: "line" as const, from, to: corners[(i + 1) % 4]! }));
  const piece = { ...base, cutPath: path, stitchPath: path, labels: [], notches: [], darts: [], edges: [] };
  const d = `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  const scenePiece = {
    ...seedScene.pieces[0]!,
    cutD: d,
    stitchD: d,
    grainD: "",
    notches: [],
    darts: [],
    labels: [],
  };
  return {
    result: { ...seedResult, pieces: [piece] },
    scene: {
      widthMm: w + 40,
      heightMm: h + 40,
      pieces: [{ ...scenePiece, cell: { x: 20, y: 20 }, bboxMm: { widthMm: w, heightMm: h } }],
    },
  };
}

describe("buildA4Pdf on synthetic sheets", () => {
  it("always has non-empty tiles + 1 pages, all A4, with a 283.46 pt test square, and never throws", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 1500 }),
        fc.integer({ min: 50, max: 1500 }),
        async (w, h) => {
          const { result, scene } = rectangle(w, h);
          const out = await buildA4Pdf(result, scene, seedMeta, { fonts: testFonts });
          expect(out.pageCount).toBe(out.tileCount + 1);
          expect(await pageCount(out.bytes)).toBe(out.pageCount);
          for (const s of await pageSizes(out.bytes)) {
            expect(s.width).toBeCloseTo(A4_PT.width, 2);
            expect(s.height).toBeCloseTo(A4_PT.height, 2);
          }
          const [sq] = await markedRects(out.bytes, "TestSquare", 0);
          expect(sq!.width).toBeCloseTo(283.46, 2);
        },
      ),
      { numRuns: 15 },
    );
  }, 30_000);

  it("gives cover + one page for a piece smaller than one tile", async () => {
    const { result, scene } = rectangle(60, 60);
    const out = await buildA4Pdf(result, scene, seedMeta, { fonts: testFonts });
    expect(out.pageCount).toBe(2);
  });
});
