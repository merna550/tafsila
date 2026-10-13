import { describe, expect, it } from "vitest";
import { parseCm } from "./units";

describe("parseCm", () => {
  it.each([
    ["92", 920],
    ["92.5", 925],
    ["92,5", 925],
    ["٩٢", 920],
    ["٩٢٫٥", 925],
    [" 92. ", 920],
    ["0.5", 5],
  ])("reads %s as %i mm", (text, mm) => {
    expect(parseCm(text)).toEqual({ kind: "value", mm });
  });

  it("treats blank text as empty", () => {
    expect(parseCm("  ")).toEqual({ kind: "empty" });
  });

  it("rejects a second decimal and non-numbers", () => {
    expect(parseCm("92.55")).toEqual({ kind: "error", error: "tooManyDecimals" });
    expect(parseCm("abc")).toEqual({ kind: "error", error: "notANumber" });
    expect(parseCm("-5")).toEqual({ kind: "error", error: "notANumber" });
    expect(parseCm("1e3")).toEqual({ kind: "error", error: "notANumber" });
  });
});
