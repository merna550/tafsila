/** The designs list route: composes the designs feature with the optional client filter from the URL. */
import type { ReactElement } from "react";
import { parseEditorQuery } from "@/features/design-picker";
import { DesignsScreen } from "@/features/designs";

/**
 * Renders the designs list.
 *
 * @param props - Route props.
 * @param props.searchParams - Holds `clientId`.
 * @returns The page.
 */
export default async function DesignsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>): Promise<ReactElement> {
  const { clientId } = parseEditorQuery(await searchParams);
  return <DesignsScreen {...(clientId === undefined ? {} : { clientId })} />;
}
