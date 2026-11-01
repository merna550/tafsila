/** Tests for the AI analysis result and spec patch contracts (issue #337). */
import { describe, expect, it } from "vitest";
import { DESIGN_FEATURE_PATHS, DESIGN_LENGTH_PATHS, designAnalysisResultSchema } from "./design-analysis";
import { designSpecSchema, type DesignSpec } from "./design-spec";
import { specPatchSchema } from "./spec-patch";

/** A plain valid skirt. */
const skirt: DesignSpec = {
  schemaVersion: 1,
  category: "skirt",
  fabricType: "woven",
  skirt: { type: "a-line", length: "knee" },
  waistband: "straight",
  closure: { type: "zip", position: "side" },
  pockets: [],
  lining: false,
};

/** A valid analysis result for the skirt. */
const result = {
  spec: skirt,
  category: { value: "skirt", confidence: 0.9 },
  confidence: { "skirt.type": 0.8 },
  notes: [{ path: "skirt.type", text: { ar: "غير متأكد", en: "Not sure" } }],
  unsupported: [],
};

/**
 * Walks the schema shape along a dotted path, unwrapping optionals and arrays.
 *
 * @param path - A dotted path such as `"skirt.slit.lengthMm"`.
 * @returns True when every segment exists in `designSpecSchema`.
 */
function schemaHasPath(path: string): boolean {
  let node: unknown = designSpecSchema;
  for (const key of path.split(".")) {
    const unwrapped = (node as { unwrap?: () => unknown }).unwrap?.() ?? node;
    const shape = (unwrapped as { shape?: Record<string, unknown> }).shape;
    if (shape?.[key] === undefined) return false;
    node = shape[key];
  }
  return true;
}

describe("design feature paths", () => {
  it("names only fields of designSpecSchema", () => {
    for (const path of [...DESIGN_FEATURE_PATHS, ...DESIGN_LENGTH_PATHS])
      expect(schemaHasPath(path)).toBe(true);
  });

  it("covers every enum or boolean field of the spec", () => {
    const leaves = ["bodice", "neckline", "sleeve", "skirt", "closure"].flatMap((part) => {
      const shape =
        (designSpecSchema.shape[part as "closure"] as { unwrap?: () => unknown }).unwrap?.() ??
        designSpecSchema.shape[part as "closure"];
      return Object.keys((shape as { shape: object }).shape).map((field) => `${part}.${field}`);
    });
    const covered = new Set<string>([...DESIGN_FEATURE_PATHS, ...DESIGN_LENGTH_PATHS, "skirt.slit"]);
    expect(leaves.filter((path) => !covered.has(path))).toEqual([]);
  });
});

describe("designAnalysisResultSchema", () => {
  it("accepts a valid result", () => {
    expect(designAnalysisResultSchema.safeParse(result).success).toBe(true);
  });

  it("rejects a confidence above 1", () => {
    const bad = { ...result, confidence: { "skirt.type": 1.2 } };
    expect(designAnalysisResultSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an unknown feature path", () => {
    const bad = { ...result, confidence: { "skirt.colour": 0.5 } };
    expect(designAnalysisResultSchema.safeParse(bad).success).toBe(false);
  });
});

describe("specPatchSchema", () => {
  it("accepts every op", () => {
    const patch = {
      ops: [
        { op: "set", path: "sleeve.length", value: "long" },
        { op: "setLength", path: "skirt.lengthMm", mm: 600 },
        { op: "addPocket", type: "side-seam" },
        { op: "removePocket", type: "patch" },
      ],
      unsupported: {
        text: { ar: "لا", en: "No" },
        closest: [{ op: "set", path: "category", value: "dress" }],
      },
    };
    expect(specPatchSchema.safeParse(patch).success).toBe(true);
  });

  it("rejects an unknown op, path or pocket style", () => {
    expect(specPatchSchema.safeParse({ ops: [{ op: "delete", path: "belt" }] }).success).toBe(false);
    expect(specPatchSchema.safeParse({ ops: [{ op: "set", path: "colour", value: "red" }] }).success).toBe(
      false,
    );
    expect(specPatchSchema.safeParse({ ops: [{ op: "addPocket", type: "welt" }] }).success).toBe(false);
  });
});
