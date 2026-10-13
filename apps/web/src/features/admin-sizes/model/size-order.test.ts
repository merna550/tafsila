import { describe, expect, it } from "vitest";
import { sortSizes } from "./size-order";

describe("sortSizes", () => {
  it("puts the database key order (L, M, S, XL, XXL) into garment order", () => {
    expect(sortSizes(["L", "M", "S", "XL", "XXL"])).toEqual(["S", "M", "L", "XL", "XXL"]);
  });

  it("keeps unknown labels after the known ones in their given order", () => {
    expect(sortSizes(["Z9", "M", "A1", "S"])).toEqual(["S", "M", "Z9", "A1"]);
  });

  it("does not change its input and ignores case of known labels", () => {
    const input = ["xl", "s"];
    expect(sortSizes(input)).toEqual(["s", "xl"]);
    expect(input).toEqual(["xl", "s"]);
  });
});
