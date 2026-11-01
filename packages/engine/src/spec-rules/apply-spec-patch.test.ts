/** Tests for applying a chat edit's patch to a design (issue #337). */
import type { SpecPatch } from "@tafsila/schemas";
import { aLineMidiSkirt, setInSleeveBlouse, straightMidiBackSlitSkirt } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { applySpecPatch } from "./apply-spec-patch";

/**
 * Applies a patch made of ops only.
 *
 * @param spec - The design.
 * @param ops - The ops.
 * @returns The result.
 */
const apply = (spec: typeof setInSleeveBlouse, ops: SpecPatch["ops"]) => applySpecPatch(spec, { ops });

describe("applySpecPatch", () => {
  it("sets a sleeve length and lists one change", () => {
    const result = apply(setInSleeveBlouse, [{ op: "set", path: "sleeve.length", value: "elbow" }]);
    expect(result).toMatchObject({
      ok: true,
      changes: [{ path: "sleeve.length", from: "long", to: "elbow" }],
    });
  });

  it("does not change the input design", () => {
    const before = structuredClone(setInSleeveBlouse);
    apply(setInSleeveBlouse, [{ op: "set", path: "sleeve.length", value: "long" }]);
    expect(setInSleeveBlouse).toEqual(before);
  });

  it("rejects a skirt feature on a blouse", () => {
    const result = apply(setInSleeveBlouse, [{ op: "set", path: "skirt.type", value: "a-line" }]);
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: "FEATURE_NOT_APPLICABLE", path: "skirt.type" }],
    });
  });

  it("rejects a value outside the feature's enum", () => {
    const result = apply(setInSleeveBlouse, [{ op: "set", path: "sleeve.length", value: "very-long" }]);
    expect(result).toMatchObject({ ok: false, issues: [{ code: "VALUE_NOT_ALLOWED" }] });
  });

  it("rejects an unknown path", () => {
    const patch = { ops: [{ op: "set", path: "colour", value: "red" }] } as unknown as SpecPatch;
    expect(applySpecPatch(setInSleeveBlouse, patch)).toMatchObject({
      ok: false,
      issues: [{ code: "PATCH_INVALID" }],
    });
  });

  it("rejects a skirt length outside the limits", () => {
    const result = apply(aLineMidiSkirt, [{ op: "setLength", path: "skirt.lengthMm", mm: 5000 }]);
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: "LENGTH_OUT_OF_RANGE", path: "skirt.lengthMm" }],
    });
  });

  it("sets a skirt length inside the limits", () => {
    const result = apply(aLineMidiSkirt, [{ op: "setLength", path: "skirt.lengthMm", mm: 600 }]);
    expect(result).toMatchObject({ ok: true, changes: [{ path: "skirt.lengthMm", to: 600 }] });
  });

  it("sets a slit length only when the skirt has a slit", () => {
    const op = { op: "setLength", path: "skirt.slit.lengthMm", mm: 150 } as const;
    expect(apply(aLineMidiSkirt, [op])).toMatchObject({ ok: false, issues: [{ code: "SLIT_MISSING" }] });
    expect(apply(straightMidiBackSlitSkirt, [op])).toMatchObject({ ok: true });
  });

  it("rejects a neckline depth on a skirt", () => {
    const result = apply(aLineMidiSkirt, [{ op: "setLength", path: "neckline.depthFrontMm", mm: 100 }]);
    expect(result).toMatchObject({ ok: false, issues: [{ code: "FEATURE_NOT_APPLICABLE" }] });
  });

  it("adds a pocket style once", () => {
    const pocket = { op: "addPocket", type: "patch" } as const;
    const result = apply(aLineMidiSkirt, [pocket, pocket]);
    expect(result.ok && result.spec.pockets).toEqual(["patch"]);
  });

  it("removes a pocket style", () => {
    const result = apply({ ...aLineMidiSkirt, pockets: ["side-seam"] }, [
      { op: "removePocket", type: "side-seam" },
    ]);
    expect(result.ok && result.spec.pockets).toEqual([]);
  });

  it("rejects a combination the engine refuses", () => {
    const result = apply(setInSleeveBlouse, [{ op: "addPocket", type: "side-seam" }]);
    expect(result.ok).toBe(false);
  });

  it("changes the category and fills its required parts", () => {
    const result = apply(aLineMidiSkirt, [{ op: "set", path: "category", value: "dress" }]);
    expect(result.ok && result.spec.bodice).toBeDefined();
  });

  it("lists changes in feature order whatever the op order", () => {
    const result = apply(setInSleeveBlouse, [
      { op: "set", path: "sleeve.length", value: "elbow" },
      { op: "set", path: "neckline.front", value: "v" },
    ]);
    expect(result.ok && result.changes.map((change) => change.path)).toEqual([
      "neckline.front",
      "sleeve.length",
    ]);
  });
});
