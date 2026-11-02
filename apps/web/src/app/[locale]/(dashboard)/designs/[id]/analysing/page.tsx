/** The /designs/[id]/analysing route: composes the analysing screen. */
import type { ReactElement } from "react";
import { AnalysingScreen } from "@/features/upload-design";

/**
 * Renders the analysing screen of one design.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id.
 * @returns The page.
 */
export default async function AnalysingPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<ReactElement> {
  const { id } = await params;
  return <AnalysingScreen designId={id} />;
}
