/** Visual snapshots of three catalogue designs on the five chart sizes (issue #147): 15 SVGs to review in the PR. */
import { SIZE_MATRIX, aLineMidiSkirt, dartedBlouse, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { describe, it } from "vitest";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "./generate-pattern";

/** The five chart sizes S to XXL. */
const CHART_SIZES = SIZE_MATRIX.filter((e) => e.source === "chart");

/** One blouse, one skirt and one dress. */
const DESIGNS = { dartedBlouse, aLineMidiSkirt, vNeckHalfCircleDress } as const;

describe.each(Object.entries(DESIGNS))("catalogue SVG %s", (_name, spec) => {
  it.each(CHART_SIZES.map((e) => [e.id, e] as const))("%s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});
