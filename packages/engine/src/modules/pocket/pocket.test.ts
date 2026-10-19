/** Unit tests of the pocket module (issue #145): notches, bags, patch pocket, the compatibility matrix and refusals. */
import type { DesignSpec, PatternResult, Piece } from "@tafsila/schemas";
import {
  SIZE_MATRIX,
  dartedBlouse,
  linedSidePocketDress,
  onePieceDress,
  patchPocketSkirt,
  seedDress,
  sideZipDress,
  sizeM,
  straightKneeSkirt,
  tieredMidiSkirt,
  pleatedKneeSkirt,
} from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import {
  PATCH_POCKET_HEIGHT_MM,
  PATCH_POCKET_HEM_MM,
  PATCH_POCKET_WIDTH_MM,
  POCKET_BAG_EXTENSION_MM,
  POCKET_OPENING_MM,
  POCKET_OPENING_TOP_BELOW_WAIST_MM,
} from "../../constants/pocket";
import { edgeLengthMm } from "../../pieces/measure";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { INPUT_ERROR_MESSAGES } from "../../pipeline/input-errors";
import { pocketAllowed } from "./compatibility";

/** Wall-clock allowance for a few full pipeline runs on a busy CI runner with coverage. */
const PIPELINE_TEST_TIMEOUT_MS = 30_000;

/**
 * Drafts a design at size M.
 *
 * @param spec - The design.
 * @returns The pattern.
 */
function draft(spec: DesignSpec): PatternResult {
  return generatePattern(spec, sizeM, DEFAULT_ENGINE_OPTIONS);
}

/**
 * A piece by id.
 *
 * @param result - The pattern.
 * @param id - Piece id.
 * @returns The piece.
 */
function piece(result: PatternResult, id: string): Piece {
  const found = result.pieces.find((p) => p.id === id);
  expect(found, id).toBeDefined();
  return found!;
}

/**
 * The distances of the two opening notches from the top of a side edge.
 *
 * @param p - A shell piece with the notches.
 * @returns Top and bottom distance down the edge.
 */
function openingDown(p: Piece): [number, number] {
  const length = edgeLengthMm(p, "side", { closeDarts: true });
  const at = (id: string) => p.notches.find((n) => n.id === id)!.atMm;
  const [a, b] = [at("pocket-top"), at("pocket-bottom")];
  return a < b ? [a, b] : [length - a, length - b];
}

