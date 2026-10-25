/** The new design route: composes the category step with the optional client from the URL. */
import type { ReactElement } from "react";
import { CategoryStepScreen, parseEditorQuery } from "@/features/design-picker";

/**
 * Renders the category step.
 *
 * @param props - Route props.
 * @param props.searchParams - Holds `clientId`.
 * @returns The page.
 */
export default async function NewDesignPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>): Promise<ReactElement> {
  const { clientId } = parseEditorQuery(await searchParams);
  return <CategoryStepScreen {...(clientId === undefined ? {} : { clientId })} />;
}
