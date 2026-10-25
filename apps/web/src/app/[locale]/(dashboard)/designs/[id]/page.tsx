/** The design editor route: composes the editor frame with the id and URL parameters. */
import type { ReactElement } from "react";
import { DesignEditorScreen, parseEditorQuery } from "@/features/design-picker";
import { PatternLink } from "@/features/pattern-page";

/**
 * Renders the editor of one design.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id.
 * @param props.searchParams - Holds `clientId` and `section`.
 * @returns The page.
 */
export default async function DesignEditorPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>): Promise<ReactElement> {
  const { id } = await params;
  const query = parseEditorQuery(await searchParams);
  return (
    <DesignEditorScreen id={id} query={query}>
      <PatternLink designId={id} {...(query.clientId === undefined ? {} : { clientId: query.clientId })} />
    </DesignEditorScreen>
  );
}
