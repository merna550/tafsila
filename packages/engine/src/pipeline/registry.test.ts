/** Tests for the module registry order. */
import { vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import type { FeatureModule } from "./feature-module";
import { createRegistry } from "./registry";

/**
 * A module that does nothing.
 *
 * @param id - Module id.
 * @param order - Run order.
 * @returns The module.
 */
function mod(id: string, order: number): FeatureModule {
  return { id, order, appliesTo: () => true, draft: (ctx) => ctx };
}

const b = mod("b", 2);
const a = mod("a", 1);
const c = mod("c", 1);
const permutations = [
  [b, a, c],
  [b, c, a],
  [a, b, c],
  [a, c, b],
  [c, a, b],
  [c, b, a],
];

describe("createRegistry", () => {
  it.each(permutations)("runs a, c, b whatever the registration order (%#)", (...list) => {
    const ids = createRegistry(list)
      .modulesFor(vNeckHalfCircleDress)
      .map((m) => m.id);
    expect(ids).toEqual(["a", "c", "b"]);
  });

  it("leaves out modules that do not apply", () => {
    const off: FeatureModule = { ...mod("off", 0), appliesTo: () => false };
    expect(createRegistry([off, a]).modulesFor(vNeckHalfCircleDress)).toEqual([a]);
  });
});
