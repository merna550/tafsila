/**
 * Visual snapshots of the closures (issue #143): centre-back, side and centre-front zips, centre-front buttons on a
 * dress and a blouse, and no closure, at the small, middle and largest chart sizes.
 */
import {
  SIZE_MATRIX,
  buttonFrontBlouse,
  buttonFrontDress,
  centreBackZipDress,
  centreFrontZipDress,
  noClosureDress,
  sideZipDress,
} from "@tafsila/test-fixtures";
import { describe, it } from "vitest";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

/** Three chart sizes: the sew-test sizes (smallest, middle, largest). */
const SIZES = SIZE_MATRIX.filter((e) => ["size-s", "size-m", "size-xxl"].includes(e.id));

/** One design per closure. */
const DESIGNS = {
  centreBackZipDress,
  sideZipDress,
  centreFrontZipDress,
  buttonFrontDress,
  buttonFrontBlouse,
  noClosureDress,
} as const;

describe.each(Object.entries(DESIGNS))("closure SVG %s", (_name, spec) => {
  it.each(SIZES.map((e) => [e.id, e] as const))("%s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});
