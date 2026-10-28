"use client";
/** The black full-screen frame shared by the pattern and the layout projector: stage, toolbar, side panel, messages and keyboard help (issues #286, #321). */
import { useCallback, useState, type ReactElement, type ReactNode } from "react";
import { KeyboardHelp } from "./components/KeyboardHelp";
import { ProjectorMessage } from "./components/ProjectorMessages";
import { ProjectorToolbar } from "./components/ProjectorToolbar";
import { ProjectorStage } from "./ProjectorStage";
import { useFullscreen } from "./hooks/use-fullscreen";
import { useProjectorActions } from "./hooks/use-projector-actions";
import { useProjectorKeys } from "./hooks/use-projector-keys";
import type { ProjectorViewController } from "./hooks/use-projector-view";
import { useVersionLine } from "./hooks/use-version-line";
import type { ProjectorScene } from "./hooks/use-projector-scene";
import type { ApiError } from "@/shared/api";
import type { FabricKind } from "@/shared/fabric-nesting";
import { layoutQuery } from "./model/projector-mode";
import type { PiecesController } from "./model/controllers";
import type { ProjectorSceneData } from "./model/projector-mode";
import type { ProjectorCalibration } from "./projector.schema";

/** Props of {@link ProjectorFrame}. */
interface ProjectorFrameProps {
  /** Design id from the URL. */
  readonly designId: string;
  /** Version id from the URL. */
  readonly versionId: string;
  /** The calibration, or null while it is read. */
  readonly calibration: ProjectorCalibration | null;
  /** The loaded version, if any. */
  readonly version: ProjectorScene["version"];
  /** The scene to draw, if ready. */
  readonly scene: ProjectorSceneData | undefined;
  /** Why loading failed, if it did. */
  readonly failure: ApiError | null;
  /** True until the scene is ready. */
  readonly loading: boolean;
  /** The view controller. */
  readonly projector: ProjectorViewController;
  /** The piece controller. */
  readonly pieces: PiecesController;
  /** The content of the side panel, shown while the panel is open and a scene exists. */
  readonly panel: ReactNode;
  /** The fabric kind in layout mode; the calibration page then returns to the layout. */
  readonly layout?: FabricKind;
  /** Replaces the loading text. */
  readonly loadingText?: string;
  /** A message shown instead of the loading line (for example "calculate first"). */
  readonly notice?: ReactNode;
}

/**
 * The notice, or the loading line, or the failure over the canvas.
 *
 * @param props - The frame props and where "Exit" goes.
 * @returns The message, or nothing when the scene is shown.
 */
function FrameMessage(props: Readonly<ProjectorFrameProps & { exitHref: string }>): ReactElement | null {
  if (props.notice) return <>{props.notice}</>;
  if (!props.loading && props.failure === null) return null;
  return (
    <ProjectorMessage
      failed={props.failure !== null}
      exitHref={props.exitHref}
      loadingText={props.loadingText}
    />
  );
}

/**
 * Renders the frame; the caller chooses the scene, the controllers and the panel.
 *
 * @param props - See {@link ProjectorFrameProps}.
 * @returns The screen.
 */
export function ProjectorFrame(props: Readonly<ProjectorFrameProps>): ReactElement {
  const { designId, versionId, calibration, scene, projector, pieces } = props;
  const versionHref = `/designs/${designId}/versions/${versionId}`;
  const fullscreen = useFullscreen();
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  useProjectorKeys(useProjectorActions(projector, fullscreen, pieces, openHelp), !helpOpen);
  const versionLine = useVersionLine(designId, props.version);

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
          recalibrateHref={`${versionHref}/projector/calibrate${layoutQuery(props.layout)}`}
          exitHref={versionHref}
          onMirror={projector.toggleMirror}
          onLineWidth={projector.setLineWidth}
          onColor={projector.setColor}
          onHelp={openHelp}
        />
      ) : null}
      {calibration && scene && pieces.panelOpen ? (
        <aside className="absolute end-4 top-20 z-sticky flex w-64 flex-col gap-3 text-surface">
          {props.panel}
        </aside>
      ) : null}
      {calibration ? <FrameMessage {...props} exitHref={versionHref} /> : null}
      {helpOpen ? <KeyboardHelp onClose={closeHelp} /> : null}
    </div>
  );
}
