"use client";
/** The pattern viewer: a controlled canvas with zoom, pan, fit, selection and highlight (issue #243, FR-PAT-04). */
import { forwardRef, useCallback, useImperativeHandle, type KeyboardEvent, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { useViewportGestures } from "./use-viewport-gestures";
import { targetBox } from "../model/scene-selectors";
import type { PatternViewerHandle, PatternViewerProps } from "../model/types";
import { ScaleBar, ViewerControls } from "./ViewerControls";
import { ViewerCanvas } from "./ViewerCanvas";
import { ViewerSurface } from "./ViewerSurface";

/**
 * The piece a tap landed on.
 *
 * @param target - The element the press started on.
 * @returns The piece id, or null on empty canvas.
 */
function pieceIdAt(target: EventTarget | null): string | null {
  return target instanceof Element
    ? (target.closest("[data-piece-id]")?.getAttribute("data-piece-id") ?? null)
    : null;
}

/**
 * Draws a pattern scene. Layers, selection and highlight come from the parent; zoom and pan stay here and are driven
 * by pointer, wheel, keyboard, the buttons and the ref handle. The canvas is `dir="ltr"` and never mirrors, so a pattern
 * reads the same in Arabic and English; only the buttons follow the locale.
 *
 * @param props - See {@link PatternViewerProps}.
 * @param ref - Gives `fit` and `zoomTo`.
 * @returns The viewer.
 */
export const PatternViewer = forwardRef<PatternViewerHandle, PatternViewerProps>(function PatternViewer(
  { scene, layers, selectedPieceId, onSelectPiece, highlight, className },
  ref,
): ReactElement {
  const t = useTranslations("patternViewer");
  const onTap = useCallback(
    (target: EventTarget | null) => onSelectPiece(pieceIdAt(target)),
    [onSelectPiece],
  );
  const g = useViewportGestures(scene, onTap);
  const { fit, zoomToBox } = g;

  useImperativeHandle(
    ref,
    () => ({
      fit,
      zoomTo(targets) {
        const box = targetBox(scene, targets);
        if (box) zoomToBox(box);
      },
    }),
    [fit, zoomToBox, scene],
  );

  /**
   * Escape clears the selection; every other key goes to the zoom and pan keys.
   *
   * @param e - The key event.
   */
  function onKeyDown(e: KeyboardEvent<HTMLElement>): void {
    if (e.key === "Escape") onSelectPiece(null);
    else g.handlers.onKeyDown(e);
  }

  return (
    <div dir="ltr" className={className}>
      <div dir="auto" className="mb-2">
        <ViewerControls onZoomIn={g.zoomIn} onZoomOut={g.zoomOut} onFit={fit} />
      </div>
      <ViewerSurface gestures={g} onKeyDown={onKeyDown}>
        <ViewerCanvas
          scene={scene}
          layers={layers}
          selectedPieceId={selectedPieceId}
          highlight={highlight}
          viewport={g.viewport}
          label={t("canvasLabel")}
        />
        <div className="pointer-events-none absolute start-3 bottom-3">
          <ScaleBar zoom={g.viewport.zoom} />
        </div>
      </ViewerSurface>
      <p id="viewer-hint" dir="auto" className="mt-2 text-sm text-muted">
        {t("hint")}
      </p>
    </div>
  );
});
