import { describe, expect, it } from "vitest";
import { internationalPhone } from "./phone-view";

describe("internationalPhone", () => {
  it("groups a number as +20 10 1234 5678", () => {
    expect(internationalPhone("+201012345678")).toBe("+20 10 1234 5678");
  });

  it("leaves unknown text as it is", () => {
    expect(internationalPhone("abc")).toBe("abc");
  });
});
