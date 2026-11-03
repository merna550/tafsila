/** The /designs/[id]/confirm route: composes the confirmation screen. */
import type { ReactElement } from "react";
import { ConfirmScreen } from "@/features/confirm-design";

/**
 * Renders the confirmation screen of one design.
 *
 * @param props - Route props.
 * @param props.params - Holds the design id.
 * @returns The page.
 */
export default async function ConfirmPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<ReactElement> {
  const { id } = await params;
  return <ConfirmScreen designId={id} />;
}
