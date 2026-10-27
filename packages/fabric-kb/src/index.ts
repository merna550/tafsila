/** Public entry of `@tafsila/fabric-kb`: fabric catalogue data and the pure recommendation function (FR-REC-01/02). */
export { recommend } from "./recommend";
export { conditionMatches, ruleMatches, readPath } from "./conditions";
export { RULE_PATHS, type RulePathSpec } from "./rule-paths";
export { assertValidRules, ruleProblems } from "./validate-rules";
export { NEUTRAL_REASON } from "./reasons";
export { DRAFT_CATALOGUE } from "./draft-catalogue";
export { DRAFT_RULES } from "./draft-rules";
export { DRAFT } from "./draft-status";
