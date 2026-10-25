"use client";
/** The tabbed side panel: piece details, validation report and options. */
import type { ValidationReport as Report } from "@tafsila/schemas";
import { Card, Tabs } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { PatternOptionsPanel, type PatternOptionsValue } from "@/features/pattern-options";
import {
  PieceList,
  PiecePanel,
  ValidationReport,
  type PatternScene,
  type ViewerController,
} from "@/features/pattern-viewer";
import type { ReportSelection } from "../model/report-selection";
import { ServerRejectedNotice } from "./ServerRejectedNotice";

/** The tab values. */
export type PanelTab = "details" | "report" | "options";

/** Props of {@link PatternSidePanel}. */
interface PatternSidePanelProps {
  /** The open tab. */
  readonly tab: PanelTab;
  /** Called with the tab the user chose. */
  readonly onTab: (tab: PanelTab) => void;
  /** The scene the report and the piece list point into, if drafted. */
  readonly scene: PatternScene | undefined;
  /** The report to show: the server's when it refused the inputs, else the preview's. */
  readonly report: Report | null;
  /** True when `report` came from the server's refusal. */
  readonly serverRefused: boolean;
  /** The viewer state. */
  readonly viewer: ViewerController;
  /** The chosen report row. */
  readonly selection: ReportSelection;
  /** The options being edited. */
  readonly options: PatternOptionsValue;
  /** Called with the new options. */
  readonly onOptions: (options: PatternOptionsValue) => void;
  /** Client from the URL, applied while none is chosen. */
  readonly preselectClientId: string | null;
}

/**
 * The details tab: the piece list and the selected piece.
 *
 * @param props - Component props.
 * @param props.scene - The scene, if drafted.
 * @param props.viewer - The viewer state.
 * @returns The tab content.
 */
function DetailsTab({
  scene,
  viewer,
}: Readonly<Pick<PatternSidePanelProps, "scene" | "viewer">>): ReactElement | null {
  if (scene === undefined) return null;
  const selected = scene.pieces.find((p) => p.id === viewer.selectedPieceId) ?? null;
  const position = selected
    ? { index: scene.pieces.indexOf(selected) + 1, total: scene.pieces.length }
    : undefined;
  return (
    <div className="flex flex-col gap-4">
      <PieceList scene={scene} selectedPieceId={viewer.selectedPieceId} onSelect={viewer.selectPiece} />
      <PiecePanel piece={selected} position={position} />
    </div>
  );
}

/**
 * Renders the three tabs.
 *
 * @param props - Component props.
 * @returns The panel.
 */
export function PatternSidePanel(props: Readonly<PatternSidePanelProps>): ReactElement {
  const t = useTranslations("patternPage.tabs");
  const { scene, report, viewer, selection } = props;
  const reportTab = (
    <div className="flex flex-col gap-3">
      {props.serverRefused ? <ServerRejectedNotice /> : null}
      {report !== null && scene !== undefined ? (
        <ValidationReport
          report={report}
          scene={scene}
          selectedKey={selection.key}
          onSelect={selection.select}
        />
      ) : null}
    </div>
  );
  return (
    <Card className="p-4 lg:w-96 lg:flex-none" data-testid="side-panel">
      <Tabs
        label={t("label")}
        value={props.tab}
        onValueChange={(value) => props.onTab(value as PanelTab)}
        items={[
          { value: "details", label: t("details"), content: <DetailsTab scene={scene} viewer={viewer} /> },
          { value: "report", label: t("report"), content: reportTab },
          {
            value: "options",
            label: t("options"),
            content: (
              <PatternOptionsPanel
                value={props.options}
                onChange={props.onOptions}
                preselectClientId={props.preselectClientId}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
