"use client";
/** Dev-only host: drafts the seed dress at size M in the worker and shows it in the viewer, until the pattern page (#251). */
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { useMemo, type ReactElement } from "react";
import { usePatternPreview } from "@/shared/pattern-preview";
import { useViewerState } from "./hooks/use-viewer-state";
import { PatternViewer } from "./components/PatternViewer";

/**
 * Mounts the viewer with its own state; shows the selected piece id as plain data for the browser tests.
 *
 * @returns The host.
 */
export function ViewerDevHost(): ReactElement {
  const input = useMemo(() => ({ spec: seedDress, measurements: sizeM }), []);
  const preview = usePatternPreview(input);
  const viewer = useViewerState();
  return (
    <div data-testid="viewer-host" data-status={preview.status}>
      {preview.scene ? (
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
      ) : null}
      <span data-testid="viewer-selected" hidden>
        {viewer.selectedPieceId ?? ""}
      </span>
    </div>
  );
}
