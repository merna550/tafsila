import { patternResultSchema } from "@tafsila/schemas";
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { expectSvgSnapshot } from "../render/expect-svg-snapshot";
import { renderSvg } from "../render/svg";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "./generate-pattern";
import { marksRegistry } from "./test-support/marks-module";
import { rectangleRegistry } from "./test-support/rectangle-module";

const options = { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: "M", clientLabel: "Mona" };

describe("the pipeline with every mark", () => {
  const result = generatePattern(vNeckHalfCircleDress, sizeM, options, marksRegistry);

  it("returns a valid result where every piece has grain, name and cut info (FR-VAL-06 input)", () => {
    expect(patternResultSchema.safeParse(result).success).toBe(true);
    for (const piece of result.pieces) {
      expect(piece.grainLine[0]).not.toEqual(piece.grainLine[1]);
      expect(piece.labels.map((l) => l.kind)).toEqual(expect.arrayContaining(["name", "cut", "size"]));
    }
  });

  it("writes paired notches at the same distance from the shared end (within 2 mm)", () => {
    const [front, back] = result.pieces;
    for (const n of front!.notches) {
      const partner = back!.notches.find((b) => b.id === n.id)!;
      expect(Math.abs(400 - partner.atMm - n.atMm)).toBeLessThanOrEqual(2);
      expect(partner.marks).toBe(n.marks);
    }
  });

  it("carries one scale square on the sheet", () => {
    expect(renderSvg(result).match(/scale-square"/g)).toHaveLength(1);
  });

  it("the marked rectangle pair matches the committed snapshot", async () => {
    await expectSvgSnapshot(result);
  });

  it("leaves the single rectangle without a second square", () => {
    const single = generatePattern(vNeckHalfCircleDress, sizeM, options, rectangleRegistry);
    expect(renderSvg(single).match(/id="[^"]*scale-square"/g)).toHaveLength(1);
  });
});
