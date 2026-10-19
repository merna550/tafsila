/**
 * Unit tests of the cuffs at size M (issue #142, decision 142, 5 and 6): the band as a loop above the elbow and open
 * at the wrist, the elastic casing and its notion, and the gathered hem the cuff sews to.
 */
import { sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { SLEEVE_EDGE } from "../../blocks/sleeve/ids";
import {
  CUFF_BAND_EASE_MM,
  CUFF_OVERLAP_MM,
  CUFF_PLACKET_WIDTH_MM,
  CUFF_SLIT_LENGTH_MM,
} from "../../constants/cuff";
import { ELASTIC_LENGTH_RATIO } from "../../constants/elastic";
import { DEFAULT_FABRIC_WEIGHT, GATHER_RATIO_BY_WEIGHT } from "../../constants/skirt-fullness";
import { BISHOP_HEM_DROP_MM, PUFF_HEM_GATHER_RATIO } from "../../constants/sleeve-style";
import { SLEEVE_LENGTH_SHARE } from "../../constants/sleeve-block";
import { edgeLengthMm, edgeSegments } from "../../pieces/measure";
import { OVERLAP_EDGE_ID, STRIP_END_EDGE_ID, STRIP_START_EDGE_ID } from "../../pieces/strip";
import { limbCircumferenceAtMm } from "./limb";
import { draftSleeveDesign, pieceOf } from "./test-support";

const SEAM = "seam-1";

/**
 * The FR-VAL-01 cuff row of a pattern.
 *
 * @param r - Pattern.
 * @returns The row.
 */
function cuffRow(r: ReturnType<typeof draftSleeveDesign>) {
  return r.validation.checks.find((c) => c.code?.startsWith("CUFF_LENGTH"));
}

describe("band cuff", () => {
  it("is a loop gathering a puff hem at 1.5 times its seam", () => {
    const r = draftSleeveDesign("puff", "short", "band");
    const cuff = pieceOf(r, "cuff");
    const sleeve = pieceOf(r, "sleeve");
    const seamMm = edgeLengthMm(cuff, SEAM);
    expect(edgeLengthMm(sleeve, SLEEVE_EDGE.hem)).toBeCloseTo(seamMm * PUFF_HEM_GATHER_RATIO, 0);
    expect(cuff.edges.some((e) => e.id === OVERLAP_EDGE_ID)).toBe(false);
    expect(cuff.edges.find((e) => e.id === STRIP_END_EDGE_ID)?.pairsWith?.edgeId).toBe(STRIP_START_EDGE_ID);
    expect(sleeve.marks?.some((m) => m.kind === "slit")).toBe(false);
    expect(cuff.cut.quantity).toBe(2);
    expect(cuffRow(r)).toMatchObject({ status: "pass" });
  });

  it("opens at the wrist of a bishop sleeve, with a slit and its placket", () => {
    const r = draftSleeveDesign("bishop", "long", "band");
    const cuff = pieceOf(r, "cuff");
    const sleeve = pieceOf(r, "sleeve");
    const block = pieceOf(draftSleeveDesign("set-in", "long", "none"), "sleeve");
    const seamMm = sizeM.wrist + CUFF_BAND_EASE_MM;
    expect(edgeLengthMm(cuff, SEAM)).toBeCloseTo(seamMm, 6);
    expect(edgeLengthMm(cuff, OVERLAP_EDGE_ID)).toBeCloseTo(CUFF_OVERLAP_MM, 6);
    expect(cuff.edges.find((e) => e.id === OVERLAP_EDGE_ID)?.pairsWith).toBeUndefined();
    const ratio = GATHER_RATIO_BY_WEIGHT[DEFAULT_FABRIC_WEIGHT];
    expect(edgeLengthMm(sleeve, SLEEVE_EDGE.hem)).toBeCloseTo(seamMm * ratio, 6);
    const hemY = (p: typeof sleeve) => edgeSegments(p, SLEEVE_EDGE.hem)[0]!.from.y;
    expect(hemY(sleeve) - hemY(block)).toBeCloseTo(BISHOP_HEM_DROP_MM, 6);
    const slit = sleeve.marks?.find((m) => m.kind === "slit");
    const hem = edgeSegments(sleeve, SLEEVE_EDGE.hem)[0]!;
    expect(slit).toMatchObject({ shape: "line", from: { x: -hem.from.x / 2, y: hem.from.y } });
    if (slit?.shape === "line") expect(slit.from.y - slit.to.y).toBe(CUFF_SLIT_LENGTH_MM);
    const placket = pieceOf(r, "cuff-placket");
    expect(edgeLengthMm(placket, SEAM)).toBe(2 * CUFF_SLIT_LENGTH_MM);
    expect(edgeLengthMm(placket, STRIP_END_EDGE_ID)).toBe(CUFF_PLACKET_WIDTH_MM);
    expect(placket.cut.quantity).toBe(2);
    expect(r.validation.checks.find((c) => c.id === "FR-VAL-02")).toMatchObject({ status: "pass" });
    expect(sleeve.sleeveCap?.gatheredMm).toBeUndefined();
    expect(cuffRow(r)).toMatchObject({ status: "pass" });
  });

  it("declares the eased hem of a long set-in sleeve and pairs the cuff with it", () => {
    const r = draftSleeveDesign("set-in", "long", "band");
    const cuff = pieceOf(r, "cuff");
    const hemMm = edgeLengthMm(pieceOf(r, "sleeve"), SLEEVE_EDGE.hem);
    const seamMm = edgeLengthMm(cuff, SEAM);
    expect(cuff.edges.find((e) => e.id === SEAM)?.pairsWith).toEqual({
      pieceId: "sleeve",
      edgeId: SLEEVE_EDGE.hem,
      intendedEaseMm: seamMm - hemMm,
    });
    expect(r.validation.checks.filter((c) => c.status === "fail")).toEqual([]);
  });
});

describe("elastic cuff", () => {
  it("is a casing as long as the relaxed hem, with the elastic cut to the arm", () => {
    const r = draftSleeveDesign("bishop", "three-quarter", "elastic");
    const sleeve = pieceOf(r, "sleeve");
    const casing = pieceOf(r, "sleeve-casing");
    expect(edgeLengthMm(casing, SEAM)).toBeCloseTo(edgeLengthMm(sleeve, SLEEVE_EDGE.hem), 6);
    expect(casing.edges.find((e) => e.id === STRIP_END_EDGE_ID)?.pairsWith?.edgeId).toBe(STRIP_START_EDGE_ID);
    const capHeightMm = edgeSegments(sleeve, SLEEVE_EDGE.underarmFront)[0]!.from.y;
    const limbMm = limbCircumferenceAtMm(
      sizeM,
      capHeightMm,
      sizeM.armLength * SLEEVE_LENGTH_SHARE.threeQuarter,
    );
    const elastic = r.notions!.filter((n) => n.kind === "elastic");
    expect(elastic).toEqual([
      expect.objectContaining({ id: "sleeve-elastic", kind: "elastic", widthMm: 10, quantity: 2 }),
    ]);
    expect(elastic[0]!.lengthMm).toBeCloseTo(limbMm * ELASTIC_LENGTH_RATIO, 6);
    expect(cuffRow(r)).toMatchObject({ status: "pass" });
  });

  it("interpolates the arm girth from the upper arm to the wrist", () => {
    const m = { upperArm: 300, wrist: 160, armLength: 600 };
    expect(limbCircumferenceAtMm(m, 100, 50)).toBe(300);
    expect(limbCircumferenceAtMm(m, 100, 350)).toBe(230);
    expect(limbCircumferenceAtMm(m, 100, 700)).toBe(160);
  });
});
