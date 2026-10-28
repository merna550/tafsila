/** The admin recommendation rules route: composes the admin-fabrics feature. */
import type { ReactElement } from "react";
import { AdminFabricRulesScreen } from "@/features/admin-fabrics";

/**
 * Renders the rule list.
 *
 * @returns The page.
 */
export default function AdminFabricRulesPage(): ReactElement {
  return <AdminFabricRulesScreen />;
}
