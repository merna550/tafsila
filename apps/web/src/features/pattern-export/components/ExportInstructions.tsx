"use client";
/** The print note of the export dialog: print at 100 %, then check the 10 cm test square (issue #289). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/**
 * Renders the note.
 *
 * @returns The note as a status region.
 */
export function ExportInstructions(): ReactElement {
  const t = useTranslations("patternExport");
  return (
    <p
      role="status"
      data-testid="export-instructions"
      className="rounded-md border border-warning bg-background px-3.5 py-2.5 text-base text-text"
    >
      {t("instructions")}
    </p>
  );
}
