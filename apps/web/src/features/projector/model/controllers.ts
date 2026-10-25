/** Controller shapes the projector hooks return and the components read; pure types, so components never import hooks (issue #285). */
import type { Point } from "@tafsila/schemas";
import type { PlacementState } from "./placement";

/** The message a field or the form shows: keys of `projector.calibrate.errors`. */
export type CalibrationErrorKey = "invalid" | "range" | "storage";

/** What `useCalibrationForm` returns returns. */
export interface CalibrationFormController {
  /** Typed measured width (mm). */
  readonly width: string;
  /** Typed measured height (mm). */
  readonly height: string;
  /** Sets the width text and clears its error. */
  readonly setWidth: (text: string) => void;
  /** Sets the height text and clears its error. */
  readonly setHeight: (text: string) => void;
  /** Error of the width field, if any. */
  readonly widthError: CalibrationErrorKey | null;
  /** Error of the height field, if any. */
  readonly heightError: CalibrationErrorKey | null;
  /** Set when the browser refused to store the result. */
  readonly storageError: boolean;
  /** Computes and stores the calibration; true when it was stored. */
  readonly submit: () => boolean;
}

/** What `useFullscreen` returns returns. */
export interface FullscreenController {
  /** False where the Fullscreen API is missing; the button is then hidden. */
  readonly supported: boolean;
  /** True while the page is fullscreen. */
  readonly isFullscreen: boolean;
  /** Enters fullscreen; call it from a click. */
  readonly enter: () => void;
  /** Leaves fullscreen. */
  readonly exit: () => void;
}

/** What `useProjectorPieces` returns: the piece state for the canvas and the actions of keys, panel and pointer (issue #287). */
export interface PiecesController {
  /** Selection, active piece and placements. */
  readonly state: PlacementState;
  /** The ids the canvas draws, or all. */
  readonly visible: readonly string[] | "all";
  /** True while the piece list is open. */
  readonly panelOpen: boolean;
  /** Opens or closes the piece list. */
  readonly togglePanel: () => void;
  /** Shows one piece, makes it active and centres it once. */
  readonly choose: (id: string) => void;
  /** Shows every piece. */
  readonly showAll: () => void;
  /** Chooses the next or the previous piece. */
  readonly step: (by: 1 | -1) => void;
  /** Makes a piece active or none. */
  readonly activate: (id: string | null) => void;
  /** Moves the active piece by a screen move; false when none is active. */
  readonly moveActive: (deltaMm: Point) => boolean;
  /** Moves a given piece by a screen move. */
  readonly move: (id: string, deltaMm: Point) => void;
  /** Turns the active piece by 180 degrees; false when none is active. */
  readonly rotateActive: () => boolean;
  /** Puts everything back and pans back to the default. */
  readonly reset: () => void;
}
