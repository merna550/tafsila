/** Unit tests of the dart-free bodice module (issue #138, `bodice.shaping: none`). */
import { dartFreeLooseBlouse, dartedBlouse, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { distance } from "../../geometry";
import { edgeLengthMm } from "../../pieces/measure";
import { generatePattern } from "../../pipeline/generate-pattern";
import { blockContext, shapedContext } from "../../test-utils/shaped-context";
import { dartFreeBodiceModule, dartFreeSideWaist } from "./dart-free";
import { bodiceOf } from "./princess";

const fittedDartFree = {
  ...dartFreeLooseBlouse,
  bodice: { ...dartFreeLooseBlouse.bodice!, fit: "fitted" as const },
};

describe("dart-free bodice", () => {
  const block = bodiceOf(blockContext(dartFreeLooseBlouse, sizeM));
  const front = shapedContext(dartFreeLooseBlouse, sizeM).pieces.find((p) => p.id === "bodice-front")!;

  it("applies only to bodice.shaping none", () => {
    expect(dartFreeBodiceModule.appliesTo(dartFreeLooseBlouse)).toBe(true);
    expect(dartFreeBodiceModule.appliesTo(dartedBlouse)).toBe(false);
  });

  it("removes the bust dart and keeps no waist dart", () => {
    expect(block.front.darts.map((d) => d.id)).toEqual(["bust-dart"]);
    expect(front.darts).toEqual([]);
  });

  it("raises the side waist by about the bust dart opening", () => {
    const k = block.keyPoints;
    const openingMm = k["bodice.front.bustDartLower"].y - k["bodice.front.bustDartUpper"].y;
    const riseMm = k["bodice.front.sideWaist"].y - dartFreeSideWaist(block).y;
    expect(Math.abs(riseMm - openingMm)).toBeLessThan(5);
  });

  it("keeps the front waist edge as long as the block's", () => {
    const k = block.keyPoints;
    expect(edgeLengthMm(front, "waist")).toBeCloseTo(
      distance(k["bodice.front.waistCF"], k["bodice.front.sideWaist"]),
      6,
    );
  });

  it("sews the side seam to the back side seam exactly", () => {
    const back = block.back;
    expect(edgeLengthMm(front, "side")).toBeCloseTo(edgeLengthMm(back, "side"), 6);
  });

  it("passes the fit check for a loose design", () => {
    const check = generatePattern(dartFreeLooseBlouse, sizeM).validation.checks.find((c) =>
      c.code?.startsWith("BODICE_DART_FREE"),
    );
    expect(check).toMatchObject({ id: "FR-VAL-08", code: "BODICE_DART_FREE_OK", status: "pass" });
  });

  it("warns, in both languages, that a fitted design cannot fit closely without darts", () => {
    const result = generatePattern(fittedDartFree, sizeM);
    const check = result.validation.checks.find((c) => c.code === "BODICE_DART_FREE_FITTED");
    expect(check?.status).toBe("warn");
    expect(check?.message.ar).toMatch(/بنس/);
    expect(result.validation.status).toBe("warn");
  });
});
