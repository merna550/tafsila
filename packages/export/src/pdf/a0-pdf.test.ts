/** Tests of the A0 PDF builder (issue #290, FR-EXP-02). */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { tileInput } from "../tiles/tile-input";
import { tileSheet } from "../tiles/tile-sheet";
import { A0_HEADER_MM, withHeaderBand } from "./a0-header";
import { buildA0Pdf } from "./a0-pdf";
import { MAP_TAG_PREFIX, TILE_TAG_PREFIX } from "./marked";
import { markedRects, markedTags, pageCount, pageSizes } from "./test-support/read-pdf";
import { rectangle } from "./test-support/rectangle-pdf";
import { seedMeta, seedResult, seedScene, testFonts } from "./test-support/seed-pdf";
import { A0_PT } from "./units";

const out = await buildA0Pdf(seedResult, seedScene, seedMeta, { fonts: testFonts });
const tiling = tileSheet(withHeaderBand(tileInput(seedResult)), "A0");

/**
 * True when a page has A0 size in either orientation.
 *
 * @param s - Page size in points.
 * @returns Whether it is A0.
 */
function isA0(s: { width: number; height: number }): boolean {
  const [short, long] = [Math.min(s.width, s.height), Math.max(s.width, s.height)];
  return Math.abs(short - A0_PT.width) < 0.01 && Math.abs(long - A0_PT.height) < 0.01;
}

describe("buildA0Pdf on the seed dress", () => {
  it("makes every page A0, one page per non-empty tile and no cover", async () => {
    process.stdout.write(`seed dress M A0 PDF: ${out.pageCount} sheet(s), ${out.bytes.length} bytes\n`);
    expect(A0_PT.width).toBeCloseTo(2383.94, 2);
    expect(A0_PT.height).toBeCloseTo(3370.39, 2);
    expect(out.pageCount).toBe(tiling.printed.length);
    expect(out.tileCount).toBe(out.pageCount);
    expect(await pageCount(out.bytes)).toBe(out.pageCount);
    for (const s of await pageSizes(out.bytes)) expect(isA0(s)).toBe(true);
  });

  it("pins the sheet count of the seed dress with the header band (2 without it, 3 with it)", () => {
    expect(tileSheet(tileInput(seedResult), "A0").printed).toHaveLength(2);
    expect(out.pageCount).toBe(3);
  });

  it("draws the test square 283.46 pt on sheet 1", async () => {
    const [square] = await markedRects(out.bytes, "TestSquare", 0);
    expect(square!.width).toBeCloseTo(283.46, 2);
    expect(square!.height).toBeCloseTo(283.46, 2);
  });

  it("draws no tile label and no page map when there is one sheet", { timeout: 30_000 }, async () => {
    const { result, scene } = rectangle(300, 300);
    const one = await buildA0Pdf(result, scene, seedMeta, { fonts: testFonts });
    expect(one.pageCount).toBe(1);
    const tags = await markedTags(one.bytes, 0);
    expect(tags.some((t) => t.startsWith(TILE_TAG_PREFIX) || t.startsWith(MAP_TAG_PREFIX))).toBe(false);
  });

  it("is byte-identical when built twice", async () => {
    const again = await buildA0Pdf(seedResult, seedScene, seedMeta, { fonts: testFonts });
    expect(Buffer.from(again.bytes).equals(Buffer.from(out.bytes))).toBe(true);
  });

  it("keeps the header band clear of the pieces", () => {
    const { area, outlines } = withHeaderBand(tileInput(seedResult));
    const band = outlines.at(-1)!;
    const bandBottom = Math.max(...band.map((p) => p.y));
    expect(bandBottom - area.minY).toBe(A0_HEADER_MM);
    for (const outline of outlines.slice(0, -1)) {
      expect(Math.min(...outline.map((p) => p.y))).toBeGreaterThanOrEqual(bandBottom);
    }
  });
});

describe("buildA0Pdf on a wide sheet", () => {
  it("gives two labelled sheets with a page map when the pattern is wider than one A0 sheet", async () => {
    const { result, scene } = rectangle(1500, 600);
    const wide = await buildA0Pdf(result, scene, seedMeta, { fonts: testFonts });
    expect(wide.pageCount).toBe(2);
    const first = await markedTags(wide.bytes, 0);
    expect(first.some((t) => t.startsWith(TILE_TAG_PREFIX))).toBe(true);
    expect(first.some((t) => t.startsWith(MAP_TAG_PREFIX))).toBe(true);
    expect((await markedTags(wide.bytes, 1)).some((t) => t.startsWith(TILE_TAG_PREFIX))).toBe(true);
  }, 30_000);

  it("always has A0 pages, the tiler's sheet count and a 283.46 pt test square", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 3000 }),
        fc.integer({ min: 50, max: 800 }),
        async (w, h) => {
          const { result, scene } = rectangle(w, h);
          const o = await buildA0Pdf(result, scene, seedMeta, { fonts: testFonts });
          expect(o.pageCount).toBe(tileSheet(withHeaderBand(tileInput(result)), "A0").printed.length);
          for (const s of await pageSizes(o.bytes)) expect(isA0(s)).toBe(true);
          const [sq] = await markedRects(o.bytes, "TestSquare", 0);
          expect(sq!.width).toBeCloseTo(283.46, 2);
        },
      ),
      { numRuns: 10 },
    );
  }, 60_000);
});
