/** The direct-cut route: composes the checklist screen with the design and version ids. */
import type { ReactElement } from "react";
import { DirectCutScreen } from "@/features/direct-cut";

/**
 * Renders the direct-cut checklist of one saved version.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id and the version id.
 * @returns The page.
 */
export default async function DirectCutPage({
  params,
}: Readonly<{ params: Promise<{ id: string; versionId: string }> }>): Promise<ReactElement> {
  const { id, versionId } = await params;
  return <DirectCutScreen designId={id} versionId={versionId} />;
}
