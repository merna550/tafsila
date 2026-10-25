"use client";
/** The pattern viewer: a controlled canvas with zoom, pan, fit, selection and highlight (issue #243, FR-PAT-04). */
import { forwardRef, useImperativeHandle, useMemo, type KeyboardEvent, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { useTapRouter } from "./use-tap-router";
import { useViewportGestures } from "./use-viewport-gestures";
import { MEASURE_OFF, MEASURE_ON, allSnapPoints } from "../model/measure";
import { targetBox } from "../model/scene-selectors";
import type { PatternViewerHandle, PatternViewerProps } from "../model/types";
import { ScaleBar, ViewerControls } from "./ViewerControls";
import { ViewerCanvas } from "./ViewerCanvas";
import { MeasurePanel } from "./MeasurePanel";
import { ViewerSurface } from "./ViewerSurface";

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
  { scene, layers, selectedPieceId, onSelectPiece, highlight, measure, onMeasureChange, className },
  ref,
): ReactElement {
  const t = useTranslations("patternViewer");
  const snapPoints = useMemo(() => allSnapPoints(scene), [scene]);
  const { onTap, viewportRef } = useTapRouter({ measure, onMeasureChange, onSelectPiece, snapPoints });
  const g = useViewportGestures(scene, onTap);
  viewportRef.current = g.viewport;
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
   * Escape leaves the measure tool when it is on, else clears the selection; every other key goes to the zoom and pan keys.
   *
   * @param e - The key event.
   */
  function onKeyDown(e: KeyboardEvent<HTMLElement>): void {
    if (e.key !== "Escape") g.handlers.onKeyDown(e);
    else if (measure.active) onMeasureChange(MEASURE_OFF);
    else onSelectPiece(null);
  }

  return (
    <div dir="ltr" className={className}>
      <div dir="auto" className="mb-2">
        <ViewerControls
          onZoomIn={g.zoomIn}
          onZoomOut={g.zoomOut}
          onFit={fit}
          measureActive={measure.active}
          onMeasureToggle={() => onMeasureChange(measure.active ? MEASURE_OFF : MEASURE_ON)}
        />
      </div>
      <ViewerSurface gestures={g} onKeyDown={onKeyDown}>
        <ViewerCanvas
          scene={scene}
          layers={layers}
          selectedPieceId={selectedPieceId}
          highlight={highlight}
          measure={measure}
          snapPoints={snapPoints}
          viewport={g.viewport}
          label={t("canvasLabel")}
        />
        <div className="pointer-events-none absolute start-3 bottom-3">
          <ScaleBar zoom={g.viewport.zoom} />
        </div>
      </ViewerSurface>
      <MeasurePanel scene={scene} measure={measure} onChange={onMeasureChange} />
      <p id="viewer-hint" dir="auto" className="mt-2 text-sm text-muted">
        {t("hint")}
      </p>
    </div>
  );
});
