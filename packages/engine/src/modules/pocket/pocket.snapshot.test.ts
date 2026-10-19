/** Visual snapshots of pockets, belt and lining (issue #145) at the small, middle and largest chart sizes. */
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import {
  SIZE_MATRIX,
  linedCircleSkirt,
  linedSidePocketDress,
  patchPocketSkirt,
} from "@tafsila/test-fixtures";
import { describe, it } from "vitest";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

/** Three chart sizes: the sew-test sizes (smallest, middle, largest). */
const SIZES = SIZE_MATRIX.filter((e) => ["size-s", "size-m", "size-xxl"].includes(e.id));

/** The three seed designs of this issue. */
const DESIGNS = { linedSidePocketDress, patchPocketSkirt, linedCircleSkirt } as const;

describe.each(Object.entries(DESIGNS))("pocket, belt and lining SVG %s", (_name, spec) => {
  it.each(SIZES.map((e) => [e.id, e] as const))("%s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});
