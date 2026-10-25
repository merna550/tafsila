"use client";
/** The /designs/[id]/pattern screen: live preview, report, options and the save-version button (issue #251). */
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { useViewerState } from "@/features/pattern-viewer";
import { DataState } from "@/shared/data-state";
import { PatternPageHeader } from "./components/PatternPageHeader";
import { PatternSidePanel, type PanelTab } from "./components/PatternSidePanel";
import { ViewerPane } from "./components/ViewerPane";
import { usePatternPage } from "./hooks/use-pattern-page";
import { useReportSelection } from "./hooks/use-report-selection";
import { editorPath, shownReport, viewerFlags } from "./model/page-flags";

/** Props of {@link PatternPageScreen}. */
interface PatternPageScreenProps {
  /** Design id from the URL. */
  readonly designId: string;
  /** Client from `?clientId=`, if any. */
  readonly clientId?: string;
}

/**
 * Loads the design, drafts the pattern in the worker and composes the viewer, the panel and the save bar.
 *
 * @param props - Design id and the optional client.
 * @returns The screen.
 */
export function PatternPageScreen({ designId, clientId }: Readonly<PatternPageScreenProps>): ReactElement {
  const t = useTranslations("patternPage");
  const page = usePatternPage(designId, clientId);
  const viewer = useViewerState();
  const selection = useReportSelection(viewer);
  const [chosenTab, setTab] = useState<PanelTab | null>(null);
  const { saveState, preview } = page;
  const flags = viewerFlags(saveState, preview);
  const noSet = saveState.kind === "no-set";
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <PatternPageHeader
        title={page.design.data?.design.title ?? t("fallbackTitle")}
        editHref={editorPath(designId, clientId)}
        state={saveState}
        versionNo={page.baseVersion?.versionNo}
        onSave={page.save}
      />
      <DataState
        isPending={!page.ready}
        error={page.design.error}
        isEmpty={false}
        onRetry={() => void page.design.refetch()}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <ViewerPane
              scene={preview.scene}
              viewer={viewer}
              updating={flags.updating}
              error={flags.error}
              needsSet={noSet}
              onOpenOptions={() => setTab("options")}
            />
          </div>
          <PatternSidePanel
            tab={chosenTab ?? (noSet ? "options" : "report")}
            onTab={setTab}
            scene={preview.scene}
            report={shownReport(page.rejected, preview)}
            serverRefused={page.rejected !== null}
            viewer={viewer}
            selection={selection}
            options={page.options}
            onOptions={page.setOptions}
            preselectClientId={clientId ?? null}
          />
        </div>
      </DataState>
    </div>
  );
}
