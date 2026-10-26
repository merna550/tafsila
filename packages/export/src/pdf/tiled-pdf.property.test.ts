/** Property tests of the tiled PDF: any sheet size gives A4 pages, a fixed test square and no throw (issue #288). */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { buildA4Pdf } from "./a4-pdf";
import { markedRects, pageCount, pageSizes } from "./test-support/read-pdf";
import { rectangle } from "./test-support/rectangle-pdf";
import { seedMeta, testFonts } from "./test-support/seed-pdf";
import { A4_PT } from "./units";

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
