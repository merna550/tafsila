/**
 * Visual snapshots of the sleeve styles and cuffs (issue #142): puff (short, band), bishop (long, band), cap and
 * flutter (short) for each chart size, plus a set-in long sleeve with a band and a puff elbow sleeve with elastic at M.
 */
import type { DesignSpec } from "@tafsila/schemas";
import {
  SIZE_MATRIX,
  bishopSleeveBlouse,
  capSleeveBlouse,
  flutterSleeveBlouse,
  puffSleeveBlouse,
  setInSleeveBlouse,
  sizeM,
} from "@tafsila/test-fixtures";
import { describe, it } from "vitest";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");
const DESIGNS = { puffSleeveBlouse, bishopSleeveBlouse, capSleeveBlouse, flutterSleeveBlouse } as const;

/** Cuffs tried at size M only. */
const CUFFS: Readonly<Record<string, DesignSpec>> = {
  setInLongBand: { ...setInSleeveBlouse, sleeve: { type: "set-in", length: "long", cuff: "band" } },
  puffElbowElastic: { ...puffSleeveBlouse, sleeve: { type: "puff", length: "elbow", cuff: "elastic" } },
};

describe.each(Object.entries(DESIGNS))("sleeve style SVG %s", (_name, spec) => {
  it.each(CHART.map((e) => [e.id, e] as const))("%s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});

describe("cuff SVG at size M", () => {
  it.each(Object.entries(CUFFS))("%s", async (_name, spec) => {
    await expectSvgSnapshot(generatePattern(spec, sizeM, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: "size-m" }));
  });
});
