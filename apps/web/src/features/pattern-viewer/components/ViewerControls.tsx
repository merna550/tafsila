"use client";
/** Zoom in, zoom out and fit buttons, and the 10 cm scale bar (issue #243). Only these follow the locale. */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Length of the scale bar on the sheet, in mm. */
const SCALE_BAR_MM = 100;

/** Props of {@link ViewerControls}. */
interface ViewerControlsProps {
  /** Zooms in one step. */
  readonly onZoomIn: () => void;
  /** Zooms out one step. */
  readonly onZoomOut: () => void;
  /** Fits the whole sheet. */
  readonly onFit: () => void;
  /** Whether the measure tool is on. */
  readonly measureActive: boolean;
  /** Switches the measure tool on or off. */
  readonly onMeasureToggle: () => void;
}

/** Props of {@link ScaleBar}. */
interface ScaleBarProps {
  /** Current zoom in pixels per mm. */
  readonly zoom: number;
}

/**
 * The buttons above the canvas.
 *
 * @param props - Component props.
 * @returns The toolbar.
 */
export function ViewerControls({
  onZoomIn,
  onZoomOut,
  onFit,
  measureActive,
  onMeasureToggle,
}: Readonly<ViewerControlsProps>): ReactElement {
  const t = useTranslations("patternViewer");
  return (
    <div role="toolbar" aria-label={t("toolbar")} className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={onZoomIn} data-testid="viewer-zoom-in">
        {t("zoomIn")}
      </Button>
      <Button variant="secondary" onClick={onZoomOut} data-testid="viewer-zoom-out">
        {t("zoomOut")}
      </Button>
      <Button variant="secondary" onClick={onFit} data-testid="viewer-fit">
        {t("fit")}
      </Button>
      <Button
        variant="secondary"
        onClick={onMeasureToggle}
        aria-pressed={measureActive}
        data-testid="viewer-measure-toggle"
      >
        {t("measure.toggle")}
      </Button>
    </div>
  );
}

/**
 * A bar that is 10 cm long at the current zoom, with its caption; never mirrored.
 *
 * @param props - Component props.
 * @returns The scale bar.
 */
export function ScaleBar({ zoom }: Readonly<ScaleBarProps>): ReactElement {
  const t = useTranslations("patternViewer");
  const widthPx = SCALE_BAR_MM * zoom;
  return (
    <div
      dir="ltr"
      className="flex flex-col items-start gap-1 text-xs text-muted"
      data-testid="viewer-scale-bar"
      data-width-px={widthPx.toFixed(1)}
    >
      <span className="h-1.5 border-x-2 border-b-2 border-text" style={{ width: widthPx }} />
      <span>{t("scaleBar")}</span>
    </div>
  );
}
