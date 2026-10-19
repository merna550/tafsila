/**
 * Visual snapshots of the waistband module (issue #140): the straight band, the contour band and the elastic casing
 * on their seed designs for each chart size (the waist facing shows in every other skirt snapshot), and the
 * centre-back and side closure variants for size M.
 */
import {
  SIZE_MATRIX,
  contourBandSkirt,
  elasticGatheredSkirt,
  sizeM,
  straightBandSkirt,
} from "@tafsila/test-fixtures";
import { describe, it } from "vitest";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");
const DESIGNS = { straightBandSkirt, contourBandSkirt, elasticGatheredSkirt } as const;

describe.each(Object.entries(DESIGNS))("waistband SVG %s", (_name, spec) => {
  it.each(CHART.map((e) => [e.id, e] as const))("%s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});

describe("waistband SVG closures", () => {
  it("straight band with a side zip, size M", async () => {
    const spec = { ...straightBandSkirt, closure: { type: "zip", position: "side" } } as const;
    await expectSvgSnapshot(generatePattern(spec, sizeM, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: "M" }));
  });

  it("contour band with a centre-back zip, size M", async () => {
    const spec = { ...contourBandSkirt, closure: { type: "zip", position: "center-back" } } as const;
    await expectSvgSnapshot(generatePattern(spec, sizeM, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: "M" }));
  });
});
