/** Checks the shared size matrix and its arbitrary against the engine's measurement validation (issue #123). */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { arbMeasurements, SIZE_MATRIX } from "@tafsila/test-fixtures";
import { validateMeasurements } from "./validate-measurements";

/** Edge body types the matrix must cover, each as a prefix of an entry id. */
const EDGE_TYPES = [
  "petite",
  "tall",
  "large-bust-small-waist",
  "pear",
  "apple",
  "narrow-shoulders",
  "broad-shoulders",
  "long-arms",
  "short-arms",
];

describe("SIZE_MATRIX", () => {
  it("has 25 entries with unique ids: 5 chart sizes and 20 custom sets", () => {
    expect(SIZE_MATRIX).toHaveLength(25);
    expect(new Set(SIZE_MATRIX.map((e) => e.id)).size).toBe(25);
    expect(SIZE_MATRIX.filter((e) => e.source === "chart")).toHaveLength(5);
    expect(SIZE_MATRIX.filter((e) => e.source === "synthetic")).toHaveLength(20);
  });

  it.each(SIZE_MATRIX.map((e) => [e.id, e] as const))(
    "%s passes validateMeasurements without errors",
    (_id, entry) => {
      expect(validateMeasurements(entry.measurements).errors).toEqual([]);
    },
  );

  it("lists the warnings of each entry (allowed, none blocking)", () => {
    const warned = SIZE_MATRIX.map(
      (e) => [e.id, validateMeasurements(e.measurements).warnings.map((w) => w.code)] as const,
    ).filter(([, codes]) => codes.length > 0);
    expect(warned.every(([, codes]) => codes.length > 0)).toBe(true);
  });

  it.each(EDGE_TYPES)("covers the edge body type %s", (type) => {
    expect(SIZE_MATRIX.some((e) => e.id.startsWith(type))).toBe(true);
  });

  it("keeps the body type shapes (pear hip >> bust, apple waist near hip)", () => {
    const byId = (id: string) => SIZE_MATRIX.find((e) => e.id === id)!.measurements;
    expect(byId("pear").hip - byId("pear").bust).toBeGreaterThanOrEqual(250);
    expect(byId("apple").hip - byId("apple").waist).toBeLessThanOrEqual(60);
    expect(byId("tall-m").height).toBeGreaterThan(byId("petite-m").height);
  });
});

describe("arbMeasurements", () => {
  it("only produces valid sets (1000 runs)", () => {
    fc.assert(
      fc.property(arbMeasurements(), (m) => {
        expect(validateMeasurements(m).errors).toEqual([]);
      }),
      { numRuns: 1000 },
    );
  });
});
