/** Unit tests of the slit geometry: extension, notch and centre seam (issue #135). */
import { SIZE_MATRIX, straightKneeSkirt } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { skirtBlockModule } from "../../blocks/skirt/skirt-module";
import { SLIT_EXTENSION_MM, SLIT_HIP_CLEARANCE_MM, SLIT_TOP_NOTCH_ID } from "../../constants/skirt-style";
import { isClosed, selfIntersections } from "../../geometry";
import { edgeLengthMm, edgeSegments } from "../../pieces/measure";
import { createContext } from "../../pipeline/draft-context";
import { DEFAULT_ENGINE_OPTIONS } from "../../pipeline/generate-pattern";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { deepFreeze } from "../../test-utils/deep-freeze";
import { maxSlitLengthMm, SLIT_EDGE_ID, withSlit } from "./slit";

const sizeM = SIZE_MATRIX.find((e) => e.id === "size-m")!.measurements;
const { hipDepthMm, skirtLengthMm } = resolveDraftInputs(straightKneeSkirt, sizeM, DEFAULT_ENGINE_OPTIONS);
const blocks = skirtBlockModule.draft(createContext(straightKneeSkirt, sizeM, DEFAULT_ENGINE_OPTIONS)).pieces;
const front = deepFreeze(blocks.find((p) => p.id === "skirt-front")!);
const back = deepFreeze(blocks.find((p) => p.id === "skirt-back")!);
const SLIT_MM = 150;

/**
 * Edge ranges of a piece, in path order.
 *
 * @param edges - Edges.
 * @returns `[id, from, to]` rows.
 */
const ranges = (edges: readonly { id: string; fromSegment: number; toSegment: number }[]) =>
  edges.map((e) => [e.id, e.fromSegment, e.toSegment]);

describe("withSlit in the side seam", () => {
  const slit = withSlit(front, "side", "front", SLIT_MM);

  it("shortens the sewn side seam by the slit and marks its top with a notch at the seam end", () => {
    expect(edgeLengthMm(slit, "side")).toBeCloseTo(edgeLengthMm(front, "side") - SLIT_MM, 6);
    expect(slit.notches).toEqual([
      { id: SLIT_TOP_NOTCH_ID, edgeId: "side", atMm: edgeLengthMm(slit, "side") },
    ]);
  });

  it("adds an extension outside the seam, its own edge between side and hem", () => {
    expect(ranges(slit.edges)).toEqual([
      ["waist", 0, 0],
      ["side", 1, 2],
      [SLIT_EDGE_ID, 3, 4],
      ["hem", 5, 6],
      ["cf", 7, 7],
    ]);
    const hipXMm = front.stitchPath[2]!.to.x;
    const extension = edgeSegments(slit, SLIT_EDGE_ID);
    expect(extension[1]!.from.x).toBeCloseTo(hipXMm + SLIT_EXTENSION_MM, 6);
    expect(extension[1]!.from.y).toBeCloseTo(skirtLengthMm! - SLIT_MM + SLIT_EXTENSION_MM, 6);
    expect(isClosed(slit.stitchPath)).toBe(true);
    expect(selfIntersections(slit.stitchPath)).toEqual([]);
  });

  it("keeps the cut on the fold", () => {
    expect(slit.cut).toEqual(front.cut);
  });
});

describe("withSlit in the centre", () => {
  const slit = withSlit(back, "centre", "back", SLIT_MM);

  it("turns the fold into a centre seam sewn to the mirrored copy, cut as a pair", () => {
    const cb = slit.edges.find((e) => e.id === "cb")!;
    expect(cb).toMatchObject({ kind: "other", pairsWith: { pieceId: "skirt-back", edgeId: "cb" } });
    expect(slit.cut).toEqual({ quantity: 2, onFold: false, mirror: true, fabric: "main" });
  });

  it("sews the centre seam from the slit top to the waist, notched at the top", () => {
    expect(edgeLengthMm(slit, "cb")).toBeCloseTo(skirtLengthMm! - SLIT_MM, 6);
    expect(slit.notches).toEqual([{ id: SLIT_TOP_NOTCH_ID, edgeId: "cb", atMm: 0 }]);
  });

  it("puts the extension beyond the centre line, between hem and centre", () => {
    expect(ranges(slit.edges)).toEqual([
      ["waist", 0, 0],
      ["side", 1, 2],
      ["hem", 3, 4],
      [SLIT_EDGE_ID, 5, 6],
      ["cb", 7, 7],
    ]);
    expect(Math.min(...edgeSegments(slit, SLIT_EDGE_ID).map((s) => s.from.x))).toBeCloseTo(
      -SLIT_EXTENSION_MM,
      6,
    );
    expect(selfIntersections(slit.stitchPath)).toEqual([]);
  });
});

describe("maxSlitLengthMm", () => {
  it("is the straight seam below the hip line less the clearance", () => {
    expect(maxSlitLengthMm(front, "centre", "front", hipDepthMm)).toBeCloseTo(
      skirtLengthMm! - hipDepthMm - SLIT_HIP_CLEARANCE_MM,
      6,
    );
    expect(maxSlitLengthMm(front, "side", "front", hipDepthMm)).toBeCloseTo(
      skirtLengthMm! - hipDepthMm - SLIT_HIP_CLEARANCE_MM,
      6,
    );
  });
});
