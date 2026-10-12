import { describe, expect, it } from "vitest";
import { displayPhone } from "./format";

describe("displayPhone", () => {
  it("groups an E.164 mobile like the design", () => {
    expect(displayPhone("+201012345678")).toBe("010 1234 5678");
  });

  it("returns anything else unchanged", () => {
    expect(displayPhone("")).toBe("");
  });
});
