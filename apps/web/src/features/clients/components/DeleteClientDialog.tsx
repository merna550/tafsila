/** Confirmation dialog for deleting a client: names her and says her measurements go with her. */
import { Button, Dialog } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link DeleteClientDialog}. */
interface DeleteClientDialogProps {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called when it asks to open or close. */
  readonly onOpenChange: (open: boolean) => void;
  /** Name of the client to delete. */
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
 * @param props - Open state, client name and handlers.
 * @returns The dialog.
 */
export function DeleteClientDialog(props: Readonly<DeleteClientDialogProps>): ReactElement {
  const { open, onOpenChange, name, onConfirm, pending, dir } = props;
  const t = useTranslations("clients.delete");
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
