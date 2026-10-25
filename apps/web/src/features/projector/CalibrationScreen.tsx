"use client";
/** The /designs/[id]/versions/[versionId]/projector/calibrate screen: measures the projected square and stores the factors for this device (issue #285). */
import { useState, type ReactElement } from "react";
import { CalibrationView } from "./components/CalibrationView";
import { useCalibration } from "./hooks/use-calibration";
import { useCalibrationForm } from "./hooks/use-calibration-form";
import { useFullscreen } from "./hooks/use-fullscreen";

/** Props of {@link CalibrationScreen}. */
interface CalibrationScreenProps {
  /** Design id from the URL. */
  readonly designId: string;
  /** Version id from the URL. */
  readonly versionId: string;
}

/**
 * Connects the calibration hooks to the page.
 *
 * @param props - Design and version ids.
 * @returns The screen.
 */
export function CalibrationScreen({ designId, versionId }: Readonly<CalibrationScreenProps>): ReactElement {
  const { state, screen, save } = useCalibration();
  const form = useCalibrationForm(screen, save);
  const fullscreen = useFullscreen();
  const [redoing, setRedoing] = useState(false);
  const versionHref = `/designs/${designId}/versions/${versionId}`;
  return (
    <CalibrationView
      backHref={versionHref}
      openHref={`${versionHref}/projector`}
      state={state}
      screen={screen}
      redoing={redoing}
      onRedo={() => setRedoing(true)}
      form={form}
      fullscreen={fullscreen}
      onSubmit={() => setRedoing(!form.submit() && redoing)}
    />
  );
}
