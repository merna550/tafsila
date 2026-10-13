/** The admin user detail route: composes the admin-users feature with the id from the URL. */
import type { ReactElement } from "react";
import { AdminUserScreen } from "@/features/admin-users";

/**
 * Renders one user's read-only detail.
 *
 * @param props - Route params.
 * @param props.params - Holds the user id.
 * @returns The page.
 */
export default async function AdminUserPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<ReactElement> {
  const { id } = await params;
  return <AdminUserScreen id={id} />;
}
