"use client";
/** The actions of the "use this version" bar after the projector button: direct cut and export. */
import type { PatternVersionDetail } from "@tafsila/schemas";
import type { ReactElement } from "react";
import { DirectCutLink } from "@/features/direct-cut";
import { VersionExportButton } from "./VersionExportButton";

/** Props of {@link VersionUseActions}. */
interface VersionUseActionsProps {
  /** The version. */
  readonly version: PatternVersionDetail["version"];
  /** The design title, for the export file name. */
  readonly title: string;
  /** The version list page; the cut screen is below it. */
  readonly backHref: string;
  /** True when the engine failed on this version, so there is nothing to cut or export. */
  readonly failed: boolean;
}

/**
 * Renders the direct-cut entry and the export button.
 *
 * @param props - The version, the title, the route base and whether the draft failed.
 * @returns The two actions.
 */
export function VersionUseActions({
  version,
  title,
  backHref,
  failed,
}: Readonly<VersionUseActionsProps>): ReactElement {
  return (
    <>
      <DirectCutLink href={`${backHref}/${version.id}/cut`} disabled={failed} />
      <VersionExportButton version={version} title={title} />
    </>
  );
}