describe("side-seam pockets", () => {
  it(
    "put the notches 40 and 200 mm below the waist on a skirt, a dress skirt and a one-piece dress",
    () => {
      const skirt = draft({
        ...straightKneeSkirt,
        closure: { type: "zip", position: "center-back" },
        pockets: ["side-seam"],
      });
      const [top, bottom] = openingDown(piece(skirt, "skirt-front"));
      expect(top).toBeCloseTo(POCKET_OPENING_TOP_BELOW_WAIST_MM, 3);
      expect(bottom - top).toBeCloseTo(POCKET_OPENING_MM, 3);
      const dress = draft(linedSidePocketDress);
      expect(openingDown(piece(dress, "skirt-front"))[0]).toBeCloseTo(POCKET_OPENING_TOP_BELOW_WAIST_MM, 3);
      const onePiece = draft({ ...onePieceDress, pockets: ["side-seam"] });
      const front = piece(onePiece, "bodice-front");
      const [t, b] = openingDown(front);
      expect(b - t).toBeCloseTo(POCKET_OPENING_MM, 3);
      expect(t).toBeGreaterThan(POCKET_OPENING_TOP_BELOW_WAIST_MM);
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it("draws two closed bags whose outer edges are the same length and pair with each other", () => {
    const result = draft(linedSidePocketDress);
    const [front, back] = [piece(result, "pocket-bag-front"), piece(result, "pocket-bag-back")];
    for (const bag of [front, back]) {
      expect(bag.cut).toMatchObject({ quantity: 2, mirror: true, fabric: "main" });
      expect(bag.stitchPath[0]!.from).toEqual(bag.stitchPath.at(-1)!.to);
      expect(edgeLengthMm(bag, "along-side")).toBeCloseTo(POCKET_OPENING_MM + 2 * POCKET_BAG_EXTENSION_MM, 6);
      expect(bag.edges.find((e) => e.id === "along-side")!.pairsWith).toBeUndefined();
    }
    expect(edgeLengthMm(front, "outer")).toBeCloseTo(edgeLengthMm(back, "outer"), 6);
    expect(front.edges.find((e) => e.id === "outer")!.pairsWith).toMatchObject({
      pieceId: "pocket-bag-back",
    });
  });

  it("report the opening match and the bag notches as passing checks", () => {
    const { checks } = draft(linedSidePocketDress).validation;
    expect(checks.filter((c) => c.code === "POCKET_OPENING_MATCH_OK")).toHaveLength(2);
    expect(checks.filter((c) => c.status === "fail")).toEqual([]);
  });
});

describe("patch pockets", () => {
  it("add a 150 by 170 mm piece cut twice with a 30 mm top hem and four placement lines inside the front", () => {
    const result = draft(patchPocketSkirt);
    const patch = piece(result, "patch-pocket");
    expect(patch.cut).toMatchObject({ quantity: 2, fabric: "main" });
    expect(edgeLengthMm(patch, "top")).toBe(PATCH_POCKET_WIDTH_MM);
    expect(edgeLengthMm(patch, "right")).toBe(PATCH_POCKET_HEIGHT_MM);
    expect(patch.edges.find((e) => e.id === "top")).toMatchObject({
      kind: "hem",
      seamAllowanceMm: PATCH_POCKET_HEM_MM,
    });
    const marks = piece(result, "skirt-front").marks!.filter((m) => m.kind === "pocket-placement");
    expect(marks).toHaveLength(4);
    const xs = marks.flatMap((m) => (m.shape === "line" ? [m.from.x, m.to.x] : []));
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(PATCH_POCKET_WIDTH_MM, 6);
    expect(Math.min(...xs)).toBeGreaterThan(0);
  });
});

describe("pocket combinations", () => {
  it("allows and refuses each cell of the matrix", () => {
    const sideZipSkirt = { ...straightKneeSkirt, pockets: ["side-seam"] } as DesignSpec;
    expect(pocketAllowed(straightKneeSkirt, "side-seam")).toBe(false);
    expect(
      pocketAllowed({ ...sideZipSkirt, closure: { type: "zip", position: "center-back" } }, "side-seam"),
    ).toBe(true);
    expect(pocketAllowed(tieredMidiSkirt, "side-seam")).toBe(false);
    expect(pocketAllowed(sideZipDress, "side-seam")).toBe(false);
    expect(pocketAllowed(dartedBlouse, "side-seam")).toBe(false);
    expect(pocketAllowed(seedDress, "side-seam")).toBe(true);
    expect(pocketAllowed(straightKneeSkirt, "patch")).toBe(true);
    expect(pocketAllowed(dartedBlouse, "patch")).toBe(true);
    expect(pocketAllowed(pleatedKneeSkirt, "patch")).toBe(false);
    expect(pocketAllowed(tieredMidiSkirt, "patch")).toBe(false);
  });

  it("returns a bilingual POCKET_UNSUPPORTED with no pieces", () => {
    for (const spec of [
      { ...tieredMidiSkirt, pockets: ["side-seam"] },
      { ...pleatedKneeSkirt, pockets: ["patch"] },
      { ...sideZipDress, pockets: ["side-seam"] },
    ] as DesignSpec[]) {
      const r = draft(spec);
      expect(r.validation.status).toBe("fail");
      expect(r.pieces).toEqual([]);
      expect(r.validation.checks[0]).toMatchObject({
        code: "POCKET_UNSUPPORTED",
        message: INPUT_ERROR_MESSAGES.POCKET_UNSUPPORTED,
      });
    }
  });

  it("returns POCKET_NO_ROOM for a tuck-in blouse patch, a side slit and the smallest size on a mini skirt", () => {
    const blouse = draft({ ...dartedBlouse, pockets: ["patch"] });
    const slit = draft({
      ...straightKneeSkirt,
      closure: { type: "zip", position: "center-back" },
      skirt: { type: "straight", length: "knee", slit: { position: "side", lengthMm: 500 } },
      pockets: ["side-seam"],
    });
    const mini = generatePattern(
      {
        ...straightKneeSkirt,
        skirt: { type: "straight", length: "mini", lengthMm: 280 },
        pockets: ["patch"],
      },
      SIZE_MATRIX[0]!.measurements,
      DEFAULT_ENGINE_OPTIONS,
    );
    for (const r of [blouse, slit, mini]) {
      expect(r.validation.checks[0]).toMatchObject({ code: "POCKET_NO_ROOM" });
    }
  });
});
