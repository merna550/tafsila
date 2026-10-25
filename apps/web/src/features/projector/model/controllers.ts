/** Controller shapes the projector hooks return and the components read; pure types, so components never import hooks (issue #285). */

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
