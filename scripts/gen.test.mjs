import { describe, expect, it } from "vitest";
import { turboArgs } from "./gen.mjs";

describe("turboArgs", () => {
  it("runs the generator and passes the answers", () => {
    expect(turboArgs(["endpoint", "garment-note", "40"])).toEqual([
      "gen",
      "endpoint",
      "--args",
      "garment-note",
      "40",
    ]);
  });

  it("lets the generator ask when no answers are given", () => {
    expect(turboArgs(["feature"])).toEqual(["gen", "feature"]);
  });

  it("rejects an unknown generator", () => {
    expect(() => turboArgs(["page"])).toThrow(/Usage: pnpm gen/);
  });
});
