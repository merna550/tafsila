"use client";
/** The /designs/[id]/confirm screen: confirm or correct every feature the AI read from the photos (FR-DES-03 to FR-DES-07). */
import { PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactElement } from "react";
import { seedEditorDraft, useDesign } from "@/features/design-picker";
import { useAnalysisStatus } from "@/features/upload-design";
import { DataState } from "@/shared/data-state";
import { useApiErrorHandler } from "@/shared/error-display";
import { useRouter } from "@/shared/i18n";
import { ConfirmBody } from "./ConfirmBody";
import { ConfirmBreadcrumb } from "./components/ConfirmBreadcrumb";
import { FailedPanel } from "./components/FailedPanel";

/** Props for {@link ConfirmScreen}. */
interface ConfirmScreenProps {
  /** The design, from the route. */
  readonly designId: string;
}

/**
 * Loads the analysis and the design; a missing or running analysis goes back to the analysing screen.
 *
 * @param props - The design id.
 * @returns The screen.
 */
export function ConfirmScreen({ designId }: Readonly<ConfirmScreenProps>): ReactElement {
  const t = useTranslations("confirmDesign");
  const router = useRouter();
  const handleError = useApiErrorHandler();
  const status = useAnalysisStatus(designId);
  const design = useDesign(designId);
  const [busy, setBusy] = useState(false);
  const stateStatus = status.state?.status;
  useEffect(() => {
    if (stateStatus === "none" || stateStatus === "pending") router.replace(`/designs/${designId}/analysing`);
  }, [stateStatus, router, designId]);
  const failed = status.requestFailed || stateStatus === "failed";
  const result = status.state?.result;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <ConfirmBreadcrumb />
      <PageHeader title={t("title")} />
      {failed ? (
        <FailedPanel
          retrying={status.retrying}
          onRetry={() =>
            void status
              .retry()
              .then(() => router.replace(`/designs/${designId}/analysing`))
              .catch((error: unknown) => handleError(error, "action"))
          }
        />
      ) : (
        <DataState
          isPending={result === undefined || design.isPending}
          error={design.error}
          isEmpty={false}
          onRetry={() => void design.refetch()}
        >
          {result === undefined || design.data === undefined ? null : (
            <ConfirmBody
              result={result}
              busy={busy}
              onContinue={(spec) => {
                setBusy(true);
                seedEditorDraft(designId, design.data.design.category, spec);
                router.push(`/designs/${designId}/pattern`);
              }}
            />
          )}
        </DataState>
      )}
    </div>
  );
}
