"use client";
/** The /designs/[id]/versions/[versionId]/projector screen: the saved pattern at 1:1 for the calibrated projector (issue #286), or with `layout` the fabric marker (issue #321). */
import type { ReactElement } from "react";
import { LayoutProjector } from "./LayoutProjector";
import { PieceSwitcher } from "./components/PieceSwitcher";
import { PlacementControls } from "./components/PlacementControls";
import { ProjectorFrame } from "./ProjectorFrame";
import { useCalibrationGuard } from "./hooks/use-calibration-guard";
import { useProjectorPieces } from "./hooks/use-projector-pieces";
import { useProjectorScene } from "./hooks/use-projector-scene";
import { useProjectorView } from "./hooks/use-projector-view";
import type { FabricKind } from "@/shared/fabric-nesting";

/** Props of {@link ProjectorScreen}. */
interface ProjectorScreenProps {
  /** Design id from the URL. */
  readonly designId: string;
  /** Version id from the URL. */
  readonly versionId: string;
  /** The fabric kind whose marker to project; absent for the pattern pieces. */
  readonly layout?: FabricKind | null;
}

/**
 * The pattern pieces of one version.
 *
 * @param props - Design and version ids.
 * @returns The screen.
 */
function PatternProjector({ designId, versionId }: Readonly<ProjectorScreenProps>): ReactElement {
  const calibration = useCalibrationGuard(`/designs/${designId}/versions/${versionId}/projector/calibrate`);
  const { version, scene, failure, loading } = useProjectorScene(versionId);
  const projector = useProjectorView();
  const pieces = useProjectorPieces(versionId, scene, projector);
  return (
    <ProjectorFrame
      designId={designId}
      versionId={versionId}
      calibration={calibration}
      version={version}
      scene={scene}
      failure={failure}
      loading={loading}
      projector={projector}
      pieces={pieces}
      panel={
        scene ? (
          <>
            <PieceSwitcher
              scene={scene}
              selection={pieces.state.selection}
              onChoose={pieces.choose}
              onAll={pieces.showAll}
              onStep={pieces.step}
            />
            <PlacementControls
              hasActive={pieces.state.activePieceId !== null}
              onRotate={pieces.rotateActive}
              onReset={pieces.reset}
            />
          </>
        ) : null
      }
    />
  );
}

/**
 * Chooses the pattern or the layout projector from the route.
 *
 * @param props - Design id, version id and the optional layout kind.
 * @returns The screen.
 */
export function ProjectorScreen(props: Readonly<ProjectorScreenProps>): ReactElement {
  return props.layout ? (
    <LayoutProjector designId={props.designId} versionId={props.versionId} kind={props.layout} />
  ) : (
    <PatternProjector designId={props.designId} versionId={props.versionId} />
  );
}
