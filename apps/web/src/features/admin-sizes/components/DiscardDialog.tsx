/** Confirmation before unsaved edits are thrown away. */
import { Button, Dialog } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link DiscardDialog}. */
interface DiscardDialogProps {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called when it asks to open or close. */
  readonly onOpenChange: (open: boolean) => void;
  /** Number of changed cells. */
  readonly count: number;
  /** Throws the edits away. */
  readonly onConfirm: () => void;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the confirmation.
 *
 * @param props - Open state, count and handlers.
 * @returns The dialog.
 */
export function DiscardDialog(props: Readonly<DiscardDialogProps>): ReactElement {
  const { open, onOpenChange, count, onConfirm, dir } = props;
  const t = useTranslations("admin.sizes.discard");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dir={dir}
      title={t("title")}
      description={t("description", { count })}
      closeLabel={t("close")}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("keep")}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {t("confirm")}
          </Button>
        </div>
      }
    />
  );
}
