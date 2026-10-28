/** The fabric edit route: composes the fabric editor with the id from the URL. */
import type { ReactElement } from "react";
import { AdminFabricEditScreen } from "@/features/admin-fabrics";

/**
 * Renders the form of one fabric.
 *
 * @param props - Route params.
 * @param props.params - Holds the fabric id.
 * @returns The page.
 */
export default async function AdminFabricPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<ReactElement> {
  const { id } = await params;
  return <AdminFabricEditScreen id={id} />;
}
