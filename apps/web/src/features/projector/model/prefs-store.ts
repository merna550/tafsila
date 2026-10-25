/** Reads and writes the line width and colour of the projector view for this device; failures read as the defaults (issue #286). */
import { readJson, writeJson } from "@/shared/storage/safe-storage";
import { projectorPrefsSchema, type ProjectorPrefs } from "../projector.schema";

/** The `localStorage` key of the view settings. */
export const PREFS_KEY = "tafsila.projector.view";

/**
 * Reads the stored settings.
 *
 * @returns The settings, or null when nothing valid is stored.
 */
export function readPrefs(): ProjectorPrefs | null {
  const parsed = projectorPrefsSchema.safeParse(readJson(PREFS_KEY));
  return parsed.success ? parsed.data : null;
}

/**
 * Stores the settings.
 *
 * @param lineWidthPx - Line width.
 * @param color - Line colour.
 * @returns False when the browser refused.
 */
export function writePrefs(lineWidthPx: number, color: ProjectorPrefs["color"]): boolean {
  return writeJson(PREFS_KEY, { version: 1, lineWidthPx, color } satisfies ProjectorPrefs);
}
