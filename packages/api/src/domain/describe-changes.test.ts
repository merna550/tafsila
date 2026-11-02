import { describe, expect, it } from "vitest";
import { describeChanges } from "./describe-changes";

describe("describeChanges", () => {
  it("describes a feature change in both languages", () => {
    expect(describeChanges([{ path: "sleeve.length", from: "short", to: "long" }])).toEqual([
      { ar: "طول الكم: قصير ← طويل", en: "Sleeve length: short → long" },
    ]);
  });

  it("shows lengths in cm", () => {
    expect(describeChanges([{ path: "skirt.lengthMm", from: 600, to: 655 }])).toEqual([
      { ar: "طول التنورة: 60 سم ← 65.5 سم", en: "Skirt length: 60 cm → 65.5 cm" },
    ]);
  });

  it("describes pockets added and removed", () => {
    expect(describeChanges([{ path: "pockets", from: [], to: ["side-seam"] }])[0]?.en).toBe(
      "Pockets: none → side-seam",
    );
    expect(describeChanges([{ path: "pockets", from: ["patch", "side-seam"], to: [] }])[0]?.en).toBe(
      "Pockets: patch, side-seam → none",
    );
  });

  it("names a missing part as none, shows booleans as yes and no and keeps the input order", () => {
    const lines = describeChanges([
      { path: "lining", from: false, to: true },
      { path: "belt", from: undefined, to: "self-tie" },
    ]);
    expect(lines.map((l) => l.en)).toEqual(["Lining: no → yes", "Belt: none → self-tie"]);
  });

  it("skips a part that only changes from absent to none", () => {
    expect(describeChanges([{ path: "waistband", from: undefined, to: "none" }])).toEqual([]);
  });

  it("falls back to the raw text for an unknown path or value", () => {
    expect(describeChanges([{ path: "x.y", from: "a", to: "b" }])[0]).toEqual({
      ar: "x.y: a ← b",
      en: "x.y: a → b",
    });
  });
});
