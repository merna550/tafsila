/** The drawing area: the grid and every piece, moved and scaled by the viewport (issue #243). */
import type { ReactElement } from "react";
import { gridPaths } from "../model/scene-selectors";
import type { PatternScene, ViewerLayers, ViewerTarget, Viewport } from "../model/types";
import { ScenePieceView } from "./ScenePieceView";

/** Props of {@link ViewerCanvas}. */
interface ViewerCanvasProps {
  /** What to draw. */
  readonly scene: PatternScene;
  /** Layers shown. */
  readonly layers: ViewerLayers;
  /** Selected piece id. */
  readonly selectedPieceId: string | null;
  /** Highlighted targets. */
  readonly highlight: readonly ViewerTarget[];
  /** Zoom and pan. */
  readonly viewport: Viewport;
  /** Accessible name of the drawing. */
  readonly label: string;
}

/**
 * Draws the sheet. The group is in mm, so lines carry `non-scaling-stroke` to stay thin at any zoom.
 *
 * @param props - Component props.
 * @returns The `<svg>`.
 */
export function ViewerCanvas({
  scene,
  layers,
  selectedPieceId,
  highlight,
  viewport,
  label,
}: Readonly<ViewerCanvasProps>): ReactElement {
  const grid = layers.grid ? gridPaths(scene) : null;
  return (
    <svg width="100%" height="100%" role="img" aria-label={label} className="block select-none">
      <g transform={`translate(${viewport.tx} ${viewport.ty}) scale(${viewport.zoom})`}>
        {grid ? (
          <g data-layer="grid" fill="none" className="stroke-line">
            <path
              d={grid.minor}
              strokeWidth={0.5}
              opacity={0.5}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
            <path d={grid.major} strokeWidth={1} style={{ vectorEffect: "non-scaling-stroke" }} />
          </g>
        ) : null}
        {scene.pieces.map((piece) => (
          <ScenePieceView
            key={piece.id}
            piece={piece}
            layers={layers}
            selected={piece.id === selectedPieceId}
            highlight={highlight}
          />
        ))}
      </g>
    </svg>
  );
}
