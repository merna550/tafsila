import * as fixtures from "@tafsila/test-fixtures";
import { SIZE_MATRIX } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { generatePattern } from "../pipeline/generate-pattern";

const SEEDS = [
  "dartedBlouse",
  "vNeckHalfCircleDress",
  "buttonFrontBlouse",
  "elasticGatheredSkirt",
  "centreBackZipDress",
  "straightMidiBackSlitSkirt",
  "tieredMidiSkirt",
  "puffSleeveBlouse",
  "linedSidePocketDress",
  "princessOnePieceDress",
] as const;

const SIZE_M = SIZE_MATRIX.find((entry) => entry.id === "size-m")!;

/**
 * Prints the numbered steps, Arabic then English, for review (AC 3).
 *
 * @param name - The seed design name.
 * @returns The text.
 */
function printSteps(name: (typeof SEEDS)[number]): string {
  const result = generatePattern(fixtures[name], SIZE_M.measurements);
  return result.sewingOrder
    .map((s) => `${s.order}. [${s.action}] ${s.text.ar}\n   ${s.text.en}\n   ${s.edges.join(", ")}`)
    .join("\n");
}

describe("sewing order text of the seed designs, size M (reviewed by Merna)", () => {
  it.each(SEEDS)("%s", async (name) => {
    await expect(printSteps(name)).toMatchFileSnapshot(`./__snapshots__/${name}.txt`);
  });

  it("puts the waist seam before the closure, and levelling before the hem (AC 2)", () => {
    const result = generatePattern(fixtures.vNeckHalfCircleDress, SIZE_M.measurements);
    const texts = result.sewingOrder.map((s) => s.text.en);
    const at = (needle: string) => texts.findIndex((t) => t.includes(needle));
    expect(at("Join the bodice to the skirt")).toBeGreaterThan(-1);
    expect(at("Join the bodice to the skirt")).toBeLessThan(at("insert the zip"));
    expect(at("Hang the skirt")).toBeLessThan(at("Turn up the skirt hem"));
  });
});
