/** Tests for the module registry order. */
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { createContext } from "./draft-context";
import type { FeatureModule, ValidationRule } from "./feature-module";
import { DEFAULT_ENGINE_OPTIONS } from "./generate-pattern";
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

/**
 * Creates an always-applicable validation rule for order tests.
 *
 * @param id - Requirement id reported by the rule.
 * @param code - Stable code used for secondary ordering.
 * @returns A passing no-op validation rule.
 */
function rule(id: ValidationRule["id"], code: string): ValidationRule {
  return {
    id,
    code,
    appliesTo: () => true,
    run: () => ({ id, code, status: "pass", message: { ar: "نجح", en: "Passed" } }),
  };
}

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

  it("orders core rules before module rules, sorting each group by id then code", () => {
    const module = { ...a, validations: [rule("FR-VAL-08", "Z"), rule("FR-VAL-05", "A")] };
    const registry = createRegistry([module], [rule("FR-VAL-06", "B"), rule("FR-VAL-05", "C")]);
    const context = createContext(vNeckHalfCircleDress, sizeM, DEFAULT_ENGINE_OPTIONS);
    expect(registry.rulesFor(context).map(({ id, code }) => `${id}/${code}`)).toEqual([
      "FR-VAL-05/C",
      "FR-VAL-06/B",
      "FR-VAL-05/A",
      "FR-VAL-08/Z",
    ]);
  });
});
