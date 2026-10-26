"use client";
/** The Export button of a saved version: opens the export dialog, or says why it cannot (issue #289). */
import { Button } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import type { ExportSource } from "../model/export-source";
import { ExportDialog } from "./ExportDialog";

/** Props of {@link ExportButton}. */
interface ExportButtonProps {
  /** What to export, or null while the version is not loaded or not saved. */
  readonly source: ExportSource | null;
}

/**
 * Renders the button and its dialog. Without a source the button is disabled and the reason is visible text.
 *
 * @param props - The export source.
 * @returns The button with its dialog.
 */
export function ExportButton({ source }: Readonly<ExportButtonProps>): ReactElement {
  const t = useTranslations("patternExport");
  const locale = useLocale() as AppLocale;
  const [open, setOpen] = useState(false);
  if (source === null) {
    return (
      <>
        <Button
          disabled
          aria-describedby="export-disabled-reason"
          variant="secondary"
          data-testid="export-open-disabled"
        >
          {t("button")}
        </Button>
        <p id="export-disabled-reason" className="w-full text-xs text-muted">
          {t("needsSave")}
        </p>
      </>
    );
  }
  return (
    <>
      <Button aria-haspopup="dialog" onClick={() => setOpen(true)} data-testid="export-open">
        {t("button")}
      </Button>
      <ExportDialog open={open} onOpenChange={setOpen} source={source} dir={DIRECTION[locale]} />
    </>
  );
}
