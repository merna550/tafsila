import * as fixtures from "@tafsila/test-fixtures";
import { SIZE_MATRIX } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { cutStepText } from "../i18n/cut-steps";
import { generatePattern } from "../pipeline/generate-pattern";
import { cutSteps } from "./index";
import type { PieceCutSteps } from "./types";

const SIZE_M = SIZE_MATRIX.find((entry) => entry.id === "size-m")!;

/** Snapshot rounding: 0.1 mm. */
const ROUND = 10;

/**
 * Rounds every number in a value to 0.1 mm so the snapshot ignores float noise.
 *
 * @param value - Any JSON value.
 * @returns The same value with rounded numbers.
 */
function rounded(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_, v: unknown) => (typeof v === "number" ? Math.round(v * ROUND) / ROUND : v)),
  );
}

/**
 * The numbered texts of a piece's steps, Arabic then English, for Merna to read in the PR.
 *
 * @param piece - The piece's steps.
 * @returns The text.
 */
function printSteps(piece: PieceCutSteps): string {
  const head = `${piece.name.ar} / ${piece.name.en}: ${piece.steps.length} steps, ${piece.points.length} points`;
  const lines = piece.steps.map((s) => `${s.n}. ${cutStepText(s, "ar")}\n   ${cutStepText(s, "en")}`);
  return [head, ...lines].join("\n");
}

describe("direct-cut steps of the seed dress, size M (issue #284, AC 4)", () => {
  const result = generatePattern(fixtures.seedDress, SIZE_M.measurements);
  const steps = cutSteps(result);
  const front = steps.pieces.find((p) => p.pieceId === "bodice-front")!;
  const back = steps.pieces.find((p) => p.pieceId === "bodice-back")!;

  it.each([
    ["bodice-front", front],
    ["bodice-back", back],
  ])("%s steps", (_, piece) => {
    expect(rounded(piece)).toMatchSnapshot();
  });

  it("front and back texts (reviewed by Merna)", async () => {
    await expect([printSteps(front), printSteps(back)].join("\n\n")).toMatchFileSnapshot(
      "./__snapshots__/seed-dress-steps.txt",
    );
  });

  it("step counts per piece", () => {
    expect(Object.fromEntries(steps.pieces.map((p) => [p.pieceId, p.steps.length]))).toMatchSnapshot();
  });
});
