/** Checks on fabric data that comes from outside: a calculation from the browser and a rule from an admin (decision 317). */
import { createHash } from "node:crypto";
import { ruleProblems } from "@tafsila/fabric-kb";
import {
  fabricCalcResultSchema,
  type FabricCalcResult,
  type FabricOptions,
  type FabricRule,
} from "@tafsila/schemas";
import { FabricCalcInvalidError, FabricRuleInvalidError } from "./errors";

/**
 * Checks the result of a fabric calculation: shape, positive lengths in steps of 0.1 m, one entry per kind, bounded
 * placements.
 *
 * @param raw - The result as sent by the browser.
 * @returns The parsed result.
 * @throws {FabricCalcInvalidError} When anything is wrong; the fields name the paths.
 */
export function checkFabricCalcResult(raw: unknown): FabricCalcResult {
  const parsed = fabricCalcResultSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const fields: Record<string, string> = {};
  for (const issue of parsed.error.issues) fields[issue.path.join(".") || "result"] ??= issue.message;
  throw new FabricCalcInvalidError(fields);
}

/**
 * Checks that every condition of a rule names a known DesignSpec path and value with the right operator.
 *
 * @param rule - The complete rule (an update is merged with the stored rule first).
 * @throws {FabricRuleInvalidError} When a condition is wrong; the fields are `when.<index>`.
 */
export function checkFabricRule(rule: FabricRule): void {
  const fields: Record<string, string> = {};
  rule.when.forEach((condition, index) => {
    const problems = ruleProblems({ ...rule, when: [condition] });
    if (problems.length > 0) fields[`when.${index}`] = problems.join("; ");
  });
  if (Object.keys(fields).length > 0) throw new FabricRuleInvalidError(fields);
}

/**
 * Hashes the options in a fixed key order, so equal options always give the same hash (one stored row per version and options).
 *
 * @param options - Parsed fabric options (every default filled).
 * @returns A hex SHA-256.
 */
export function hashFabricOptions(options: FabricOptions): string {
  const canonical = JSON.stringify([
    options.widthMm,
    options.layout,
    options.directionalNap,
    options.shrinkagePercent,
    options.patternRepeatMm,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}
