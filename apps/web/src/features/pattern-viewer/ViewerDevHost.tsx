"use client";
/** Dev-only host: drafts the seed dress at size M in the worker and shows it in the viewer, until the pattern page (#251). */
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { useMemo, useState, type ReactElement } from "react";
import { usePatternPreview } from "@/shared/pattern-preview";
import { withDemoChecks } from "./dev-report";
import { useViewerState } from "./hooks/use-viewer-state";
import { LayerToggles } from "./components/LayerToggles";
import { PatternViewer } from "./components/PatternViewer";
import { PieceList } from "./components/PieceList";
import { PiecePanel } from "./components/PiecePanel";
import { ValidationReport } from "./components/ValidationReport";
import type { ViewerTarget } from "./model/types";

/**
 * Mounts the viewer with its own state; shows the selected piece id as plain data for the browser tests.
 *
 * @returns The host.
 */
export function ViewerDevHost(): ReactElement {
  const input = useMemo(() => ({ spec: seedDress, measurements: sizeM }), []);
  const preview = usePatternPreview(input);
  const viewer = useViewerState();
  const [reportKey, setReportKey] = useState<string | null>(null);
  const report = useMemo(
    () => (preview.result ? withDemoChecks(preview.result.validation) : null),
    [preview.result],
  );
  /**
   * The page owns the effects: a chosen row highlights its targets and frames them; choosing it again clears them.
   *
   * @param key - The chosen row, or null.
   * @param targets - What it points at.
   */
  const selectCheck = (key: string | null, targets: readonly ViewerTarget[]): void => {
    setReportKey(key);
    viewer.setHighlight(targets);
    if (key !== null) viewer.ref.current?.zoomTo(targets);
  };
  const selected = preview.scene?.pieces.find((p) => p.id === viewer.selectedPieceId) ?? null;
  const position =
    selected && preview.scene
      ? { index: preview.scene.pieces.indexOf(selected) + 1, total: preview.scene.pieces.length }
      : undefined;
  return (
    <div data-testid="viewer-host" className="flex flex-col gap-3" data-status={preview.status}>
      {preview.scene ? (
        <>
          <LayerToggles layers={viewer.layers} onToggle={viewer.toggleLayer} />
          <PatternViewer
            ref={viewer.ref}
            scene={preview.scene}
            layers={viewer.layers}
            selectedPieceId={viewer.selectedPieceId}
            onSelectPiece={viewer.selectPiece}
            highlight={viewer.highlight}
            measure={viewer.measure}
            onMeasureChange={viewer.setMeasure}
          />
          <PieceList
            scene={preview.scene}
            selectedPieceId={viewer.selectedPieceId}
            onSelect={viewer.selectPiece}
          />
          <PiecePanel piece={selected} position={position} />
          {report ? (
            <ValidationReport
              report={report}
              scene={preview.scene}
              selectedKey={reportKey}
              onSelect={selectCheck}
            />
          ) : null}
        </>
      ) : null}
      <span data-testid="viewer-selected" hidden>
        {viewer.selectedPieceId ?? ""}
      </span>
    </div>
  );
}
