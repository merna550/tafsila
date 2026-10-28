"use client";
/** Hook behind the rule dialog: scalar fields in React Hook Form, the condition list in state, create or update, API errors on the fields. */
import { zodResolver } from "@hookform/resolvers/zod";
import type { AdminFabricRule, FabricRule } from "@tafsila/schemas";
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useApiErrorHandler } from "@/shared/error-display";
import { isConditionComplete, type ConditionDraft } from "../model/condition-builder";
import {
  EMPTY_RULE_FORM,
  FIRST_CONDITION,
  draftToRule,
  ruleFormSchema,
  ruleToDraft,
  toCreateRuleBody,
  toUpdateRuleBody,
  type RuleFormValues,
} from "../model/rule-form";
import { useCreateRule, useUpdateRule } from "./use-catalogue-mutations";

/** What the dialog needs. */
export interface RuleForm {
  /** The React Hook Form instance for the scalar fields. */
  readonly form: UseFormReturn<RuleFormValues>;
  /** The conditions as edited. */
  readonly conditions: readonly ConditionDraft[];
  /** Replaces the condition list. */
  readonly setConditions: (conditions: readonly ConditionDraft[]) => void;
  /** Whether every condition is complete (the dialog shows a hint when not). */
  readonly conditionsComplete: boolean;
  /** The rule as edited, once it is valid; the preview runs on it. */
  readonly draftRule: FabricRule | undefined;
  /** Submit handler for the `<form onSubmit>`. */
  readonly onSubmit: (event?: React.BaseSyntheticEvent) => void;
  /** True while the request runs. */
  readonly pending: boolean;
}

/** Options of {@link useRuleForm}. */
export interface RuleFormOptions {
  /** The rule being edited; leave out to add a new one. */
  readonly rule?: AdminFabricRule;
  /** Runs after a successful save. */
  readonly onSaved: () => void;
}

/**
 * Wires the dialog's form to the create or update mutation.
 *
 * @param options - The rule (or none) and the success callback.
 * @returns The form, the conditions, the preview rule and the submit handler.
 */
export function useRuleForm({ rule, onSaved }: Readonly<RuleFormOptions>): RuleForm {
  const t = useTranslations("admin.fabricRules.form");
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  const create = useCreateRule();
  const update = useUpdateRule(rule?.id ?? "");
  const start = rule ? ruleToDraft(rule) : { values: EMPTY_RULE_FORM, conditions: [FIRST_CONDITION] };
  const [conditions, setConditions] = useState<readonly ConditionDraft[]>(start.conditions);
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: start.values,
    mode: "onSubmit",
  });
  const values = useWatch({ control: form.control }) as RuleFormValues;
  const conditionsComplete = conditions.length > 0 && conditions.every(isConditionComplete);
  /**
   * Saves, then toasts and reports; field errors of the API go under their fields.
   *
   * @param formValues - The validated scalar values.
   */
  const submit = async (formValues: RuleFormValues): Promise<void> => {
    if (!conditionsComplete) return;
    const draft = { values: formValues, conditions };
    try {
      if (rule) await update.mutateAsync(toUpdateRuleBody(draft));
      else await create.mutateAsync(toCreateRuleBody(draft));
    } catch (error) {
      const route = handleError(error, "action");
      if (route.fieldErrors.id) form.setError("id", { message: route.fieldErrors.id });
      return;
    }
    showToast({ title: rule ? t("updated") : t("created"), tone: "success" });
    onSaved();
  };
  const handleSubmit = form.handleSubmit(submit);
  return {
    form,
    conditions,
    setConditions,
    conditionsComplete,
    draftRule: draftToRule({ values, conditions }),
    onSubmit: (event) => void handleSubmit(event),
    pending: create.isPending || update.isPending,
  };
}
