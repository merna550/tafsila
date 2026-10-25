/** Pattern options shared by the web preview and the API save, so both build identical engine options (FR-PAT-03). */
import { DEFAULT_SEAM_ALLOWANCE_MM, type EdgeKind, type EngineOptions } from "./engine-options";
import type { EaseProfile } from "./measurements";

/** Default fabric width in mm (140 cm). */
export const DEFAULT_FABRIC_WIDTH_MM = 1400;

/** Narrowest and widest fabric the panel accepts, in mm (50 to 300 cm). */
export const FABRIC_WIDTH_LIMITS_MM = { min: 500, max: 3000 } as const;

/** Smallest and largest seam allowance the panel accepts, in mm (0 to 5 cm). */
export const SEAM_ALLOWANCE_LIMITS_MM = { min: 0, max: 50 } as const;

/** The inputs of the options panel that go into the engine options besides the ease profile. */
export interface PatternOptionsInput {
  /** Seam allowance per edge kind, in mm. */
  readonly seamAllowanceMm: Readonly<Record<EdgeKind, number>>;
  /** Fabric width in mm. */
  readonly fabricWidthMm: number;
}

/** The part of a measurement set the engine options need. */
export interface OptionsSetSource {
  /** Name of the set. */
  readonly label: string;
  /** Size label the set started from, if any. */
  readonly sizeLabel: string | null;
}

/**
 * The default seam allowance of every edge kind.
 *
 * @returns A fresh object, safe to edit.
 */
export function defaultSeamAllowanceMm(): Record<EdgeKind, number> {
  return { ...DEFAULT_SEAM_ALLOWANCE_MM };
}

/**
 * Builds the engine options of a pattern: the size label is the set's size label, else its name.
 *
 * @param easeProfile - Chosen ease preference.
 * @param input - Seam allowance and fabric width.
 * @param set - The chosen measurement set.
 * @param clientName - Client name printed on the pieces; left out when empty.
 * @returns Options that pass `engineOptionsSchema`.
 */
export function buildEngineOptions(
  easeProfile: EaseProfile,
  input: PatternOptionsInput,
  set: OptionsSetSource,
  clientName?: string,
): EngineOptions {
  const clientLabel = clientName?.trim();
  return {
    easeProfile,
    seamAllowance: { defaultsMm: { ...input.seamAllowanceMm }, perEdgeMm: {} },
    fabricWidthMm: input.fabricWidthMm,
    sizeLabel: set.sizeLabel ?? set.label,
    ...(clientLabel ? { clientLabel } : {}),
  };
}
