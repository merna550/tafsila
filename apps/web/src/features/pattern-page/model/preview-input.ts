/** Builds the input of the live preview from the page's spec, options and chosen measurement set. */
import {
  buildEngineOptions,
  type DesignSpec,
  type EngineOptions,
  type MeasurementSet,
} from "@tafsila/schemas";
import type { PatternOptionsValue } from "@/features/pattern-options";
import type { PreviewInput } from "@/shared/pattern-preview";

/** The inputs the server needs to save, besides the spec. */
export interface PreviewSources {
  /** The spec being edited. */
  readonly spec: DesignSpec | null;
  /** The options panel value. */
  readonly options: PatternOptionsValue;
  /** The chosen measurement set, once loaded. */
  readonly set: MeasurementSet | undefined;
  /** The chosen client's name, printed on the pieces. */
  readonly clientName?: string;
}

/**
 * The engine options of the page: the browser and the server both build them with `buildEngineOptions`, so a saved
 * version and the preview hash the same inputs.
 *
 * @param sources - Options, set and client name.
 * @returns The engine options, or null without a chosen set.
 */
export function buildPageEngineOptions(sources: Omit<PreviewSources, "spec">): EngineOptions | null {
  const { options, set, clientName } = sources;
  if (set === undefined) return null;
  return buildEngineOptions(
    options.easeProfile,
    { seamAllowanceMm: options.seamAllowanceMm, fabricWidthMm: options.fabricWidthMm },
    { label: set.label, sizeLabel: set.sizeLabel },
    clientName,
  );
}

/**
 * Builds what the worker drafts: the live measurements of the chosen set, so client and server hash the same inputs.
 *
 * @param sources - Spec, options, set and client name.
 * @returns The preview input, or null while the spec or the set is missing.
 */
export function buildPreviewInput(sources: PreviewSources): PreviewInput | null {
  const options = buildPageEngineOptions(sources);
  if (sources.spec === null || sources.set === undefined || options === null) return null;
  return { spec: sources.spec, measurements: sources.set.measurements, options };
}
