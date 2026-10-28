/** Confirmation dialog for deleting a fabric or a rule (a hard delete; the audit log keeps the old value). */
import { Button, Dialog } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props of {@link DeleteDialog}. */
interface DeleteDialogProps {
  /** Which kind of item is deleted; picks the texts. */
  readonly kind: "fabric" | "rule";
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called when it asks to open or close. */
  readonly onOpenChange: (open: boolean) => void;
  /** Name of the item to delete, shown in the question. */
  readonly name: string;
  /** Runs the deletion. */
  readonly onConfirm: () => void;
  /** True while deleting. */
  readonly pending: boolean;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the confirmation.
 *
 * @param props - Kind, open state, name and handlers.
 * @returns The dialog.
 */
export function DeleteDialog(props: Readonly<DeleteDialogProps>): ReactElement {
  const { kind, open, onOpenChange, name, onConfirm, pending, dir } = props;
  const t = useTranslations(kind === "fabric" ? "admin.fabrics.delete" : "admin.fabricRules.delete");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dir={dir}
      title={t("title")}
      description={t("description", { name })}
      closeLabel={t("close")}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={pending}>
            {t("confirm")}
          </Button>
        </div>
      }
    />
  );
}
