/** The old-version route: composes the read-only version screen with the design and version ids. */
import type { ReactElement } from "react";
import { ReadOnlyVersionScreen } from "@/features/pattern-page";

/**
 * Renders one saved version, view only.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id and the version id.
 * @returns The page.
 */
export default async function DesignVersionPage({
  params,
}: Readonly<{ params: Promise<{ id: string; versionId: string }> }>): Promise<ReactElement> {
  const { id, versionId } = await params;
  return <ReadOnlyVersionScreen designId={id} versionId={versionId} />;
}
