/** The projected drawing: one full-size SVG, pieces in mm inside one scaled group, the verification square outside it (issue #286). Pure, no state, no geometry. */
import type { ScenePiece } from "@tafsila/engine/viewer";
import { useTranslations } from "next-intl";
import type { PointerEventHandler, ReactElement } from "react";
import type { ProjectorSceneData } from "../model/projector-mode";
import { IDENTITY_PLACEMENT, placementTransform, type Placements } from "../model/placement";
import {
  patternTransform,
  verificationSquare,
  type ProjectorView,
  type Viewport,
} from "../model/projector-view";
import type { ProjectorCalibration } from "../projector.schema";

/** Width of the stitch dash and its gap, in screen px. */
const STITCH_DASH_PX = "10 6";
/** Keeps a line exactly as wide as the toolbar says, whatever the X and Y factors are. */
const LINE = { vectorEffect: "non-scaling-stroke" } as const;
/** Space between the verification square and its text, in px. */
const SQUARE_LABEL_GAP_PX = 8;
/** Text of the verification square. */
const SQUARE_LABEL = "10 cm";

/** Props of {@link ProjectorCanvas}. */
export interface ProjectorCanvasProps {
  /** The pattern scene to draw. */
  readonly scene: ProjectorSceneData;
  /** The calibration of this device. */
  readonly calibration: ProjectorCalibration;
  /** Pan, mirror, line width and colour. */
  readonly view: ProjectorView;
  /** The canvas size in px. */
  readonly viewport: Viewport;
  /** Ids of the pieces to draw, or all of them. */
  readonly visiblePieceIds: readonly string[] | "all";
  /** Where pieces were moved to. */
  readonly placements: Placements;
  /** The piece being moved, if any. */
  readonly activePieceId: string | null;
  /** Called when a pointer goes down on a piece. */
  readonly onPiecePointerDown?: (id: string, event: Parameters<PointerEventHandler>[0]) => void;
}

/**
 * One piece: cut line, stitch line, grain line, notches and labels.
 *
 * @param props - The piece and its placement.
 * @param props.piece - The scene piece.
 * @param props.transform - Its placement transform.
 * @param props.active - Whether it is the piece being moved.
 * @param props.onPointerDown - Pointer handler.
 * @returns The piece group.
 */
function PieceLines({
  piece,
  transform,
  active,
  onPointerDown,
}: Readonly<{
  piece: ScenePiece;
  transform: string;
  active: boolean;
  onPointerDown?: PointerEventHandler;
}>): ReactElement {
  return (
    <g
      data-piece-id={piece.id}
      data-active={active || undefined}
      transform={transform === "" ? undefined : transform}
      onPointerDown={onPointerDown}
    >
      <path data-layer="cut" data-width-mm={piece.bboxMm.widthMm} d={piece.cutD} fill="none" {...LINE} />
      <path data-layer="stitch" d={piece.stitchD} fill="none" strokeDasharray={STITCH_DASH_PX} {...LINE} />
      <g data-layer="notches" fill="none">
        <path d={piece.grainD} {...LINE} />
        {piece.notches.map((n) => (
          <path key={n.id} d={n.d} {...LINE} />
        ))}
      </g>
      <g data-layer="labels" fill="currentColor" stroke="none" textAnchor="middle">
        {piece.labels.map((label) => (
          <text
            key={label.id}
            x={label.at.x}
            y={label.at.y}
            fontSize={label.sizeMm}
            direction="rtl"
            unicodeBidi="plaintext"
            transform={
              label.rotationDeg === 0 ? undefined : `rotate(${label.rotationDeg} ${label.at.x} ${label.at.y})`
            }
          >
            {label.text.ar}
          </text>
        ))}
      </g>
    </g>
  );
}

/**
 * The verification square with its "10 cm" text.
 *
 * @param props - Calibration and canvas size.
 * @param props.calibration - The calibration.
 * @param props.viewport - The canvas size.
 * @returns The square, outside the pattern group.
 */
function VerificationSquare({
  calibration,
  viewport,
}: Readonly<Pick<ProjectorCanvasProps, "calibration" | "viewport">>): ReactElement {
  const r = verificationSquare(calibration, viewport);
  return (
    <g data-testid="verification-square" className="text-saffron">
      <rect
        x={r.x}
        y={r.y}
        width={r.widthPx}
        height={r.heightPx}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={r.x + r.widthPx + SQUARE_LABEL_GAP_PX}
        y={r.y + r.heightPx}
        fill="currentColor"
        fontSize={14}
        direction="ltr"
      >
        {SQUARE_LABEL}
      </text>
    </g>
  );
}

/**
 * Draws the pattern at 1:1 for the calibration.
 *
 * @param props - See {@link ProjectorCanvasProps}.
 * @returns The SVG, always left to right.
 */
export function ProjectorCanvas(props: Readonly<ProjectorCanvasProps>): ReactElement {
  const t = useTranslations("projector.view");
  const { scene, calibration, view, viewport, visiblePieceIds, placements, activePieceId } = props;
  const pieces =
    visiblePieceIds === "all" ? scene.pieces : scene.pieces.filter((p) => visiblePieceIds.includes(p.id));
  return (
    <div dir="ltr" data-testid="projector-canvas">
      <svg
        width={viewport.widthPx}
        height={viewport.heightPx}
        role="img"
        aria-label={t("canvas")}
        className={`block touch-none select-none ${view.color === "yellow" ? "text-saffron" : "text-surface"}`}
      >
        <g
          data-testid="pattern-group"
          transform={patternTransform(calibration, view, viewport, scene)}
          stroke="currentColor"
          style={{ strokeWidth: `${view.lineWidthPx}px` }}
        >
          {scene.lines?.map((line) => (
            <path
              key={`${line.kind}-${line.d}`}
              data-layer={line.kind}
              d={line.d}
              fill="none"
              strokeDasharray={line.kind === "selvedge" ? STITCH_DASH_PX : undefined}
              {...LINE}
            />
          ))}
          {pieces.map((piece) => (
            <PieceLines
              key={piece.id}
              piece={piece}
              transform={placementTransform(piece, placements[piece.id] ?? IDENTITY_PLACEMENT)}
              active={piece.id === activePieceId}
              onPointerDown={
                props.onPiecePointerDown ? (e) => props.onPiecePointerDown?.(piece.id, e) : undefined
              }
            />
          ))}
        </g>
        <VerificationSquare calibration={calibration} viewport={viewport} />
      </svg>
    </div>
  );
}
