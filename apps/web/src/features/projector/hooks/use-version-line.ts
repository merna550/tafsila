"use client";
/** The version line of the toolbar: design title, version number and engine version (ADR-281 item 1, issue #286). */
import { useTranslations } from "next-intl";
import { useDesign } from "@/features/design-picker";
import type { ProjectorScene } from "./use-projector-scene";

/**
 * Builds the line from the loaded version and the design title.
 *
 * @param designId - Design id from the URL.
 * @param version - The loaded version, if any.
 * @returns The line, or an empty string before the version loads.
 */
export function useVersionLine(designId: string, version: ProjectorScene["version"]): string {
  const t = useTranslations("projector.view");
  const design = useDesign(designId);
  if (!version) return "";
  return t("version", {
    title: design.data?.design.title ?? t("untitled"),
    n: version.versionNo,
    engine: version.engineVersion,
  });
}
