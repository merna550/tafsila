/** The admin size chart route: composes the admin-sizes feature. */
import type { ReactElement } from "react";
import { AdminSizesScreen } from "@/features/admin-sizes";

/**
 * Renders the editable size chart.
 *
 * @returns The page.
 */
export default function AdminSizesPage(): ReactElement {
  return <AdminSizesScreen />;
}
