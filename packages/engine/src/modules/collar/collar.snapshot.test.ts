/** Visual snapshots of the collar module (issue #141): each collar seed design in sizes S, M and XXL. */
import { SIZE_MATRIX, mandarinBlouse, peterPanBlouse, shirtCollarBlouse } from "@tafsila/test-fixtures";
import { describe, it } from "vitest";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

const SIZES = SIZE_MATRIX.filter((e) => ["size-s", "size-m", "size-xxl"].includes(e.id));
const DESIGNS = { peterPanBlouse, shirtCollarBlouse, mandarinBlouse } as const;

describe.each(Object.entries(DESIGNS))("collar SVG %s", (_name, spec) => {
  it.each(SIZES.map((e) => [e.id, e] as const))("%s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});
