import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { escapeXml, fmt, pathData } from "./format";

describe("fmt", () => {
  it("always writes 2 decimals and rounds", () => {
    expect(fmt(1)).toBe("1.00");
    expect(fmt(0.005)).toBe("0.01");
    expect(fmt(-12.345)).toBe("-12.35");
  });

  it("never writes negative zero", () => {
    expect(fmt(-0)).toBe("0.00");
    expect(fmt(-0.001)).toBe("0.00");
  });

  it("rejects numbers that are not finite", () => {
    expect(() => fmt(Number.NaN)).toThrow(DraftingError);
    expect(() => fmt(Number.POSITIVE_INFINITY)).toThrow(DraftingError);
  });
});

describe("escapeXml", () => {
  it("escapes the five XML characters", () => {
    expect(escapeXml(`a & b < c > "d" 'e'`)).toBe("a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;");
  });
});

describe("pathData", () => {
  const p = (x: number, y: number) => ({ x, y });

  it("writes cubics as C commands with 6 numbers and closes with Z", () => {
    const d = pathData(
      [
        { kind: "cubic", from: p(0, 0), c1: p(10, 0), c2: p(20, 10), to: p(20, 20) },
        { kind: "line", from: p(20, 20), to: p(0, 0) },
      ],
      true,
    );
    expect(d).toBe("M 0.00 0.00 C 10.00 0.00 20.00 10.00 20.00 20.00 L 0.00 0.00 Z");
  });

  it("gives an empty string for no segments", () => {
    expect(pathData([], false)).toBe("");
  });
});
