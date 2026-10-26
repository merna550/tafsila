"use client";
/** The /designs/[id]/versions/[versionId]/projector screen: the saved pattern at 1:1 for the calibrated projector (issue #286). */
import { useCallback, useState, type ReactElement } from "react";
import { PieceSwitcher } from "./components/PieceSwitcher";
import { PlacementControls } from "./components/PlacementControls";
import { KeyboardHelp } from "./components/KeyboardHelp";
import { ProjectorMessage } from "./components/ProjectorMessages";
import { ProjectorStage } from "./ProjectorStage";
import { ProjectorToolbar } from "./components/ProjectorToolbar";
import { useCalibrationGuard } from "./hooks/use-calibration-guard";
import { useFullscreen } from "./hooks/use-fullscreen";
import { useProjectorActions } from "./hooks/use-projector-actions";
import { useProjectorKeys } from "./hooks/use-projector-keys";
import { useProjectorPieces } from "./hooks/use-projector-pieces";
import { useProjectorScene } from "./hooks/use-projector-scene";
import { useProjectorView } from "./hooks/use-projector-view";
import { useVersionLine } from "./hooks/use-version-line";

/** Props of {@link ProjectorScreen}. */
interface ProjectorScreenProps {
  /** Design id from the URL. */
  readonly designId: string;
  /** Version id from the URL. */
  readonly versionId: string;
}

/**
 * Connects the hooks to the stage and the toolbar, and sends the user to calibrate when this device has no valid calibration.
 *
 * @param props - Design and version ids.
 * @returns The screen.
 */
export function ProjectorScreen({ designId, versionId }: Readonly<ProjectorScreenProps>): ReactElement {
  const versionHref = `/designs/${designId}/versions/${versionId}`;
  const calibration = useCalibrationGuard(`${versionHref}/projector/calibrate`);
  const { version, scene, failure, loading } = useProjectorScene(versionId);
  const projector = useProjectorView();
  const fullscreen = useFullscreen();
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const pieces = useProjectorPieces(versionId, scene, projector);
  useProjectorKeys(useProjectorActions(projector, fullscreen, pieces, openHelp), !helpOpen);
  const versionLine = useVersionLine(designId, version);

  return (
    <div className="fixed inset-0 z-modal overflow-hidden bg-stage text-surface">
      <ProjectorStage
        scene={scene}
        calibration={calibration}
        view={projector.view}
        onPan={projector.pan}
        pieces={pieces}
      />
      {calibration ? (
        <ProjectorToolbar
          versionLine={versionLine}
          view={projector.view}
          fullscreen={fullscreen}
          recalibrateHref={`${versionHref}/projector/calibrate`}
          exitHref={versionHref}
          onMirror={projector.toggleMirror}
          onLineWidth={projector.setLineWidth}
          onColor={projector.setColor}
          onHelp={openHelp}
        />
      ) : null}
      {calibration && scene && pieces.panelOpen ? (
        <aside className="absolute end-4 top-20 z-sticky flex w-64 flex-col gap-3 text-surface">
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
        </aside>
      ) : null}
      {calibration && (loading || failure) ? (
        <ProjectorMessage failed={failure !== null} exitHref={versionHref} />
      ) : null}
      {helpOpen ? <KeyboardHelp onClose={closeHelp} /> : null}
    </div>
  );
}
