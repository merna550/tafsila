/** Regression test of spike #282: units, 1:1 lines, Arabic label order, subset size and byte-identical rebuilds. */
import { readFileSync } from "node:fs";
import { generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { tileInput } from "../tiles/tile-input";
import { shapeForPdf } from "./arabic-text";
import { buildSpikePdf, TEST_SQUARE_MM } from "./spike-pdf";
import { markedBounds, markedRects, pageSizes } from "./test-support/read-pdf";
import { A0_PT, MM_TO_PT, mmToPt } from "./units";

const fontDir = new URL("../../../../apps/web/public/fonts/", import.meta.url);
const fonts = {
  regular: new Uint8Array(readFileSync(new URL("IBMPlexSansArabic-Regular.ttf", fontDir))),
  bold: new Uint8Array(readFileSync(new URL("IBMPlexSansArabic-Bold.ttf", fontDir))),
};
const outline = tileInput(generatePattern(seedDress, sizeM)).outlines[0]!;
const bbox = {
  minX: Math.min(...outline.map((p) => p.x)),
  maxX: Math.max(...outline.map((p) => p.x)),
  minY: Math.min(...outline.map((p) => p.y)),
  maxY: Math.max(...outline.map((p) => p.y)),
};

describe("units", () => {
  it("converts 100 mm to 283.46 pt", () => {
    expect(mmToPt(100)).toBeCloseTo(283.46, 2);
    expect(MM_TO_PT).toBeCloseTo(2.8346, 4);
  });
});

describe("spike pdf", async () => {
  const bytes = await buildSpikePdf(fonts, outline);

  it("is an A0 page in points", async () => {
    const [size] = await pageSizes(bytes);
    expect(size!.width).toBeCloseTo(A0_PT.width, 2);
    expect(size!.height).toBeCloseTo(A0_PT.height, 2);
  });

  it("reads the 100 x 100 mm test square back as 283.46 pt on both axes", async () => {
    const [rect] = await markedRects(bytes, "TestSquare");
    expect(TEST_SQUARE_MM).toBe(100);
    expect(rect!.width).toBeCloseTo(283.46, 2);
    expect(rect!.height).toBeCloseTo(283.46, 2);
  });

  it("draws the engine outline 1:1 with the y axis flipped to the top of the page", async () => {
    const b = await markedBounds(bytes, "Outline");
    expect(b.width).toBeCloseTo(mmToPt(bbox.maxX - bbox.minX), 1);
    expect(b.height).toBeCloseTo(mmToPt(bbox.maxY - bbox.minY), 1);
    // The top of the piece (smallest engine y) is the top edge of the drawing: 20 mm below the page top.
    expect(b.y + b.height).toBeCloseTo(A0_PT.height - mmToPt(20), 1);
  });

  it("embeds a subset: the one-page sample stays under 120 KB", () => {
    expect(bytes.length).toBeLessThan(120_000);
  });

  it("builds byte-identical files for the same input", async () => {
    const again = await buildSpikePdf(fonts, outline);
    expect(Buffer.from(again).equals(Buffer.from(bytes))).toBe(true);
  });
});

describe("shapeForPdf", () => {
  it("puts the digit of an Arabic label on the left and keeps the Arabic run whole", () => {
    expect(shapeForPdf("أمام - قص ٢", true)).toEqual(["٢", "أمام - قص "]);
  });

  it("puts a Latin name on the left of its Arabic prefix, not reversed", () => {
    expect(shapeForPdf("فستان - Nour", true)).toEqual(["Nour", "فستان - "]);
  });

  it("keeps the order of digit groups: the digit run is pre-reversed for fontkit", () => {
    expect(shapeForPdf("كم ١٢ سم", true)).toEqual([" سم", "٢١", "كم "]);
  });

  it("leaves a Latin label in reading order", () => {
    expect(shapeForPdf("Front - cut 2", false)).toEqual(["Front - cut 2"]);
  });
});
