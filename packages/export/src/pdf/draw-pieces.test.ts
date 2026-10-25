/** Tests of the piece drawer: 1:1 offsets, clipping and balanced graphics state (issue #288). */
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { embedFonts } from "./fonts";
import { drawPiecesInWindow, toPagePoint } from "./draw-pieces";
import { pageContent } from "./test-support/read-pdf";
import { seedScene, testFonts } from "./test-support/seed-pdf";
import { MM_TO_PT } from "./units";
import type { PageFrame } from "./types";

const frame: PageFrame = { leftPt: 28, topPt: 800, widthPt: 538, heightPt: 780 };

/**
 * Draws the seed scene in a window on a fresh page and returns the trimmed content lines.
 *
 * @param window - The window in sheet mm.
 * @returns The operator lines.
 */
async function drawn(window: { minX: number; minY: number; maxX: number; maxY: number }): Promise<string[]> {
  const doc = await PDFDocument.create();
  const fonts = await embedFonts(doc, testFonts);
  drawPiecesInWindow({ page: doc.addPage([595.28, 841.89]), fonts, frame, window }, seedScene);
  return (await pageContent(await doc.save(), 0)).split("\n").map((l) => l.trim());
}

describe("toPagePoint", () => {
  it("maps the window origin to the frame's top-left and flips y", () => {
    const w = { minX: 100, minY: 200, maxX: 290, maxY: 477 };
    expect(toPagePoint(frame, w, { x: 100, y: 200 })).toEqual([28, 800]);
    const [x, y] = toPagePoint(frame, w, { x: 110, y: 210 });
    expect(x).toBeCloseTo(28 + 10 * MM_TO_PT, 6);
    expect(y).toBeCloseTo(800 - 10 * MM_TO_PT, 6);
  });
});

describe("drawPiecesInWindow", () => {
  const piece = seedScene.pieces[0]!;
  const window = {
    minX: piece.cell.x - 5,
    minY: piece.cell.y - 5,
    maxX: piece.cell.x + 185,
    maxY: piece.cell.y + 272,
  };

  it("clips to the printable rectangle before any path, and balances q/Q", async () => {
    const ops = await drawn(window);
    expect(ops.indexOf("W")).toBeGreaterThan(-1);
    expect(ops.indexOf("W")).toBeLessThan(ops.findIndex((l) => l.endsWith(" m")));
    expect(ops.filter((l) => l === "q")).toHaveLength(ops.filter((l) => l === "Q").length);
  });

  it("places the sheet origin at the window offset, scaled 72/25.4", async () => {
    const ops = await drawn(window);
    const origin = toPagePoint(frame, window, { x: 0, y: 0 });
    const cm = ops.find((l) => /^1 0 0 1 .* cm$/.test(l))!.split(" ");
    expect(Number(cm[4])).toBeCloseTo(origin[0], 1);
    expect(Number(cm[5])).toBeCloseTo(origin[1], 1);
    const scale = ops.find((l) => /^[\d.]+ 0 0 -[\d.]+ 0 0 cm$/.test(l))!.split(" ");
    expect(Number(scale[0])).toBeCloseTo(MM_TO_PT, 4);
  });

  it("draws no path for pieces outside the window", async () => {
    const ops = await drawn({ minX: -900, minY: -900, maxX: -800, maxY: -800 });
    expect(ops.some((l) => l.endsWith(" m") || l.endsWith(" l"))).toBe(false);
  });
});
