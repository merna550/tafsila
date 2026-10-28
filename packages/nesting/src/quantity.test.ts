import { describe, expect, it } from "vitest";
import { shapeCopies } from "./quantity";

const plain = { quantity: 3, onFold: false, mirror: false, fabric: "main" as const };
const pair = { quantity: 2, onFold: false, mirror: true, fabric: "main" as const };
const fold = { quantity: 1, onFold: true, mirror: false, fabric: "main" as const };

describe("shapeCopies", () => {
  it("gives one shape per quantity for a plain piece in both layouts", () => {
    expect(shapeCopies(plain, "folded")).toHaveLength(3);
    expect(shapeCopies(plain, "open")).toHaveLength(3);
  });
  it("cuts a mirrored pair once through both layers when folded", () => {
    expect(shapeCopies(pair, "folded")).toEqual([{ mirrored: false }]);
  });
  it("gives a piece and its mirror image for a pair when open", () => {
    expect(shapeCopies(pair, "open")).toEqual([{ mirrored: false }, { mirrored: true }]);
  });
  it("rounds an odd mirrored count up when folded", () => {
    expect(shapeCopies({ ...pair, quantity: 3 }, "folded")).toHaveLength(2);
  });
  it("gives one shape per quantity for a fold piece in both layouts", () => {
    expect(shapeCopies(fold, "folded")).toEqual([{ mirrored: false }]);
    expect(shapeCopies(fold, "open")).toEqual([{ mirrored: false }]);
  });
});
