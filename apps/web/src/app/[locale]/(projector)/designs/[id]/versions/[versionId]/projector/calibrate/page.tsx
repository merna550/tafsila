/** The projector calibration route: composes the calibration screen with the design and version ids. */
import type { ReactElement } from "react";
import { CalibrationScreen } from "@/features/projector";

/**
 * Renders the calibration screen of one saved version.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id and the version id.
 * @returns The page.
 */
export default async function ProjectorCalibratePage({
  params,
}: Readonly<{ params: Promise<{ id: string; versionId: string }> }>): Promise<ReactElement> {
  const { id, versionId } = await params;
  return <CalibrationScreen designId={id} versionId={versionId} />;
}
