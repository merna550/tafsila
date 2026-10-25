/** The version history route: composes the history screen with the design id. */
import type { ReactElement } from "react";
import { VersionHistoryScreen } from "@/features/pattern-page";

/**
 * Renders the version history of one design.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id.
 * @returns The page.
 */
export default async function DesignVersionsPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<ReactElement> {
  const { id } = await params;
  return <VersionHistoryScreen designId={id} />;
}
