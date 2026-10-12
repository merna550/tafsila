/** The client profile route: composes the clients feature with the id from the URL. */
import type { ReactElement } from "react";
import { ClientProfileScreen } from "@/features/clients";

/**
 * Renders one client's profile.
 *
 * @param props - Route params.
 * @param props.params - Holds the client id.
 * @returns The page.
 */
export default async function ClientProfilePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<ReactElement> {
  const { id } = await params;
  return <ClientProfileScreen id={id} />;
}
