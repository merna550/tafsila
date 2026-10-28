/** The projector route: composes the projector screen with the design and version ids. */
import type { ReactElement } from "react";
import { parseLayoutKind, ProjectorScreen } from "@/features/projector";

/**
 * Renders the 1:1 projector view of one saved version.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id and the version id.
 * @param props.searchParams - The optional `layout` kind that switches to the fabric marker.
 * @returns The page.
 */
export default async function ProjectorPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string; versionId: string }>;
  searchParams: Promise<{ layout?: string | string[] }>;
}>): Promise<ReactElement> {
  const { id, versionId } = await params;
  const { layout } = await searchParams;
  return <ProjectorScreen designId={id} versionId={versionId} layout={parseLayoutKind(layout)} />;
}
