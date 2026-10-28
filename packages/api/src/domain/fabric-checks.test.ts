import { DEFAULT_FABRIC_OPTIONS } from "@tafsila/schemas";
import { DRAFT_RULES } from "@tafsila/fabric-kb";
import { describe, expect, it } from "vitest";
import { FabricCalcInvalidError, FabricRuleInvalidError } from "./errors";
import { checkFabricCalcResult, checkFabricRule, hashFabricOptions } from "./fabric-checks";

const kind = { kind: "main", lengthM: 1.8, placements: [] };

describe("checkFabricCalcResult", () => {
  it("returns the parsed result", () => {
    expect(checkFabricCalcResult({ kinds: [kind] })).toEqual({ kinds: [kind] });
  });
  it("names the path of a wrong length", () => {
    try {
      checkFabricCalcResult({ kinds: [{ ...kind, lengthM: 1.85 }] });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(FabricCalcInvalidError);
      expect(Object.keys((error as FabricCalcInvalidError).details?.fields ?? {})).toEqual([
        "kinds.0.lengthM",
      ]);
    }
  });
});

describe("checkFabricRule", () => {
  it("accepts every draft rule", () => {
    for (const rule of DRAFT_RULES) expect(() => checkFabricRule(rule)).not.toThrow();
  });
  it("rejects a flag used with `in`", () => {
    const rule = { ...DRAFT_RULES[0]!, when: [{ path: "lining", op: "in" as const, values: ["x"] }] };
    expect(() => checkFabricRule(rule)).toThrow(FabricRuleInvalidError);
  });
});

describe("hashFabricOptions", () => {
  it("is stable for equal options and differs when one option changes", () => {
    expect(hashFabricOptions(DEFAULT_FABRIC_OPTIONS)).toBe(hashFabricOptions({ ...DEFAULT_FABRIC_OPTIONS }));
    expect(hashFabricOptions(DEFAULT_FABRIC_OPTIONS)).not.toBe(
      hashFabricOptions({ ...DEFAULT_FABRIC_OPTIONS, widthMm: 1500 }),
    );
    expect(hashFabricOptions(DEFAULT_FABRIC_OPTIONS)).toMatch(/^[0-9a-f]{64}$/);
  });
});
