/** The inputs a saved version is drafted from; shared by the read-only version page and the projector (issue #286). */
import type { PatternVersionDetail } from "@tafsila/schemas";
import type { PreviewInput } from "@/shared/pattern-preview";

/**
 * Takes the stored spec, measurements and options of a version as the input of a preview run. The ease profile and size
 * label are stored beside the options, and the server adds them back the same way before it drafts.
 *
 * @param version - The saved version.
 * @returns The input for the preview worker.
 */
export function versionPreviewInput(version: PatternVersionDetail["version"]): PreviewInput {
  return {
    spec: version.spec,
    measurements: version.measurements,
    options: {
      ...version.options,
      easeProfile: version.easeProfile,
      sizeLabel: version.sizeLabel ?? "unknown",
    },
  };
}
