"use client";
/** Confirmation before restoring: says a new version is saved and the existing ones stay; warns when unsaved edits will be lost. */
import { Button, Dialog } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link RestoreVersionDialog}. */
interface RestoreVersionDialogProps {
  /** The version to restore, or null while closed. */
  readonly versionNo: number | null;
  /** Called with false when the user cancels or closes. */
  readonly onClose: () => void;
  /** Runs the restore. */
  readonly onConfirm: () => void;
  /** True while the request runs. */
  readonly pending: boolean;
  /** True when unsaved edits of this design would be replaced. */
  readonly dirty: boolean;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the dialog.
 *
 * @param props - The version, handlers and the dirty flag.
 * @returns The dialog.
 */
export function RestoreVersionDialog(props: Readonly<RestoreVersionDialogProps>): ReactElement {
  const { versionNo, onClose, onConfirm, pending, dirty, dir } = props;
  const t = useTranslations("versionHistory.restoreDialog");
  const n = versionNo ?? 0;
  return (
    <Dialog
      open={versionNo !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      dir={dir}
      title={t("title", { n })}
      description={dirty ? `${t("description", { n })} ${t("unsaved")}` : t("description", { n })}
      closeLabel={t("close")}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={pending} data-testid="confirm-restore">
            {t("confirm")}
          </Button>
        </div>
      }
    />
  );
}
