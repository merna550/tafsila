"use client";
/** Asks before clearing every tick of the version. */
import { Button, Dialog } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { DIRECTION, type AppLocale } from "@/shared/i18n";

/** Props of {@link ClearTicksDialog}. */
interface ClearTicksDialogProps {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called to close it. */
  readonly onClose: () => void;
  /** Clears the ticks. */
  readonly onConfirm: () => void;
}

/**
 * Renders the confirmation.
 *
 * @param props - Open state and handlers.
 * @returns The dialog.
 */
export function ClearTicksDialog({
  open,
  onClose,
  onConfirm,
}: Readonly<ClearTicksDialogProps>): ReactElement {
  const t = useTranslations("directCut.clearDialog");
  const locale = useLocale() as AppLocale;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? undefined : onClose())}
      dir={DIRECTION[locale]}
      title={t("title")}
      description={t("description")}
      closeLabel={t("close")}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={onConfirm} data-testid="confirm-clear-ticks">
            {t("confirm")}
          </Button>
        </div>
      }
    />
  );
}
