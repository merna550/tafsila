/** Fixture test of the tile input on the seed dress (issue #283). */
import { generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { isTileEmpty } from "./occupancy";
import { tileInput } from "./tile-input";
import { tileSheet } from "./tile-sheet";

const generated = generatePattern(seedDress, sizeM);
/** The seed carries its scale square as a piece label; strip it so the sheet draws its own square. */
const result = {
  ...generated,
  pieces: generated.pieces.map((p) => ({ ...p, labels: p.labels.filter((l) => l.kind !== "scale-square") })),
};

describe("tileInput", () => {
  const input = tileInput(result);

  it("has one outline per piece plus the scale square, all inside the area", () => {
    expect(input.outlines).toHaveLength(result.pieces.length + 1);
    for (const p of input.outlines.flat()) {
      expect(p.x).toBeGreaterThanOrEqual(input.area.minX - 1e-6);
      expect(p.x).toBeLessThanOrEqual(input.area.maxX + 1e-6);
      expect(p.y).toBeGreaterThanOrEqual(input.area.minY - 1e-6);
      expect(p.y).toBeLessThanOrEqual(input.area.maxY + 1e-6);
    }
  });

  it("prints the tile that holds the scale square on both papers", () => {
    const square = input.outlines.at(-1)!;
    for (const paper of ["A4", "A0"] as const) {
      const tiling = tileSheet(input, paper);
      const tile = tiling.tiles.find((t) => !isTileEmpty(t.window, [square]));
      expect(tile).toBeDefined();
      expect(tiling.printed).toContain(tile!.label);
    }
  });
});
