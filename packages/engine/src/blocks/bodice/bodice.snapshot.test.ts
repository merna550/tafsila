/** Visual snapshots of the bodice block (issue #128): the seed blouse for each chart size. */
import { SIZE_MATRIX, dartedBlouse } from "@tafsila/test-fixtures";
import { describe, it } from "vitest";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");

describe("bodice block SVG", () => {
  it.each(CHART.map((e) => [e.id, e] as const))("dartedBlouse %s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(dartedBlouse, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});
