import { defaultSpec, PICKER_SLIT_LENGTH_MM } from "@tafsila/engine/spec-rules";
import { describe, expect, it } from "vitest";
import { overrideApplies, readOverride, withOverride } from "./override-spec";

describe("overrides", () => {
  it("sets and removes the neck depth and the skirt length", () => {
    const dress = defaultSpec("dress");
    const set = withOverride(dress, "neckline.depthFrontMm", 90);
    expect(readOverride(set, "neckline.depthFrontMm")).toBe(90);
    expect(
      readOverride(withOverride(set, "neckline.depthFrontMm", undefined), "neckline.depthFrontMm"),
    ).toBeUndefined();
    const long = withOverride(dress, "skirt.lengthMm", 600);
    expect(readOverride(long, "skirt.lengthMm")).toBe(600);
    expect(readOverride(withOverride(long, "skirt.lengthMm", undefined), "skirt.lengthMm")).toBeUndefined();
  });

  it("needs a slit before its length can be set, and keeps a length when emptied", () => {
    const skirt = defaultSpec("skirt");
    expect(overrideApplies(skirt, "skirt.slit.lengthMm")).toBe(false);
    expect(withOverride(skirt, "skirt.slit.lengthMm", 200)).toBe(skirt);
    const slit = { ...skirt, skirt: { ...skirt.skirt!, slit: { position: "back" as const, lengthMm: 300 } } };
    expect(readOverride(withOverride(slit, "skirt.slit.lengthMm", 200), "skirt.slit.lengthMm")).toBe(200);
    expect(readOverride(withOverride(slit, "skirt.slit.lengthMm", undefined), "skirt.slit.lengthMm")).toBe(
      PICKER_SLIT_LENGTH_MM,
    );
  });

  it("leaves a blouse without a skirt unchanged", () => {
    const blouse = defaultSpec("blouse");
    expect(overrideApplies(blouse, "skirt.lengthMm")).toBe(false);
    expect(withOverride(blouse, "skirt.lengthMm", 600)).toBe(blouse);
  });
});
