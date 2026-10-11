import { describe, expect, it } from "vitest";
import { MESSAGES } from "./testing";

/**
 * Lists every message key as a dotted path.
 *
 * @param node - A message object or leaf.
 * @param prefix - Path of the parent.
 * @returns The sorted key paths of the leaves.
 */
function keyPaths(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node)
    .flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key))
    .sort((a, b) => a.localeCompare(b));
}

describe("messages", () => {
  it("has exactly the same keys in ar.json and en.json", () => {
    expect(keyPaths(MESSAGES.en)).toEqual(keyPaths(MESSAGES.ar));
  });

  it("has no empty text", () => {
    for (const messages of Object.values(MESSAGES)) {
      for (const path of keyPaths(messages)) {
        const value = path
          .split(".")
          .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], messages);
        expect(typeof value === "string" && value.trim().length > 0, path).toBe(true);
      }
    }
  });
});
