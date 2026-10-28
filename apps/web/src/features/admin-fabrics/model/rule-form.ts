/** Form model of the rule editor: scalar values with their validation (keys of `admin.fabricRules.errors`) and the mapping to the API bodies. */
import {
  FABRIC_LEVEL,
  RULE_PRIORITY,
  fabricPropertyNameSchema,
  type AdminFabricRule,
  fabricRuleSchema,
  type CreateFabricRuleInput,
  type FabricRule,
  type RuleCondition,
  type UpdateFabricRuleInput,
} from "@tafsila/schemas";
import { z } from "zod";
import {
  conditionFor,
  fromCondition,
  isConditionComplete,
  toCondition,
  type ConditionDraft,
} from "./condition-builder";

/** Slug of a rule id, the same rule as the shared schema. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A bound 0 to 4, or null when the rule has no bound on that side. */
const bound = z
  .number()
  .int()
  .min(FABRIC_LEVEL.none, "levelRange")
  .max(FABRIC_LEVEL.max, "levelRange")
  .nullable();

/** Schema of the scalar fields of the rule form; the conditions are checked beside it by `isConditionComplete`. */
export const ruleFormSchema = z
  .object({
    id: z.string().trim().regex(SLUG, "idInvalid"),
    property: fabricPropertyNameSchema,
    min: bound,
    max: bound,
    strength: z.enum(["prefer", "must"]),
    priority: z
      .number()
      .int()
      .min(RULE_PRIORITY.minor, "priorityRange")
      .max(RULE_PRIORITY.decisive, "priorityRange"),
    reasonAr: z.string().trim().min(1, "reasonArRequired"),
    reasonEn: z.string().trim().min(1, "reasonEnRequired"),
    reviewed: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.min === null && v.max === null)
      ctx.addIssue({ code: "custom", path: ["min"], message: "boundRequired" });
    if (v.min !== null && v.max !== null && v.min > v.max) {
      ctx.addIssue({ code: "custom", path: ["max"], message: "boundOrder" });
    }
  });

/** Keys of `admin.fabricRules.errors` that the schema uses as messages. */
export const RULE_ERROR_KEYS: readonly string[] = [
  "idInvalid",
  "levelRange",
  "priorityRange",
  "reasonArRequired",
  "reasonEnRequired",
  "boundRequired",
  "boundOrder",
];

/** Values of the rule form (without the conditions). */
export type RuleFormValues = z.infer<typeof ruleFormSchema>;

/** Starting values of the "new rule" form. */
export const EMPTY_RULE_FORM: RuleFormValues = {
  id: "",
  property: "drape",
  min: FABRIC_LEVEL.mid,
  max: null,
  strength: "prefer",
  priority: RULE_PRIORITY.medium,
  reasonAr: "",
  reasonEn: "",
  reviewed: false,
};

/** The first condition a new rule starts with. */
export const FIRST_CONDITION: ConditionDraft = conditionFor("skirt.type");

/** A rule as the dialog edits it: the scalar form values and the condition list. */
export interface RuleDraft {
  /** Scalar values. */
  readonly values: RuleFormValues;
  /** Conditions, at least one. */
  readonly conditions: readonly ConditionDraft[];
}

/**
 * Turns a stored rule into a draft.
 *
 * @param rule - The rule as the admin API returns it.
 * @returns The draft to edit.
 */
export function ruleToDraft(rule: AdminFabricRule): RuleDraft {
  const { effect } = rule;
  return {
    values: {
      id: rule.id,
      property: effect.property,
      min: effect.min ?? null,
      max: effect.max ?? null,
      strength: effect.strength,
      priority: rule.priority,
      reasonAr: rule.reason.ar,
      reasonEn: rule.reason.en,
      reviewed: !rule.isDraft,
    },
    conditions: rule.when.map(fromCondition),
  };
}

/**
 * Builds the fields shared by the create and update bodies.
 *
 * @param values - Validated scalar values.
 * @param conditions - Complete conditions.
 * @returns When, effect, priority, reason and the review flag.
 */
function ruleFields(
  values: RuleFormValues,
  conditions: readonly ConditionDraft[],
): Omit<CreateFabricRuleInput, "id"> {
  const when: RuleCondition[] = conditions.map(toCondition);
  return {
    when,
    effect: {
      property: values.property,
      strength: values.strength,
      ...(values.min === null ? {} : { min: values.min }),
      ...(values.max === null ? {} : { max: values.max }),
    },
    priority: values.priority,
    reason: { ar: values.reasonAr, en: values.reasonEn },
    isDraft: !values.reviewed,
  };
}

/**
 * Turns a draft into the body of POST /api/admin/fabric-rules.
 *
 * @param draft - A valid draft.
 * @returns The create body.
 */
export function toCreateRuleBody(draft: RuleDraft): CreateFabricRuleInput {
  return { id: draft.values.id, ...ruleFields(draft.values, draft.conditions) };
}

/**
 * Turns a draft into the body of PATCH /api/admin/fabric-rules/{id}.
 *
 * @param draft - A valid draft.
 * @returns The update body.
 */
export function toUpdateRuleBody(draft: RuleDraft): UpdateFabricRuleInput {
  return ruleFields(draft.values, draft.conditions);
}

/** Id the preview gives a new rule whose id is not typed yet; it is never sent to the API. */
export const PREVIEW_RULE_ID = "preview-draft";

/**
 * Builds the rule the preview runs, from a draft that may still be incomplete.
 *
 * @param draft - The draft as typed so far; an id that is not typed yet is replaced by {@link PREVIEW_RULE_ID}.
 * @returns The rule, or undefined while a field or a condition is not valid yet.
 */
export function draftToRule(draft: RuleDraft): FabricRule | undefined {
  const id = SLUG.test(draft.values.id.trim()) ? draft.values.id.trim() : PREVIEW_RULE_ID;
  const values = ruleFormSchema.safeParse({ ...draft.values, id });
  if (!values.success || !draft.conditions.every(isConditionComplete)) return undefined;
  const rule = fabricRuleSchema.safeParse(
    toCreateRuleBody({ values: values.data, conditions: draft.conditions }),
  );
  return rule.success ? rule.data : undefined;
}
