import { describe, expect, it } from "vitest";
import { mmToCmText, parseOverride } from "./length-units";

const LIMIT = { minMm: 40, maxMm: 140 };

describe("length units", () => {
  it("shows millimetres as centimetres with at most one decimal", () => {
    expect(mmToCmText(600)).toBe("60");
    expect(mmToCmText(605)).toBe("60.5");
  });

  it("turns typed centimetres into whole millimetres", () => {
    expect(parseOverride("10", LIMIT)).toEqual({ kind: "set", mm: 100 });
    expect(parseOverride("10,5", LIMIT)).toEqual({ kind: "set", mm: 105 });
    expect(parseOverride("١٢٫٥", LIMIT)).toEqual({ kind: "set", mm: 125 });
  });

  it("treats an empty box as clearing the override", () => {
    expect(parseOverride("  ", LIMIT)).toEqual({ kind: "clear" });
  });

  it("rejects text and values outside the limits, including the edges just beyond", () => {
    expect(parseOverride("abc", LIMIT)).toEqual({ kind: "invalid" });
    expect(parseOverride("3.9", LIMIT)).toEqual({ kind: "range" });
    expect(parseOverride("14.1", LIMIT)).toEqual({ kind: "range" });
    expect(parseOverride("4", LIMIT)).toEqual({ kind: "set", mm: 40 });
    expect(parseOverride("14", LIMIT)).toEqual({ kind: "set", mm: 140 });
  });
});
