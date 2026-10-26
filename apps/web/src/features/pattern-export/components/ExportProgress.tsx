"use client";
/** The progress of a running build: a text line and a bar (issue #289). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { ExportProgress as Progress } from "@/shared/pattern-export";

/** Props of {@link ExportProgress}. */
interface ExportProgressProps {
  /** Pages done so far, or null before the first report. */
  readonly progress: Progress | null;
}

/**
 * Renders the progress line and bar. The text is a live status; the bar reports its percentage.
 *
 * @param props - The latest progress.
 * @returns The block.
 */
export function ExportProgress({ progress }: Readonly<ExportProgressProps>): ReactElement {
  const t = useTranslations("patternExport.progress");
  const percent = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2" data-testid="export-progress">
      <p role="status" className="text-base font-semibold text-text">
        {progress ? t("label", { done: progress.done, total: progress.total }) : t("starting")}
      </p>
      <div
        role="progressbar"
        aria-label={t("starting")}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 overflow-hidden rounded-full bg-background"
      >
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
