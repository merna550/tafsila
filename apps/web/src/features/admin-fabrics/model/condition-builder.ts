/** Builds rule conditions only from the DesignSpec paths and values the engine knows (`RULE_PATHS`), never free text (FR-REC-03). */
import { RULE_PATHS } from "@tafsila/fabric-kb";
import type { RuleCondition } from "@tafsila/schemas";

/** One condition as the form edits it: a path, an operator and the picked values. */
export interface ConditionDraft {
  /** A key of `RULE_PATHS`. */
  readonly path: string;
  /** The operator. */
  readonly op: RuleCondition["op"];
  /** Picked values; empty for `is-true`. */
  readonly values: readonly string[];
}

/** Every path an admin may pick, in the order of `RULE_PATHS`. */
export const PATH_OPTIONS: readonly string[] = Object.keys(RULE_PATHS);

/**
 * The operators a path allows: a flag only `is-true`, the others `in` and `not-in`.
 *
 * @param path - A key of `RULE_PATHS`.
 * @returns The allowed operators (empty for an unknown path).
 */
export function opsFor(path: string): readonly RuleCondition["op"][] {
  const spec = RULE_PATHS[path];
  if (!spec) return [];
  return spec.kind === "flag" ? ["is-true"] : ["in", "not-in"];
}

/**
 * The values a path allows.
 *
 * @param path - A key of `RULE_PATHS`.
 * @returns The allowed values (empty for a flag or an unknown path).
 */
export function valuesFor(path: string): readonly string[] {
  const spec = RULE_PATHS[path];
  return spec && spec.kind !== "flag" ? spec.values : [];
}

/**
 * Starts a condition on a path with its first operator and no values.
 *
 * @param path - A key of `RULE_PATHS`.
 * @returns The draft.
 */
export function conditionFor(path: string): ConditionDraft {
  return { path, op: opsFor(path)[0] ?? "in", values: [] };
}

/**
 * Switches the path: the operator and the values are reset because they belonged to the old path.
 *
 * @param draft - The condition.
 * @param path - The new path.
 * @returns The new draft.
 */
export function changePath(draft: ConditionDraft, path: string): ConditionDraft {
  return path === draft.path ? draft : conditionFor(path);
}

/**
 * Adds a value to the picked list, or removes it when it is already there; an unknown value is ignored.
 *
 * @param draft - The condition.
 * @param value - The value to toggle.
 * @returns The new draft.
 */
export function toggleValue(draft: ConditionDraft, value: string): ConditionDraft {
  if (!valuesFor(draft.path).includes(value)) return draft;
  const values = draft.values.includes(value)
    ? draft.values.filter((v) => v !== value)
    : [...draft.values, value];
  return { ...draft, values };
}

/**
 * Tells whether a draft can be saved: a known path, an operator it allows and, unless it is a flag, at least one value.
 *
 * @param draft - The condition.
 * @returns True when complete.
 */
export function isConditionComplete(draft: ConditionDraft): boolean {
  if (!opsFor(draft.path).includes(draft.op)) return false;
  return draft.op === "is-true" || draft.values.length > 0;
}

/**
 * Turns a draft into the condition the API takes.
 *
 * @param draft - A complete condition.
 * @returns The API condition (`values` only when the operator needs them).
 */
export function toCondition(draft: ConditionDraft): RuleCondition {
  return draft.op === "is-true"
    ? { path: draft.path, op: "is-true" }
    : { path: draft.path, op: draft.op, values: [...draft.values] };
}

/**
 * Turns a stored condition into a draft.
 *
 * @param condition - The stored condition.
 * @returns The draft.
 */
export function fromCondition(condition: RuleCondition): ConditionDraft {
  return { path: condition.path, op: condition.op, values: condition.values ?? [] };
}

/**
 * Message key of a path's label, shared with the design picker (`designPicker.paths.<key>`).
 *
 * @param path - A key of `RULE_PATHS`.
 * @returns The key, with the dot replaced because messages nest on dots.
 */
export function pathLabelKey(path: string): string {
  return path.replace(".", "_");
}

/**
 * Message key (under `designPicker`) of a value's label.
 *
 * @param path - A key of `RULE_PATHS`.
 * @param value - One of its values.
 * @returns `category.<value>` for the garment type, otherwise `options.<path>.<value>`.
 */
export function valueLabelKey(path: string, value: string): string {
  return path === "category" ? `category.${value}` : `options.${pathLabelKey(path)}.${value}`;
}
