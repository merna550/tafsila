/**
 * Unit tests of the collar stand (issue #141): the neck edge equals the half neck within 0.1 mm for short, middle and
 * long necks, the CF rise, the button extension and the open-end shapes.
 */
import type { Segment } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { BUTTON_EXTENSION_MM } from "../../constants/closure";
import { MANDARIN_CF_RISE_MM, SHIRT_STAND_CF_RISE_MM } from "../../constants/collar";
import { DraftingError } from "../../errors/drafting-error";
import { dot, lineSeg, pathLength, pt, sub, tangentAtLength } from "../../geometry";
import type { NeckHolder } from "../../pieces/neck-seam";
import type { PieceDraft } from "../../pipeline/draft-context";
import type { CollarHolders } from "./pieces";
import { standNeckPath, standPieceParts, standShape } from "./stand";

/** Stand length tolerance against the half neck. */
const STAND_MM = 0.1;

/**
 * Holders with straight necks of the given lengths (only the lengths matter to the stand).
 *
 * @param backMm - Back neck length.
 * @param frontMm - Front neck length.
 * @returns The holders.
 */
function holders(backMm: number, frontMm: number): CollarHolders {
  /**
   * One straight holder.
   *
   * @param id - Piece id.
   * @param lengthMm - Neck length.
   * @returns The holder.
   */
  const holder = (id: string, lengthMm: number): NeckHolder => {
    const neck: Segment[] = [lineSeg(pt(0, 0), pt(lengthMm, 0))];
    return { piece: { id } as PieceDraft, neck, lengthMm };
  };
  return { back: holder("bodice-back", backMm), front: holder("bodice-front", frontMm) };
}

describe("stand neck edge", () => {
  it.each([
    [60, 90],
    [80, 120],
    [100, 160],
  ])("is as long as a %i + %i mm half neck", (backMm, frontMm) => {
    for (const rise of [SHIRT_STAND_CF_RISE_MM, MANDARIN_CF_RISE_MM]) {
      const path = standNeckPath(holders(backMm, frontMm), rise);
      expect(Math.abs(pathLength(path) - (backMm + frontMm))).toBeLessThanOrEqual(STAND_MM);
      expect(path.at(-1)!.to.y).toBeCloseTo(-rise, 9);
      expect(path[0]!.from).toEqual(pt(0, 0));
    }
  });

  it("splits at the shoulder: the back part is the back neck", () => {
    const shape = standShape(holders(80, 120), 30, SHIRT_STAND_CF_RISE_MM);
    expect(pathLength(shape.neck.back)).toBeCloseTo(80, 2);
    expect(pathLength(shape.neck.front)).toBeCloseTo(120, 2);
    expect(shape.top[0]!.from.y).toBeCloseTo(-30, 6);
  });

  it("refuses a front neck too long for the half neck", () => {
    expect(() => standNeckPath(holders(1, 100), 60)).toThrow(DraftingError);
  });
});

describe("stand ends", () => {
  const shape = standShape(holders(80, 120), 30, SHIRT_STAND_CF_RISE_MM);
  const base = { id: "collar-stand", holders: holders(80, 120), heightMm: 30, paired: false } as const;

  it("runs the button extension 15 mm past CF", () => {
    const parts = standPieceParts(shape, {
      ...base,
      ends: { opening: "cb-fold", extension: true, endRadiusMm: 0 },
    });
    const cf = shape.neckPath.at(-1)!.to;
    const along = tangentAtLength(shape.neckPath, pathLength(shape.neckPath));
    const reach = Math.max(...parts.outline.map((s) => dot(sub(s.to, cf), along)));
    expect(reach).toBeCloseTo(BUTTON_EXTENSION_MM, 1);
    expect(parts.edges.map((e) => e.id)).toContain("extension");
  });

  it("has a square CF end without the extension", () => {
    const parts = standPieceParts(shape, {
      ...base,
      ends: { opening: "cb-fold", extension: false, endRadiusMm: 0 },
    });
    const cf = parts.edges.find((e) => e.id === "cf")!;
    expect(cf.segments).toBe(1);
    expect(parts.edges.map((e) => e.id)).not.toContain("extension");
  });

  it("folds at CF and rounds the CB corner when it opens at CB", () => {
    const parts = standPieceParts(shape, {
      ...base,
      ends: { opening: "cf-fold", extension: false, endRadiusMm: 15 },
    });
    expect(parts.edges.find((e) => e.id === "cf")!.kind).toBe("fold");
    expect(parts.edges.find((e) => e.id === "cb")!.segments).toBe(2);
  });
});
