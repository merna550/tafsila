/** What an export is made from: the stored inputs of a saved version and the text printed on the file (issue #289). */
import type { PatternVersionDetail } from "@tafsila/schemas";
import { versionPreviewInput } from "@/features/pattern-versions";
import type { ExportJob } from "@/shared/pattern-export";

/** The part of an export job that does not depend on the chosen file. */
export type ExportSource = Omit<ExportJob, "kind">;

/**
 * Builds the source of an export from a saved version.
 *
 * @param input - The version, the design title and the client name (empty when there is none).
 * @returns The inputs and the print meta; the version's own creation time fixes the file's date.
 */
export function exportSourceOf(input: {
  readonly version: PatternVersionDetail["version"];
  readonly title: string;
  readonly clientLabel: string;
}): ExportSource {
  const { version, title, clientLabel } = input;
  return {
    input: versionPreviewInput(version),
    meta: {
      title,
      versionNo: version.versionNo,
      clientLabel,
      engineVersion: version.engineVersion,
      createdAt: version.createdAt,
    },
  };
}
