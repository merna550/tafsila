/** Tests for the picker's option lists, default designs and refusal list (issue #238). */
import type { DesignSpec } from "@tafsila/schemas";
import { SIZE_MATRIX } from "@tafsila/test-fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../pipeline/generate-pattern";
import { defaultSpec } from "./default-spec";
import { normalizeSpec } from "./normalize-spec";
import { specRefusals } from "./refusals";
import { FEATURE_PATHS } from "./feature-paths";
import { specOptions } from "./spec-options";

const CATEGORIES = ["dress", "skirt", "blouse"] as const;

/**
 * The default dress without a waist seam.
 *
 * @returns The design.
 */
function onePieceDress(): DesignSpec {
  const dress = defaultSpec("dress");
  return { ...dress, bodice: { ...dress.bodice!, waistSeam: false } };
}

describe("specOptions", () => {
  it("refuses a gathered skirt on a one-piece dress with bilingual text", () => {
    const gathered = specOptions(onePieceDress())["skirt.type"].values.find((v) => v.value === "gathered");
    expect(gathered?.allowed).toBe(false);
    expect(gathered?.reason?.code).toBe("DRESS_ONE_PIECE_SKIRT_UNSUPPORTED");
    expect(gathered?.reason?.ar).toMatch(/[؀-ۿ]/);
  });

  it("refuses a shirt collar on a V neck", () => {
    const options = specOptions(defaultSpec("dress"))["neckline.front"].values;
    const v = options.find((o) => o.value === "v")!;
    expect(v.allowed).toBe(true);
    const spec = defaultSpec("dress");
    const shirt = { ...spec, neckline: { ...spec.neckline!, front: "v" as const, collar: "shirt" as const } };
    expect(specRefusals(shirt)).toContain("COLLAR_NECKLINE_UNSUPPORTED");
  });

  it("marks skirt features as not applying to a blouse", () => {
    const options = specOptions(defaultSpec("blouse"));
    expect(options["skirt.type"].applies).toBe(false);
    expect(options["skirt.type"].values).toEqual([]);
    expect(options["bodice.fit"].applies).toBe(true);
  });

  it("lists every feature path, with allowed values for the current choice", () => {
    for (const category of CATEGORIES) {
      const options = specOptions(defaultSpec(category));
      expect(Object.keys(options)).toEqual([...FEATURE_PATHS]);
      expect(options.category.values.some((v) => v.allowed)).toBe(true);
    }
  });

  it("gives every refused value a code and non-empty Arabic and English text", () => {
    for (const category of CATEGORIES) {
      for (const feature of Object.values(specOptions(defaultSpec(category)))) {
        for (const value of feature.values.filter((v) => !v.allowed)) {
          expect(value.reason?.code).toBeDefined();
          expect(value.reason?.ar.length).toBeGreaterThan(0);
          expect(value.reason?.en.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("defaultSpec", () => {
  it.each(CATEGORIES)("is already valid for %s", (category) => {
    const spec = defaultSpec(category);
    expect(specRefusals(spec)).toEqual([]);
    expect(normalizeSpec(spec)).toEqual({ spec, changed: [] });
  });

  it.each(CATEGORIES)("drafts %s on sizes S, M and XXL", (category) => {
    for (const id of ["size-s", "size-m", "size-xxl"]) {
      const entry = SIZE_MATRIX.find((e) => e.id === id)!;
      const result = generatePattern(defaultSpec(category), entry.measurements, DEFAULT_ENGINE_OPTIONS);
      expect(result.validation.status, `${category} ${id}`).not.toBe("fail");
    }
  });
});

describe("refusals.ts", () => {
  it("imports the module predicates instead of copying them", () => {
    const source = readFileSync(new URL("./refusals.ts", import.meta.url), "utf8");
    for (const name of [
      "closureIssue",
      "collarCombinationIssue",
      "sleeveCombinationIssue",
      "pocketAllowed",
    ]) {
      expect(source).toContain(`import { ${name} }`);
    }
    expect(source).not.toContain("CLOSURE_MATRIX =");
  });
});
