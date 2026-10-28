import { RULE_PATHS } from "@tafsila/fabric-kb";
import { describe, expect, it } from "vitest";
import ar from "@messages/ar.json";
import en from "@messages/en.json";
import {
  PATH_OPTIONS,
  changePath,
  conditionFor,
  fromCondition,
  isConditionComplete,
  opsFor,
  pathLabelKey,
  toCondition,
  toggleValue,
  valueLabelKey,
  valuesFor,
} from "./condition-builder";

/**
 * Reads a nested message by a dotted key.
 *
 * @param messages - A message file.
 * @param key - Dotted key.
 * @returns The value found, or undefined.
 */
function read(messages: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);
}

describe("condition builder", () => {
  it("offers exactly the paths of RULE_PATHS", () => {
    expect(PATH_OPTIONS).toEqual(Object.keys(RULE_PATHS));
  });

  it("offers only the allowed values of each path and only the operators it supports", () => {
    expect(valuesFor("skirt.type")).toContain("circle-half");
    expect(valuesFor("skirt.type")).not.toContain("peter-pan");
    expect(valuesFor("lining")).toEqual([]);
    expect(opsFor("lining")).toEqual(["is-true"]);
    expect(opsFor("pockets")).toEqual(["in", "not-in"]);
    expect(opsFor("unknown.path")).toEqual([]);
  });

  it("resets the operator and the values when the path changes", () => {
    const draft = toggleValue(conditionFor("skirt.type"), "circle-half");
    expect(draft.values).toEqual(["circle-half"]);
    const changed = changePath({ ...draft, op: "not-in" }, "lining");
    expect(changed).toEqual({ path: "lining", op: "is-true", values: [] });
    expect(changePath(draft, "skirt.type")).toBe(draft);
  });

  it("toggles a value on and off and ignores a value the path does not allow", () => {
    const on = toggleValue(conditionFor("skirt.type"), "pleated");
    expect(toggleValue(on, "pleated").values).toEqual([]);
    expect(toggleValue(on, "peter-pan")).toBe(on);
  });

  it("is complete only with an allowed operator and, unless a flag, at least one value", () => {
    expect(isConditionComplete(conditionFor("skirt.type"))).toBe(false);
    expect(isConditionComplete(toggleValue(conditionFor("skirt.type"), "pleated"))).toBe(true);
    expect(isConditionComplete(conditionFor("lining"))).toBe(true);
    expect(isConditionComplete({ path: "lining", op: "in", values: ["x"] })).toBe(false);
  });

  it("maps to the API condition and back", () => {
    const draft = toggleValue(conditionFor("pockets"), "patch");
    expect(toCondition(draft)).toEqual({ path: "pockets", op: "in", values: ["patch"] });
    expect(toCondition(conditionFor("lining"))).toEqual({ path: "lining", op: "is-true" });
    expect(fromCondition({ path: "lining", op: "is-true" })).toEqual({
      path: "lining",
      op: "is-true",
      values: [],
    });
  });

  it("has an Arabic and an English label for every path and value", () => {
    for (const messages of [ar, en]) {
      for (const path of PATH_OPTIONS) {
        expect(read(messages.designPicker, `paths.${pathLabelKey(path)}`), path).toBeTypeOf("string");
        for (const value of valuesFor(path)) {
          expect(read(messages.designPicker, valueLabelKey(path, value)), `${path}=${value}`).toBeTypeOf(
            "string",
          );
        }
      }
    }
  });
});
