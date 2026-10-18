import { designSpecSchema, measurementsSchema, patternResultSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import {
  aLineAnkleSideSlitSkirt,
  aLineMidiSkirt,
  fullCircleKneeSkirt,
  halfCircleKneeSkirt,
  setInSleeveBlouse,
  straightMidiBackSlitSkirt,
  straightMidiSkirt,
  vNeckHalfCircleDress,
} from "./designs";
import { sizeM } from "./measurements";
import { rectanglePattern } from "./pattern";

describe("fixtures stay valid against the shared schemas", () => {
  it("the demo dress is a valid DesignSpec", () => {
    expect(designSpecSchema.safeParse(vNeckHalfCircleDress).success).toBe(true);
  });

  it("the circle skirt and sleeve designs are valid DesignSpecs", () => {
    for (const spec of [halfCircleKneeSkirt, fullCircleKneeSkirt, setInSleeveBlouse]) {
      expect(designSpecSchema.safeParse(spec).success).toBe(true);
    }
  });

  it("the straight and A-line skirt designs are valid DesignSpecs", () => {
    for (const spec of [
      aLineMidiSkirt,
      straightMidiSkirt,
      straightMidiBackSlitSkirt,
      aLineAnkleSideSlitSkirt,
    ]) {
      expect(designSpecSchema.safeParse(spec).success).toBe(true);
    }
  });

  it("size M is a valid Measurements object", () => {
    expect(measurementsSchema.safeParse(sizeM).success).toBe(true);
  });

  it("the rectangle pattern is a valid PatternResult", () => {
    expect(patternResultSchema.safeParse(rectanglePattern).success).toBe(true);
  });

  it("the schema rejects categories outside release 1", () => {
    expect(designSpecSchema.safeParse({ ...vNeckHalfCircleDress, category: "jacket" }).success).toBe(false);
  });
});
