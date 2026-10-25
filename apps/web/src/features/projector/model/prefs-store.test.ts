import { afterEach, describe, expect, it, vi } from "vitest";
import { PREFS_KEY, readPrefs, writePrefs } from "./prefs-store";

/**
 * Puts a map-backed `window.localStorage` in place.
 *
 * @returns The map behind it.
 */
function stubMemoryStorage(): Map<string, string> {
  const data = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    },
  });
  return data;
}

afterEach(() => vi.unstubAllGlobals());

describe("projector prefs store", () => {
  it("round-trips the line width and colour", () => {
    stubMemoryStorage();
    expect(writePrefs(4, "yellow")).toBe(true);
    expect(readPrefs()).toEqual({ version: 1, lineWidthPx: 4, color: "yellow" });
  });

  it("reads null for nothing, a wrong shape or a width outside 1..6", () => {
    const data = stubMemoryStorage();
    expect(readPrefs()).toBeNull();
    data.set(PREFS_KEY, JSON.stringify({ version: 1, lineWidthPx: 9, color: "white" }));
    expect(readPrefs()).toBeNull();
    data.set(PREFS_KEY, "not json");
    expect(readPrefs()).toBeNull();
  });
});
