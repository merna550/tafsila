/** Tests for the compare ticks of the version history (issue #345). */
import { describe, expect, it } from "vitest";
import { compareHref, toggleCompare } from "./compare-selection";

describe("toggleCompare", () => {
  it("adds and removes a tick", () => {
    expect(toggleCompare([], "a", true)).toEqual(["a"]);
    expect(toggleCompare(["a"], "a", false)).toEqual([]);
  });

  it("lets a third tick replace the oldest one", () => {
    expect(toggleCompare(["a", "b"], "c", true)).toEqual(["b", "c"]);
  });
});

describe("compareHref", () => {
  const versions = [
    { id: "v3", versionNo: 3 },
    { id: "v1", versionNo: 1 },
  ];

  it("is null until two are ticked", () => {
    expect(compareHref("d", ["v1"], versions)).toBeNull();
  });

  it("puts the older version first whatever the tick order", () => {
    expect(compareHref("d", ["v3", "v1"], versions)).toBe("/designs/d/versions/compare?a=v1&b=v3");
  });
});
