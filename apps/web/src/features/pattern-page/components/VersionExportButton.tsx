"use client";
/** The Export button of the read-only version view: finds the client name and hands the version to the export feature (issue #289). */
import type { PatternVersionDetail } from "@tafsila/schemas";
import { useMemo, type ReactElement } from "react";
import { useClient } from "@/features/clients";
import { useMeasurementSet } from "@/features/measurements";
import { ExportButton, exportSourceOf } from "@/features/pattern-export";

/** Props of {@link VersionExportButton}. */
interface VersionExportButtonProps {
  /** The loaded version. */
  readonly version: PatternVersionDetail["version"];
  /** The design title printed on the file. */
  readonly title: string;
}

/**
 * Renders the Export button for a saved version. The client name is empty while it loads or when the set has no client.
 *
 * @param props - The version and the title.
 * @returns The button.
 */
export function VersionExportButton({ version, title }: Readonly<VersionExportButtonProps>): ReactElement {
  const set = useMeasurementSet(version.measurementSetId ?? undefined);
  const client = useClient(set.data?.clientId ?? null);
  const clientLabel = client.data?.name ?? "";
  const source = useMemo(
    () => exportSourceOf({ version, title, clientLabel }),
    [version, title, clientLabel],
  );
  return <ExportButton source={source} />;
}
