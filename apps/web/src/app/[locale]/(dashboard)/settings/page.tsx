/** The /settings route: composes the settings feature. */
import type { ReactElement } from "react";
import { SettingsScreen } from "@/features/settings";

/**
 * Renders the settings screen.
 *
 * @returns The page.
 */
export default function SettingsPage(): ReactElement {
  return <SettingsScreen />;
}
