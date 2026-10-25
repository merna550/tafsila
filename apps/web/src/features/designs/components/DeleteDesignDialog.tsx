/** Confirmation dialog for deleting a design: names it and says its saved versions go with it. */
import { Button, Dialog } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link DeleteDesignDialog}. */
interface DeleteDesignDialogProps {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called when it asks to open or close. */
  readonly onOpenChange: (open: boolean) => void;
  /** Title of the design to delete. */
  readonly title: string;
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
 * @param props - Open state, design title and handlers.
 * @returns The dialog.
 */
export function DeleteDesignDialog(props: Readonly<DeleteDesignDialogProps>): ReactElement {
  const { open, onOpenChange, title, onConfirm, pending, dir } = props;
  const t = useTranslations("designs.delete");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dir={dir}
      title={t("title")}
      description={t("description", { title })}
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
