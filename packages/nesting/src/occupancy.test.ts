import { describe, expect, it } from "vitest";
import { type Occupancy, freeOffsets, occupy } from "./occupancy";

describe("freeOffsets", () => {
  it("offers the whole range on an empty strip", () => {
    expect(freeOffsets([], 0, [[[0, 10]]], 90)).toEqual([[0, 90]]);
  });

  it("is empty when the shape is wider than the strip", () => {
    expect(freeOffsets([], 0, [[[0, 10]]], -1)).toEqual([]);
  });

  it("allows touching but not overlapping", () => {
    const occupancy: Occupancy = [];
    occupy(occupancy, 0, [[[0, 10]], [[0, 10]]], 30);
    // occupied [30, 40] in columns 0 and 1; a 10 mm shape fits below (0..20) and above (40..90)
    expect(freeOffsets(occupancy, 0, [[[0, 10]]], 90)).toEqual([
      [0, 20],
      [40, 90],
    ]);
    expect(freeOffsets(occupancy, 1, [[[0, 10]], [[0, 10]]], 90)).toEqual([
      [0, 20],
      [40, 90],
    ]);
    expect(freeOffsets(occupancy, 2, [[[0, 10]]], 90)).toEqual([[0, 90]]);
  });

  it("stops when nothing is left", () => {
    const occupancy: Occupancy = [[[0, 100]], [[0, 100]]];
    expect(freeOffsets(occupancy, 0, [[[0, 10]], [[0, 10]]], 90)).toEqual([]);
  });

  it("merges a new shape into the column's intervals", () => {
    const occupancy: Occupancy = [[[0, 10]]];
    occupy(occupancy, 0, [[[0, 5]]], 10);
    occupy(occupancy, 0, [[[0, 5]]], 50);
    expect(occupancy[0]).toEqual([
      [0, 15],
      [50, 55],
    ]);
  });
});
