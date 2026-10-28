"use client";
/** The marker diagram: the placed pieces with their names, the fold and selvedge marked, and zoom buttons (FR-FAB-02). Draws the scene as given; no geometry is computed here. */
import { Button } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import type { MarkerScene } from "@/shared/fabric-nesting";
import { formatCm } from "../model/format";
import type { TextLocale } from "../model/localized";
import { fullViewBox, viewBoxAttr, zoomView, ZOOM_STEP } from "../model/view-box";

/** Props of {@link MarkerDiagram}. */
interface MarkerDiagramProps {
  /** The layout of one fabric kind. */
  readonly scene: MarkerScene;
}

/** Label size in mm of the drawing. */
const LABEL_SIZE_MM = 34;

/** Stroke widths in mm of the drawing: the fold, a selvedge, a cut outline and a grain line. */
const STROKE_MM = { fold: 10, selvedge: 4, cut: 4, grain: 3 } as const;

/** Dash pattern of a selvedge, in mm. */
const SELVEDGE_DASH = "30 20";

/** Gap under the strip before the second selvedge label, as a multiple of the label size. */
const LABEL_GAP = 1.2;

/** Props of {@link ZoomBar}. */
interface ZoomBarProps {
  /** Called with the factor to zoom by, or null to reset. */
  readonly onZoom: (factor: number | null) => void;
  /** Usable width in mm, shown beside the buttons. */
  readonly usableMm: number;
}

/**
 * Renders the zoom buttons and the usable width.
 *
 * @param props - The zoom handler and the usable width.
 * @returns The bar.
 */
function ZoomBar({ onZoom, usableMm }: Readonly<ZoomBarProps>): ReactElement {
  const t = useTranslations("fabric.calc.marker");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" aria-label={t("zoomIn")} onClick={() => onZoom(ZOOM_STEP)}>
        +
      </Button>
      <Button variant="secondary" aria-label={t("zoomOut")} onClick={() => onZoom(1 / ZOOM_STEP)}>
        −
      </Button>
      <Button variant="ghost" onClick={() => onZoom(null)}>
        {t("zoomReset")}
      </Button>
      <span className="text-sm text-muted">{t("usable", { width: formatCm(usableMm) })}</span>
    </div>
  );
}

/** Props of {@link SceneShapes}. */
interface SceneShapesProps {
  /** The layout to draw. */
  readonly scene: MarkerScene;
}

/**
 * Draws the fold and selvedge lines, the pieces with their names, and the line labels.
 *
 * @param props - The scene.
 * @returns The SVG content.
 */
function SceneShapes({ scene }: Readonly<SceneShapesProps>): ReactElement {
  const t = useTranslations("fabric.calc.marker");
  const locale = useLocale() as TextLocale;
  return (
    <>
      {scene.lines.map((line) => (
        <path
          key={`${line.kind}-${line.d}`}
          d={line.d}
          fill="none"
          strokeWidth={line.kind === "fold" ? STROKE_MM.fold : STROKE_MM.selvedge}
          strokeDasharray={line.kind === "selvedge" ? SELVEDGE_DASH : undefined}
          className={line.kind === "fold" ? "stroke-danger" : "stroke-muted"}
        />
      ))}
      {scene.pieces.map((piece) => (
        <g key={piece.shapeId}>
          <path d={piece.cutD} className="fill-surface-hover stroke-primary" strokeWidth={STROKE_MM.cut} />
          <path d={piece.grainD} fill="none" className="stroke-muted" strokeWidth={STROKE_MM.grain} />
          <text
            x={piece.labelAt.x}
            y={piece.labelAt.y}
            fontSize={LABEL_SIZE_MM}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-text"
          >
            {piece.name[locale]}
          </text>
        </g>
      ))}
      <text x={0} y={-LABEL_SIZE_MM / 2} fontSize={LABEL_SIZE_MM} className="fill-danger">
        {scene.lines[0]?.kind === "fold" ? t("fold") : t("selvedge")}
      </text>
      <text
        x={0}
        y={scene.heightMm + LABEL_SIZE_MM * LABEL_GAP}
        fontSize={LABEL_SIZE_MM}
        className="fill-muted"
      >
        {t("selvedge")}
      </text>
    </>
  );
}

/**
 * Renders the SVG and its zoom buttons.
 *
 * @param props - The scene.
 * @returns The diagram.
 */
export function MarkerDiagram({ scene }: Readonly<MarkerDiagramProps>): ReactElement {
  const t = useTranslations("fabric.calc.marker");
  const full = fullViewBox(scene.widthMm, scene.heightMm);
  const [view, setView] = useState(full);
  // A new scene starts from the whole strip again.
  const [shown, setShown] = useState(scene);
  if (shown !== scene) {
    setShown(scene);
    setView(full);
  }
  return (
    <div className="flex flex-col gap-2">
      <ZoomBar
        usableMm={scene.heightMm}
        onZoom={(factor) => setView(factor === null ? full : zoomView(view, full, factor))}
      />
      <svg
        role="img"
        aria-label={t("label")}
        data-testid="marker-diagram"
        viewBox={viewBoxAttr(view)}
        className="h-auto w-full rounded-md border border-border bg-surface"
        style={{ aspectRatio: `${full.width} / ${full.height}` }}
      >
        <SceneShapes scene={scene} />
      </svg>
      <p className="text-sm text-muted">{t("note")}</p>
    </div>
  );
}
