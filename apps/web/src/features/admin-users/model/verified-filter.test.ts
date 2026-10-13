import { describe, expect, it } from "vitest";
import { verifiedParam } from "./verified-filter";

describe("verifiedParam", () => {
  it("maps the three filters to the API value", () => {
    expect(verifiedParam("all")).toBeUndefined();
    expect(verifiedParam("verified")).toBe("true");
    expect(verifiedParam("unverified")).toBe("false");
  });
});
