/** Dialog to create or edit a client: a required name and optional notes; used for both so the list context stays visible. */
import { Button, Dialog, FormField, Input, Textarea } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { UseFormReturn } from "react-hook-form";
import { isFormErrorKey, type ClientFormValues } from "../model/client-form.schema";

/** Props for {@link ClientFormDialog}. */
interface ClientFormDialogProps {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called when it asks to open or close. */
  readonly onOpenChange: (open: boolean) => void;
  /** True when editing an existing client. */
  readonly editing: boolean;
  /** The form from `useClientForm`. */
  readonly form: UseFormReturn<ClientFormValues>;
  /** Submit handler. */
  readonly onSubmit: (event?: React.BaseSyntheticEvent) => void;
  /** True while saving. */
  readonly pending: boolean;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the form inside a dialog.
 *
 * @param props - Open state, form and handlers.
 * @returns The dialog.
 */
export function ClientFormDialog(props: Readonly<ClientFormDialogProps>): ReactElement {
  const { open, onOpenChange, editing, form, onSubmit, pending, dir } = props;
  const t = useTranslations("clients.form");
  const { errors } = form.formState;
  /**
   * Translates a schema message key, or passes an API message through.
   *
   * @param message - Key or text.
   * @returns Text for the field.
   */
  const text = (message: string | undefined): string | undefined => {
    if (message === undefined) return undefined;
    return isFormErrorKey(message) ? t(`errors.${message}`) : message;
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dir={dir}
      title={editing ? t("editTitle") : t("createTitle")}
      closeLabel={t("close")}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField label={t("name")} error={text(errors.name?.message)}>
          {(control) => <Input autoComplete="off" {...control} {...form.register("name")} />}
        </FormField>
        <FormField label={t("notes")} hint={t("notesHint")} error={text(errors.notes?.message)}>
          {(control) => <Textarea {...control} {...form.register("notes")} />}
        </FormField>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
