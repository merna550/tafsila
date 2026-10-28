/** The admin fabric catalogue route: composes the admin-fabrics feature. */
import type { ReactElement } from "react";
import { AdminFabricsScreen } from "@/features/admin-fabrics";

/**
 * Renders the fabric list.
 *
 * @returns The page.
 */
export default function AdminFabricsPage(): ReactElement {
  return <AdminFabricsScreen />;
}
