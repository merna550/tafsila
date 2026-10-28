import { describe, expect, it } from "vitest";
import { formatCm, formatMetres, isOlderNestingVersion } from "./format";

describe("formatMetres", () => {
  it.each([
    [1.3, "1.3"],
    [12, "12.0"],
    [0.6, "0.6"],
  ])("writes %s as %s", (value, text) => expect(formatMetres(value)).toBe(text));
});

describe("formatCm", () => {
  it.each([
    [1400, "140"],
    [745, "74.5"],
    [700, "70"],
  ])("writes %s mm as %s", (mm, text) => expect(formatCm(mm)).toBe(text));
});

describe("isOlderNestingVersion", () => {
  it("is true only when the versions differ", () => {
    expect(isOlderNestingVersion("0.9.0", "1.0.0")).toBe(true);
    expect(isOlderNestingVersion("1.0.0", "1.0.0")).toBe(false);
  });
});
