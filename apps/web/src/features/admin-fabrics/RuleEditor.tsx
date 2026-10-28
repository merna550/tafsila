"use client";
/** Mounts the rule dialog for one rule (or a new one): runs the form hook, builds the preview from the saved rows and the unsaved edit. */
import type { AdminFabric, AdminFabricRule } from "@tafsila/schemas";
import { useLocale } from "next-intl";
import { useState, type ReactElement } from "react";
import { fabricName } from "@/features/fabric";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { PreviewBox } from "./components/PreviewBox";
import { RuleDialogView } from "./components/RuleDialogView";
import { useRuleForm } from "./hooks/use-rule-form";
import { previewRule } from "./model/preview";
import { DEFAULT_PREVIEW_DESIGN, PREVIEW_DESIGNS } from "./model/preview-designs";

/** Props of {@link RuleEditor}. */
interface RuleEditorProps {
  /** The rule being edited; leave out to add one. */
  readonly rule?: AdminFabricRule;
  /** The saved fabrics, for the preview. */
  readonly fabrics: readonly AdminFabric[];
  /** The saved rules, for the preview. */
  readonly rules: readonly AdminFabricRule[];
  /** Called when the dialog closes (saved or cancelled). */
  readonly onClose: () => void;
}

/**
 * Renders the open dialog; the caller mounts it only while editing so the state starts fresh each time.
 *
 * @param props - The rule, the saved rows and the close handler.
 * @returns The dialog.
 */
export function RuleEditor({ rule, fabrics, rules, onClose }: Readonly<RuleEditorProps>): ReactElement {
  const locale = useLocale() as AppLocale;
  const { form, conditions, setConditions, draftRule, onSubmit, pending } = useRuleForm({
    rule,
    onSaved: onClose,
  });
  const [designKey, setDesignKey] = useState(DEFAULT_PREVIEW_DESIGN.key);
  const spec = (PREVIEW_DESIGNS.find((d) => d.key === designKey) ?? DEFAULT_PREVIEW_DESIGN).spec;
  const preview = draftRule ? previewRule(spec, fabrics, rules, draftRule) : undefined;
  /**
   * Shows a fabric id as its name in the interface language.
   *
   * @param id - The fabric id.
   * @returns The name, or the id when the fabric is unknown.
   */
  const nameOf = (id: string): string => {
    const fabric = fabrics.find((f) => f.id === id);
    return fabric ? fabricName(fabric, locale) : id;
  };
  return (
    <RuleDialogView
      open
      onOpenChange={(open) => !open && onClose()}
      editing={rule !== undefined}
      form={form}
      conditions={conditions}
      onConditionsChange={setConditions}
      onSubmit={onSubmit}
      pending={pending}
      dir={DIRECTION[locale]}
      preview={
        <PreviewBox
          designKey={designKey}
          onDesignChange={setDesignKey}
          preview={preview}
          nameOf={nameOf}
          dir={DIRECTION[locale]}
        />
      }
    />
  );
}
