/** Visual snapshots of the set-in sleeve (issue #134): the sleeve seed blouse for each chart size and length. */
import { SIZE_MATRIX, setInSleeveBlouse } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import type { SleeveLength } from "./types";

const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");
const LENGTHS: readonly SleeveLength[] = ["cap", "short", "elbow", "three-quarter", "long"];
const CASES = CHART.flatMap((e) => LENGTHS.map((length) => [length, e.id, e] as const));

describe("set-in sleeve SVG", () => {
  it.each(CASES)("%s %s", async (length, id, entry) => {
    const spec = { ...setInSleeveBlouse, sleeve: { ...setInSleeveBlouse.sleeve!, length } };
    const result = generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id });
    expect(result.validation.status).not.toBe("fail");
    await expectSvgSnapshot(result);
  });
});
