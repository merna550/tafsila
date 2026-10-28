import { describe, expect, it } from "vitest";
import {
  fabricCalcResultSchema,
  isWholeLengthStep,
  recommendFabricsResponseSchema,
  saveFabricCalcInputSchema,
} from "./fabric-calc";

const kind = { kind: "main", lengthM: 2.3, placements: [{ shapeId: "front#1", xMm: 0, yMm: 0, turn: 0 }] };

describe("isWholeLengthStep", () => {
  it.each([0.1, 1.5, 2.3, 10])("accepts %s", (m) => expect(isWholeLengthStep(m)).toBe(true));
  it.each([0.15, 2.25, 1.04])("rejects %s", (m) => expect(isWholeLengthStep(m)).toBe(false));
});

describe("fabricCalcResultSchema", () => {
  it("accepts one kind", () => {
    expect(fabricCalcResultSchema.safeParse({ kinds: [kind] }).success).toBe(true);
  });
  it("rejects a negative or zero length", () => {
    expect(fabricCalcResultSchema.safeParse({ kinds: [{ ...kind, lengthM: -1 }] }).success).toBe(false);
    expect(fabricCalcResultSchema.safeParse({ kinds: [{ ...kind, lengthM: 0 }] }).success).toBe(false);
  });
  it("rejects a length that is not a multiple of 0.1", () => {
    expect(fabricCalcResultSchema.safeParse({ kinds: [{ ...kind, lengthM: 2.35 }] }).success).toBe(false);
  });
  it("rejects a repeated kind and an empty list", () => {
    expect(fabricCalcResultSchema.safeParse({ kinds: [kind, kind] }).success).toBe(false);
    expect(fabricCalcResultSchema.safeParse({ kinds: [] }).success).toBe(false);
  });
  it("rejects a turn other than 0 or 180", () => {
    const bad = { ...kind, placements: [{ shapeId: "a", xMm: 0, yMm: 0, turn: 90 }] };
    expect(fabricCalcResultSchema.safeParse({ kinds: [bad] }).success).toBe(false);
  });
  it("caps the number of placements", () => {
    const placements = Array.from({ length: 201 }, (_, i) => ({ shapeId: `s${i}`, xMm: 0, yMm: 0, turn: 0 }));
    expect(fabricCalcResultSchema.safeParse({ kinds: [{ ...kind, placements }] }).success).toBe(false);
  });
});

describe("saveFabricCalcInputSchema", () => {
  it("fills the option defaults and keeps the result loose", () => {
    const parsed = saveFabricCalcInputSchema.parse({
      options: {},
      result: { anything: 1 },
      nestingVersion: "1.0.0",
    });
    expect(parsed.options.widthMm).toBe(1400);
  });
});

describe("recommendFabricsResponseSchema", () => {
  it("accepts an empty avoid list", () => {
    expect(
      recommendFabricsResponseSchema.safeParse({ recommended: [], avoid: [], isDraft: true }).success,
    ).toBe(true);
  });
});
