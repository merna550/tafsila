/** The projector route: composes the projector screen with the design and version ids. */
import type { ReactElement } from "react";
import { ProjectorScreen } from "@/features/projector";

/**
 * Renders the 1:1 projector view of one saved version.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id and the version id.
 * @returns The page.
 */
export default async function ProjectorPage({
  params,
}: Readonly<{ params: Promise<{ id: string; versionId: string }> }>): Promise<ReactElement> {
  const { id, versionId } = await params;
  return <ProjectorScreen designId={id} versionId={versionId} />;
}
