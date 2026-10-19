/**
 * Visual snapshots of garment assembly (issue #144): the seed dress with a waist seam, the one-piece and princess
 * one-piece dresses, and the category seed blouse and skirt, on the five chart sizes.
 */
import {
  SIZE_MATRIX,
  dartedBlouse,
  onePieceDress,
  princessOnePieceDress,
  seedDress,
  straightBandSkirt,
} from "@tafsila/test-fixtures";
import { describe, it } from "vitest";
import { expectSvgSnapshot } from "@tafsila/engine/testing";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

/** The five chart sizes. */
const SIZES = SIZE_MATRIX.filter((e) => e.source === "chart");

/** One design per assembly path. */
const DESIGNS = { seedDress, onePieceDress, princessOnePieceDress, dartedBlouse, straightBandSkirt } as const;

describe.each(Object.entries(DESIGNS))("assembly SVG %s", (_name, spec) => {
  it.each(SIZES.map((e) => [e.id, e] as const))("%s", async (id, entry) => {
    await expectSvgSnapshot(
      generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: id }),
    );
  });
});
