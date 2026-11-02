import { describe, expect, it } from "vitest";
import { parseDesignAnalyzePayload } from "./design-analyze";

const ids = {
  userId: "00000000-0000-4000-8000-00000000000a",
  designId: "00000000-0000-4000-8000-0000000000d1",
};

describe("design.analyze payload", () => {
  it("accepts ids with or without a supported hint", () => {
    expect(parseDesignAnalyzePayload(ids)).toEqual(ids);
    expect(parseDesignAnalyzePayload({ ...ids, hint: "skirt" }).hint).toBe("skirt");
  });

  it("rejects missing ids, bad ids and an unsupported hint", () => {
    expect(() => parseDesignAnalyzePayload({})).toThrow();
    expect(() => parseDesignAnalyzePayload({ ...ids, designId: "x" })).toThrow();
    expect(() => parseDesignAnalyzePayload({ ...ids, hint: "abaya" })).toThrow();
  });
});
