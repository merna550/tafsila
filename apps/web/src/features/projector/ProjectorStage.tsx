"use client";
/** The area the canvas fills: measures itself, turns a mouse drag into a pan and draws the canvas once the scene is ready (issue #286). */
import type { PatternScene } from "@tafsila/engine/viewer";
import { useRef, type ReactElement } from "react";
import { useDragPan } from "./hooks/use-drag-pan";
import { useViewportSize } from "./hooks/use-viewport-size";
import type { Placements } from "./model/placement";
import { pxToMm, type ProjectorView } from "./model/projector-view";
import type { ProjectorCalibration } from "./projector.schema";
import { ProjectorCanvas } from "./components/ProjectorCanvas";

/** No piece has been moved yet; #287 fills this. */
const NO_PLACEMENTS: Placements = {};

/** Props of {@link ProjectorStage}. */
interface ProjectorStageProps {
  /** The scene, or undefined while it is drafted. */
  readonly scene: PatternScene | undefined;
  /** The calibration, or null while it is read. */
  readonly calibration: ProjectorCalibration | null;
  /** Pan, mirror, line width and colour. */
  readonly view: ProjectorView;
  /** Moves the pattern by screen mm. */
  readonly onPan: (dxMm: number, dyMm: number) => void;
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
}: Readonly<ProjectorStageProps>): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const viewport = useViewportSize(ref);
  const drag = useDragPan(onPan, (dx, dy) => (calibration ? pxToMm(calibration, { x: dx, y: dy }) : null));
  return (
    <div ref={ref} className="absolute inset-0" {...drag}>
      {scene && calibration ? (
        <ProjectorCanvas
          scene={scene}
          calibration={calibration}
          view={view}
          viewport={viewport}
          visiblePieceIds="all"
          placements={NO_PLACEMENTS}
          activePieceId={null}
        />
      ) : null}
    </div>
  );
}
