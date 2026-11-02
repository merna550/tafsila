import { describe, expect, it } from "vitest";
import { designCategoryOf, hintOf, isAvailable } from "./category-choice";

describe("category choice", () => {
  it("sends a hint for a garment and none for auto", () => {
    expect(hintOf("skirt")).toBe("skirt");
    expect(hintOf("auto")).toBeUndefined();
  });
  it("stores the placeholder dress when the AI decides", () => {
    expect(designCategoryOf("auto")).toBe("dress");
    expect(designCategoryOf("blouse")).toBe("blouse");
  });
  it("marks pants as coming soon", () => {
    expect(isAvailable("pants")).toBe(false);
    expect(isAvailable("dress")).toBe(true);
  });
});
