/** The rule dialog: conditions picked from the DesignSpec paths, the effect, priority, reasons, the review flag and the preview box. */
import { Button, Dialog, FormField, Input } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { ConditionDraft } from "../model/condition-builder";
import { fieldMessage } from "../model/field-message";
import { RULE_ERROR_KEYS, type RuleFormValues } from "../model/rule-form";
import { BilingualFields } from "./BilingualFields";
import { ReviewedField } from "./ReviewedField";
import { RuleConditions } from "./RuleConditions";
import { RuleEffectFields } from "./RuleEffectFields";

/** Props of {@link RuleDialogView}. */
interface RuleDialogViewProps {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called when it asks to open or close. */
  readonly onOpenChange: (open: boolean) => void;
  /** True when editing an existing rule: its id is then fixed. */
  readonly editing: boolean;
  /** The scalar form. */
  readonly form: UseFormReturn<RuleFormValues>;
  /** The conditions. */
  readonly conditions: readonly ConditionDraft[];
  /** Replaces the conditions. */
  readonly onConditionsChange: (conditions: readonly ConditionDraft[]) => void;
  /** Submit handler. */
  readonly onSubmit: (event?: React.BaseSyntheticEvent) => void;
  /** True while saving. */
  readonly pending: boolean;
  /** The preview box, built by the caller. */
  readonly preview: ReactNode;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/** Props of {@link DialogActions}. */
interface DialogActionsProps {
  /** True while saving. */
  readonly pending: boolean;
  /** Closes the dialog without saving. */
  readonly onCancel: () => void;
}

/**
 * The cancel and save buttons at the foot of the dialog.
 *
 * @param props - The pending flag and the cancel handler.
 * @returns The buttons.
 */
function DialogActions({ pending, onCancel }: Readonly<DialogActionsProps>): ReactElement {
  const t = useTranslations("admin.fabricRules.form");
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="secondary" onClick={onCancel}>
        {t("cancel")}
      </Button>
      <Button type="submit" disabled={pending}>
        {t("save")}
      </Button>
    </div>
  );
}

/**
 * Renders the dialog.
 *
 * @param props - Open state, form, conditions, handlers and the preview.
 * @returns The dialog.
 */
export function RuleDialogView(props: Readonly<RuleDialogViewProps>): ReactElement {
  const {
    open,
    onOpenChange,
    editing,
    form,
    conditions,
    onConditionsChange,
    onSubmit,
    pending,
    preview,
    dir,
  } = props;
  const t = useTranslations("admin.fabricRules.form");
  const errors = useTranslations("admin.fabricRules.errors");
  const { register, control, formState } = form;
  /**
   * Finds the text to show under a field.
   *
   * @param name - The field.
   * @returns The translated error, or undefined.
   */
  const errorOf = (name: keyof RuleFormValues): string | undefined =>
    fieldMessage(formState.errors[name]?.message, RULE_ERROR_KEYS, (key) => errors(key as "idInvalid"));
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dir={dir}
      title={editing ? t("titleEdit") : t("titleNew")}
      closeLabel={t("close")}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField label={t("id")} hint={editing ? t("idFixed") : t("idHint")} error={errorOf("id")}>
          {(c) => <Input dir="ltr" readOnly={editing} {...c} {...register("id")} />}
        </FormField>
        <RuleConditions conditions={conditions} onChange={onConditionsChange} dir={dir} />
        <RuleEffectFields form={form} errorOf={errorOf} dir={dir} />
        <BilingualFields
          arLabel={t("reasonAr")}
          enLabel={t("reasonEn")}
          arRegister={register("reasonAr")}
          enRegister={register("reasonEn")}
          arError={errorOf("reasonAr")}
          enError={errorOf("reasonEn")}
        />
        <Controller
          control={control}
          name="reviewed"
          render={({ field }) => (
            <ReviewedField checked={field.value} onChange={field.onChange} label={t("reviewed")} />
          )}
        />
        {preview}
        <p className="text-sm text-muted">{t("auditNote")}</p>
        <DialogActions pending={pending} onCancel={() => onOpenChange(false)} />
      </form>
    </Dialog>
  );
}
