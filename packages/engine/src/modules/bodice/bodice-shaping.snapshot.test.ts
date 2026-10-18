/** Visual snapshots of the bodice shaping modules (issue #138): each seed design for each chart size. */
import {
  SIZE_MATRIX,
  dartFreeLooseBlouse,
  princessArmholeBlouse,
  princessShoulderBlouse,
} from "@tafsila/test-fixtures";
import { describe, it } from "vitest";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");
const DESIGNS = { princessShoulderBlouse, princessArmholeBlouse, dartFreeLooseBlouse } as const;

describe.each(Object.entries(DESIGNS))("bodice shaping SVG %s", (_name, spec) => {
  it.each(CHART.map((e) => [e.id, e] as const))("%s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});
