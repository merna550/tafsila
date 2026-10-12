/** The clients list route: composes the clients feature. */
import type { ReactElement } from "react";
import { ClientsScreen } from "@/features/clients";

/**
 * Renders the clients list.
 *
 * @returns The page.
 */
export default function ClientsPage(): ReactElement {
  return <ClientsScreen />;
}
