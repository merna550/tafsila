"use client";
/** The export dialog of a saved version: choose a file, watch it build, download it (issue #289, screen ExportDialog). */
import { Dialog } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactElement } from "react";
import { useApiErrorHandler } from "@/shared/error-display";
import { usePatternExport, type ExportKind } from "@/shared/pattern-export";
import { DEFAULT_EXPORT_KIND } from "../model/export-options";
import type { ExportSource } from "../model/export-source";
import { ExportDialogBody } from "./ExportDialogBody";

/** Props of {@link ExportDialog}. */
export interface ExportDialogProps {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Called with false when the dialog closes (Esc, overlay, close button, buttons). */
  readonly onOpenChange: (open: boolean) => void;
  /** What to export. */
  readonly source: ExportSource;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the dialog and owns the export worker. Closing while a build runs cancels it.
 *
 * @param props - Open state, the source and the direction.
 * @returns The dialog.
 */
export function ExportDialog({ open, onOpenChange, source, dir }: Readonly<ExportDialogProps>): ReactElement {
  const t = useTranslations("patternExport");
  const handleError = useApiErrorHandler();
  const exporter = usePatternExport();
  const [kind, setKind] = useState<ExportKind>(DEFAULT_EXPORT_KIND);
  const { state, reset, start, downloadAgain } = exporter;

  useEffect(() => {
    if (state.status === "error") handleError(state.error, "load");
  }, [state, handleError]);

  /**
   * Passes the open state on and stops the build when the dialog closes.
   *
   * @param next - The new open state.
   */
  function change(next: boolean): void {
    if (!next) reset();
    onOpenChange(next);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={change}
      dir={dir}
      title={t("title")}
      description={t("subtitle", {
        title: source.meta.title,
        n: source.meta.versionNo,
        engine: source.meta.engineVersion,
      })}
      closeLabel={t("close")}
    >
      <ExportDialogBody
        state={state}
        kind={kind}
        onKindChange={setKind}
        onStart={() => start({ ...source, kind })}
        onCancel={reset}
        onClose={() => change(false)}
        onDownloadAgain={downloadAgain}
      />
    </Dialog>
  );
}
