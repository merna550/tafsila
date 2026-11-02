"use client";
/** The /designs/[id]/analysing screen: polls the analysis, shows its steps and the way out when it is slow or failed (FR-DES-02). */
import { PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useApiErrorHandler } from "@/shared/error-display";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { PhotoBreadcrumb } from "./components/PhotoBreadcrumb";
import { useAnalysisStatus } from "./hooks/use-analysis-status";

/** Props for {@link AnalysingScreen}. */
interface AnalysingScreenProps {
  /** The design being analysed, from the route. */
  readonly designId: string;
}

/**
 * Shows the analysing state of one design.
 *
 * @param props - The design id.
 * @returns The screen.
 */
export function AnalysingScreen({ designId }: Readonly<AnalysingScreenProps>): ReactElement {
  const t = useTranslations("uploadDesign");
  const handleError = useApiErrorHandler();
  const status = useAnalysisStatus(designId);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PhotoBreadcrumb current={t("analysing.breadcrumb")} viaPhotos />
      <PageHeader title={t("analysing.title")} />
      <AnalysisPanel
        phase={status.requestFailed ? "failed" : status.phase}
        designId={designId}
        retrying={status.retrying}
        onRetry={() => void status.retry().catch((error: unknown) => handleError(error, "action"))}
      />
    </div>
  );
}
