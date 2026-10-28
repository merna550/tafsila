"use client";
/** The area the canvas fills: measures itself, turns a mouse drag into a pan (or a piece move when it starts on a piece) and draws the canvas once the scene is ready (issue #286). */
import { useRef, type ReactElement } from "react";
import { useDragPan } from "./hooks/use-drag-pan";
import { useViewportSize } from "./hooks/use-viewport-size";
import { pxToMm, type ProjectorView } from "./model/projector-view";
import type { PiecesController } from "./model/controllers";
import type { ProjectorSceneData } from "./model/projector-mode";
import type { ProjectorCalibration } from "./projector.schema";
import { ProjectorCanvas } from "./components/ProjectorCanvas";

/** Props of {@link ProjectorStage}. */
interface ProjectorStageProps {
  /** The scene, or undefined while it is drafted. */
  readonly scene: ProjectorSceneData | undefined;
  /** The calibration, or null while it is read. */
  readonly calibration: ProjectorCalibration | null;
  /** Pan, mirror, line width and colour. */
  readonly view: ProjectorView;
  /** Moves the pattern by screen mm. */
  readonly onPan: (dxMm: number, dyMm: number) => void;
  /** Which pieces are drawn, where they sit and which one is active. */
  readonly pieces: PiecesController;
}

/**
 * Renders the stage.
 *
 * @param props - See {@link ProjectorStageProps}.
 * @returns The stage with the canvas inside.
 */
export function ProjectorStage({
  scene,
  calibration,
  view,
  onPan,
  pieces,
}: Readonly<ProjectorStageProps>): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const viewport = useViewportSize(ref);
  const dragged = useRef<string | null>(null);
  const drag = useDragPan(
    (dx, dy) => (dragged.current === null ? onPan(dx, dy) : pieces.move(dragged.current, { x: dx, y: dy })),
    (dx, dy) => (calibration ? pxToMm(calibration, { x: dx, y: dy }) : null),
  );
  /**
   * Starts moving a piece; the stage's own handler then sees the same press.
   *
   * @param id - The piece under the pointer.
   */
  const onPiecePointerDown = (id: string): void => {
    dragged.current = id;
    pieces.activate(id);
  };
  return (
    <div
      ref={ref}
      className="absolute inset-0"
      {...drag}
      onPointerUp={() => {
        dragged.current = null;
        drag.onPointerUp();
      }}
    >
      {scene && calibration ? (
        <ProjectorCanvas
          scene={scene}
          calibration={calibration}
          view={view}
          viewport={viewport}
          visiblePieceIds={pieces.visible}
          placements={pieces.state.placements}
          activePieceId={pieces.state.activePieceId}
          onPiecePointerDown={onPiecePointerDown}
        />
      ) : null}
    </div>
  );
}
