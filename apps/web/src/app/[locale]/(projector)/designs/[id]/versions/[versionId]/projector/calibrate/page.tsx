/** The projector calibration route: composes the calibration screen with the design and version ids. */
import type { ReactElement } from "react";
import { CalibrationScreen, parseLayoutKind } from "@/features/projector";

/**
 * Renders the calibration screen of one saved version.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id and the version id.
 * @param props.searchParams - The optional `layout` kind to return to.
 * @returns The page.
 */
export default async function ProjectorCalibratePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string; versionId: string }>;
  searchParams: Promise<{ layout?: string | string[] }>;
}>): Promise<ReactElement> {
  const { id, versionId } = await params;
  const { layout } = await searchParams;
  return <CalibrationScreen designId={id} versionId={versionId} layout={parseLayoutKind(layout)} />;
}
