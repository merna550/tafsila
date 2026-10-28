/** The "new fabric" route: composes the fabric editor without an id. */
import type { ReactElement } from "react";
import { AdminFabricEditScreen } from "@/features/admin-fabrics";

/**
 * Renders the empty fabric form.
 *
 * @returns The page.
 */
export default function AdminNewFabricPage(): ReactElement {
  return <AdminFabricEditScreen />;
}
