/** The pattern page route: composes the pattern page with the id and the client from the URL. */
import type { ReactElement } from "react";
import { parseEditorQuery } from "@/features/design-picker";
import { PatternPageScreen } from "@/features/pattern-page";

/**
 * Renders the pattern page of one design.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id.
 * @param props.searchParams - Holds `clientId`.
 * @returns The page.
 */
export default async function DesignPatternPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>): Promise<ReactElement> {
  const { id } = await params;
  const { clientId } = parseEditorQuery(await searchParams);
  return <PatternPageScreen designId={id} {...(clientId === undefined ? {} : { clientId })} />;
}
