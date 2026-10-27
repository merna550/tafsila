import type { FabricRule, RuleCondition } from "@tafsila/schemas";
import { RULE_PATHS, type RulePathSpec } from "./rule-paths";

/**
 * Lists the problems of the values of one condition on a known, non-flag path.
 *
 * @param ruleId - Id of the rule, for messages.
 * @param condition - The condition.
 * @param spec - What the path allows.
 * @returns Problem messages; empty when valid.
 */
function valueProblems(
  ruleId: string,
  condition: RuleCondition,
  spec: Extract<RulePathSpec, { values: unknown }>,
): string[] {
  const { path, values } = condition;
  if (!values?.length) return [`${ruleId}: "${path}" needs values`];
  return values
    .filter((value) => !spec.values.includes(value))
    .map((value) => `${ruleId}: "${value}" is not a value of "${path}"`);
}

/**
 * Lists the problems of one condition: unknown path, unknown value, or the wrong operator for the path.
 *
 * @param ruleId - Id of the rule, for messages.
 * @param condition - The condition.
 * @returns Problem messages; empty when valid.
 */
function conditionProblems(ruleId: string, condition: RuleCondition): string[] {
  const spec = RULE_PATHS[condition.path];
  if (!spec) return [`${ruleId}: unknown path "${condition.path}"`];
  if (spec.kind === "flag") {
    return condition.op === "is-true" ? [] : [`${ruleId}: "${condition.path}" is a flag, use is-true`];
  }
  if (condition.op === "is-true") return [`${ruleId}: "${condition.path}" is not a flag`];
  return valueProblems(ruleId, condition, spec);
}

/**
 * Lists every problem in a rule's conditions.
 *
 * @param rule - The rule to check.
 * @returns Problem messages; empty when the rule is valid.
 */
export function ruleProblems(rule: FabricRule): string[] {
  return rule.when.flatMap((condition) => conditionProblems(rule.id, condition));
}

/**
 * Throws one error listing every problem of every rule; use it before trusting rules from outside the package.
 *
 * @param rules - The rules to check.
 */
export function assertValidRules(rules: readonly FabricRule[]): void {
  const problems = rules.flatMap(ruleProblems);
  if (problems.length > 0) throw new Error(`Invalid fabric rules:\n${problems.join("\n")}`);
}
