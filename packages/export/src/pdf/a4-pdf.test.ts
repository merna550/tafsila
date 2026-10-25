/** Tests of the A4 PDF builder on the seed dress (issue #288, FR-EXP-01). */
import { describe, expect, it } from "vitest";
import { tileInput } from "../tiles/tile-input";
import { tileSheet } from "../tiles/tile-sheet";
import { buildA4Pdf } from "./a4-pdf";
import { MAP_EMPTY_TAG_PREFIX, MAP_TAG_PREFIX, TILE_TAG_PREFIX } from "./marked";
import { contentOps, markedRects, markedTags, pageCount, pageSizes } from "./test-support/read-pdf";
import { seedMeta, seedResult, seedScene, testFonts } from "./test-support/seed-pdf";
import { A4_PT } from "./units";

const started = performance.now();
const out = await buildA4Pdf(seedResult, seedScene, seedMeta, { fonts: testFonts });
const buildMs = Math.round(performance.now() - started);
const tiling = tileSheet(tileInput(seedResult), "A4");
const printed = tiling.tiles.filter((t) => !t.empty);

describe("buildA4Pdf on the seed dress", () => {
  it("logs the build time (NFR-02 target: under 20 s)", () => {
    process.stdout.write(
      `seed dress M A4 PDF: ${buildMs} ms, ${out.pageCount} pages, ${out.bytes.length} bytes\n`,
    );
    expect(buildMs).toBeLessThan(20_000);
  });

  it("makes every page A4", async () => {
    const sizes = await pageSizes(out.bytes);
    expect(sizes).toHaveLength(out.pageCount);
    for (const s of sizes) {
      expect(s.width).toBeCloseTo(A4_PT.width, 2);
      expect(s.height).toBeCloseTo(A4_PT.height, 2);
    }
    expect(A4_PT.width).toBeCloseTo(595.28, 2);
    expect(A4_PT.height).toBeCloseTo(841.89, 2);
  });

  it("draws the test square 283.46 pt on both axes on page 1", async () => {
    const [square] = await markedRects(out.bytes, "TestSquare", 0);
    expect(square!.width).toBeCloseTo(283.46, 2);
    expect(square!.height).toBeCloseTo(283.46, 2);
  });

  it("has one page per non-empty tile plus the cover, labelled like the map", async () => {
    expect(await pageCount(out.bytes)).toBe(printed.length + 1);
    expect(out.tileCount).toBe(printed.length);
    for (const [i, tile] of printed.entries()) {
      expect(await markedTags(out.bytes, i + 1)).toContain(`${TILE_TAG_PREFIX}${tile.label}`);
    }
    const mapTags = await markedTags(out.bytes, 0);
    for (const t of tiling.tiles) {
      expect(mapTags).toContain(`${t.empty ? MAP_EMPTY_TAG_PREFIX : MAP_TAG_PREFIX}${t.label}`);
    }
  });

  it("is byte-identical when built twice, with the fixed creation date", async () => {
    const again = await buildA4Pdf(seedResult, seedScene, seedMeta, { fonts: testFonts });
    expect(Buffer.from(again.bytes).equals(Buffer.from(out.bytes))).toBe(true);
    expect(Buffer.from(out.bytes).toString("latin1")).toContain("D:20261001100000Z");
  });

  it("reports progress after the cover and after each tile", async () => {
    const calls: [number, number][] = [];
    await buildA4Pdf(seedResult, seedScene, seedMeta, {
      fonts: testFonts,
      onProgress: (d, t) => calls.push([d, t]),
    });
    expect(calls).toHaveLength(out.pageCount);
    expect(calls.at(-1)).toEqual([out.pageCount, out.pageCount]);
  });

  it("balances q and Q on every page, so clipping never leaks", async () => {
    for (let i = 0; i < out.pageCount; i++) {
      const ops = await contentOps(out.bytes, i);
      const q = ops.split("\n").filter((l) => l.trim() === "q").length;
      const Q = ops.split("\n").filter((l) => l.trim() === "Q").length;
      expect(q).toBe(Q);
    }
  });

  it("matches the operator snapshots of the cover and tile A1", async () => {
    const cover = (await contentOps(out.bytes, 0)).split("\n").filter((l) => !/Tj|TJ|Tf|Td|BT|ET/.test(l));
    await expect(cover.join("\n")).toMatchFileSnapshot("./__snapshots__/a4-cover.ops.txt");
    const a1 = printed.findIndex((t) => t.label === "A1");
    const ops = (await contentOps(out.bytes, a1 + 1)).split("\n").filter((l) => !/Tj|TJ|Tf|Td|BT|ET/.test(l));
    await expect(ops.slice(0, 120).join("\n")).toMatchFileSnapshot("./__snapshots__/a4-tile-a1.ops.txt");
  });
});
