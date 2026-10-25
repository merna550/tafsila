import { afterEach, describe, expect, it, vi } from "vitest";
import { readJson, remove, writeJson } from "./safe-storage";

/**
 * Puts a fake `window.localStorage` in place.
 *
 * @param storage - The methods of the fake.
 */
function stubStorage(storage: Pick<Storage, "getItem" | "setItem" | "removeItem">): void {
  vi.stubGlobal("window", { localStorage: storage });
}

afterEach(() => vi.unstubAllGlobals());

describe("safe-storage", () => {
  it("round-trips a value and removes it", () => {
    const data = new Map<string, string>();
    stubStorage({
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => {
        data.set(k, v);
      },
      removeItem: (k) => {
        data.delete(k);
      },
    });
    expect(writeJson("k", { a: 1 })).toBe(true);
    expect(readJson("k")).toEqual({ a: 1 });
    remove("k");
    expect(readJson("k")).toBeNull();
  });

  it("returns null for broken JSON", () => {
    stubStorage({ getItem: () => "{oops", setItem: vi.fn(), removeItem: vi.fn() });
    expect(readJson("k")).toBeNull();
  });

  it("never throws when storage throws or is missing", () => {
    const blocked = (): never => {
      throw new Error("blocked");
    };
    stubStorage({ getItem: blocked, setItem: blocked, removeItem: blocked });
    expect(readJson("k")).toBeNull();
    expect(writeJson("k", 1)).toBe(false);
    expect(() => remove("k")).not.toThrow();
    vi.unstubAllGlobals();
    vi.stubGlobal("window", undefined);
    expect(readJson("k")).toBeNull();
  });
});
