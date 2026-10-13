/** The admin users route: composes the admin-users feature. */
import type { ReactElement } from "react";
import { AdminUsersScreen } from "@/features/admin-users";

/**
 * Renders the users list with the stat tiles.
 *
 * @returns The page.
 */
export default function AdminUsersPage(): ReactElement {
  return <AdminUsersScreen />;
}
