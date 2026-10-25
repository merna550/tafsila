import { describe, expect, it } from "vitest";
import { FRONT_NECK_DEPTH_MIN_MM } from "../constants/neckline";
import { MIN_SKIRT_LENGTH_MM } from "../constants/skirt-length";
import { OVERRIDE_LIMITS_MM } from "./override-limits";

describe("OVERRIDE_LIMITS_MM", () => {
  it("takes the minimums from the engine clamps", () => {
    expect(OVERRIDE_LIMITS_MM["neckline.depthFrontMm"].minMm).toBe(FRONT_NECK_DEPTH_MIN_MM);
    expect(OVERRIDE_LIMITS_MM["skirt.lengthMm"].minMm).toBe(MIN_SKIRT_LENGTH_MM);
  });

  it("has a positive range for every override", () => {
    for (const { minMm, maxMm } of Object.values(OVERRIDE_LIMITS_MM)) {
      expect(minMm).toBeGreaterThan(0);
      expect(maxMm).toBeGreaterThan(minMm);
    }
  });
});
