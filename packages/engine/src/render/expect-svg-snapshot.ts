/** Vitest helper: snapshot a rendered pattern as a reviewable `.svg` file. Exported as `@tafsila/engine/testing`. */
import type { PatternResult } from "@tafsila/schemas";
import { expect } from "vitest";
import { renderSvg, type SvgOptions } from "./svg";

/**
 * File-name-safe version of the running test's name.
 *
 * @returns The name, with anything but letters, digits and dashes turned into `-`.
 */
function snapshotName(): string {
  const name = expect.getState().currentTestName ?? "snapshot";
  return name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

/**
 * Asserts that a pattern renders to the SVG stored in `__snapshots__/<test name>.svg` next to the test file.
 * Run `vitest -u` to write or update it; open the file in a browser to review it.
 *
 * @param result - The pattern.
 * @param options - Render options.
 * @returns A promise that settles when the comparison is done.
 */
export async function expectSvgSnapshot(result: PatternResult, options: SvgOptions = {}): Promise<void> {
  await expect(renderSvg(result, options)).toMatchFileSnapshot(`__snapshots__/${snapshotName()}.svg`);
}
