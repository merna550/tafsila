/** Tests for `normalizeSpec` (issue #238). */
import { describe, expect, it } from "vitest";
import { defaultSpec } from "./default-spec";
import { normalizeSpec } from "./normalize-spec";
import { specRefusals } from "./refusals";

describe("normalizeSpec", () => {
  it("changes a gathered skirt on a one-piece dress to straight", () => {
    const dress = defaultSpec("dress");
    const spec = {
      ...dress,
      bodice: { ...dress.bodice!, waistSeam: false },
      skirt: { ...dress.skirt!, type: "gathered" as const },
    };
    const result = normalizeSpec(spec);
    expect(result.spec.skirt?.type).toBe("straight");
    expect(result.changed).toEqual(["skirt.type"]);
    expect(specRefusals(result.spec)).toEqual([]);
  });

  it("returns a valid design unchanged", () => {
    const spec = defaultSpec("dress");
    const result = normalizeSpec(spec);
    expect(result.changed).toEqual([]);
    expect(result.spec).toEqual(spec);
  });

  it("does not modify its input", () => {
    const dress = defaultSpec("dress");
    const spec = {
      ...dress,
      pockets: ["patch" as const],
      skirt: { ...dress.skirt!, type: "pleated" as const },
    };
    const before = structuredClone(spec);
    const result = normalizeSpec(spec);
    expect(spec).toEqual(before);
    expect(result.spec.pockets).toEqual([]);
    expect(result.changed).toEqual(["pockets"]);
  });

  it("drops parts the category ignores and adds the ones it needs", () => {
    const blouse = { ...defaultSpec("blouse"), skirt: defaultSpec("dress").skirt };
    expect(normalizeSpec(blouse).spec.skirt).toBeUndefined();
    expect(normalizeSpec(blouse).changed).toEqual(["skirt.type", "skirt.length", "skirt.slit"]);
    const noSkirt = { ...defaultSpec("dress"), skirt: undefined };
    const fixed = normalizeSpec(noSkirt);
    expect(fixed.spec.skirt).toBeDefined();
    expect(specRefusals(fixed.spec)).toEqual([]);
  });

  it("resolves a shirt collar on a side zip and buttons beside a slit", () => {
    const dress = defaultSpec("dress");
    const collar = {
      ...dress,
      neckline: { ...dress.neckline!, collar: "shirt" as const },
      closure: { type: "zip" as const, position: "side" as const },
    };
    expect(normalizeSpec(collar).changed).toEqual(["neckline.collar"]);
    const skirt = defaultSpec("skirt");
    const buttons = {
      ...skirt,
      skirt: { ...skirt.skirt!, slit: { position: "back" as const, lengthMm: 100 } },
      closure: { type: "buttons" as const, position: "center-back" as const },
    };
    const result = normalizeSpec(buttons);
    expect(result.changed).toEqual(["closure.position"]);
    expect(specRefusals(result.spec)).toEqual([]);
  });
});
