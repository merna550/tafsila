/**
 * Visual snapshots of the neckline module (issue #139): every front style on a seed design for each chart size
 * (the round neck is the darted blouse's), and a deep V override on a princess bodice for size M.
 */
import {
  SIZE_MATRIX,
  boatNeckBlouse,
  highRoundNeckBlouse,
  princessShoulderBlouse,
  sizeM,
  squareNeckBlouse,
  sweetheartNeckBlouse,
  vNeckBlouse,
} from "@tafsila/test-fixtures";
import { describe, it } from "vitest";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");
const DESIGNS = {
  vNeckBlouse,
  squareNeckBlouse,
  sweetheartNeckBlouse,
  boatNeckBlouse,
  highRoundNeckBlouse,
} as const;

describe.each(Object.entries(DESIGNS))("neckline SVG %s", (_name, spec) => {
  it.each(CHART.map((e) => [e.id, e] as const))("%s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});

describe("neckline SVG combinations", () => {
  it("princess shoulder with a 160 mm V override, size M", async () => {
    const spec = {
      ...princessShoulderBlouse,
      neckline: { front: "v", back: "round", depthFrontMm: 160, collar: "none" },
    } as const;
    await expectSvgSnapshot(generatePattern(spec, sizeM, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: "M" }));
  });
});
