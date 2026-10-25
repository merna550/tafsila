/** The value of the pattern options panel and the pure rules around it (issue #247). All lengths are in mm. */
import { EASE_TOTAL_MM } from "@tafsila/engine/measurements";
import {
  DEFAULT_FABRIC_WIDTH_MM,
  DEFAULT_SEAM_ALLOWANCE_MM,
  defaultSeamAllowanceMm,
  edgeKindSchema,
  type EaseProfile,
  type EdgeKind,
  type MeasurementSet,
  type PatternVersion,
} from "@tafsila/schemas";
import { mmToCm } from "@tafsila/utils";

/** What the panel edits; the pattern page keeps it in its state and passes it back in. */
export interface PatternOptionsValue {
  /** The chosen client, or null before one is chosen. */
  readonly clientId: string | null;
  /** The chosen measurement set, or null. */
  readonly measurementSetId: string | null;
  /** Ease preference. */
  readonly easeProfile: EaseProfile;
  /** Seam allowance per edge kind. */
  readonly seamAllowanceMm: Readonly<Record<EdgeKind, number>>;
  /** Fabric width. */
  readonly fabricWidthMm: number;
}

/** The ease preferences in the order they are shown. */
export const EASE_PROFILES: readonly EaseProfile[] = ["fitted", "regular", "loose"];

/** The edge kinds in the order they are shown. */
export const EDGE_KINDS: readonly EdgeKind[] = edgeKindSchema.options;

/**
 * The options of a new pattern: regular ease, the default seam allowances and a 140 cm fabric.
 *
 * @returns Fresh options with no client.
 */
export function defaultPatternOptions(): PatternOptionsValue {
  return {
    clientId: null,
    measurementSetId: null,
    easeProfile: "regular",
    seamAllowanceMm: defaultSeamAllowanceMm(),
    fabricWidthMm: DEFAULT_FABRIC_WIDTH_MM,
  };
}

/**
 * The bust, waist and hip ease of a preference, as the engine has them.
 *
 * @param profile - Ease preference.
 * @returns Centimetres over the whole circumference.
 */
export function easeRows(profile: EaseProfile): { bust: number; waist: number; hip: number } {
  const table = EASE_TOTAL_MM[profile];
  return { bust: mmToCm(table.bust), waist: mmToCm(table.waist), hip: mmToCm(table.hip) };
}

/**
 * Reads the options stored with a saved version (used to open a design and to restore a version).
 *
 * @param version - The version; stored options that are missing or odd fall back to the defaults.
 * @param clientId - The client of the design, when known.
 * @returns The panel value.
 */
export function fromVersion(version: PatternVersion, clientId: string | null = null): PatternOptionsValue {
  const defaults = defaultPatternOptions();
  const stored = version.options as {
    seamAllowance?: { defaultsMm?: Partial<Record<EdgeKind, number>> };
    fabricWidthMm?: number;
  };
  const seam = { ...defaults.seamAllowanceMm };
  for (const kind of EDGE_KINDS) {
    const mm = stored.seamAllowance?.defaultsMm?.[kind];
    if (typeof mm === "number") seam[kind] = mm;
  }
  return {
    ...defaults,
    clientId,
    measurementSetId: version.measurementSetId,
    easeProfile: version.easeProfile,
    seamAllowanceMm: seam,
    fabricWidthMm: typeof stored.fabricWidthMm === "number" ? stored.fabricWidthMm : defaults.fabricWidthMm,
  };
}

/**
 * The newest set of a list (the API returns newest first).
 *
 * @param sets - A client's sets.
 * @returns The newest, or undefined for none.
 */
export function newestSet(sets: readonly MeasurementSet[]): MeasurementSet | undefined {
  return sets[0];
}

/**
 * Chooses a client: her newest set is chosen too, and a previous set of another client is dropped.
 *
 * @param value - Current options.
 * @param clientId - The new client.
 * @param sets - The new client's sets once loaded.
 * @returns The new options.
 */
export function withClient(
  value: PatternOptionsValue,
  clientId: string | null,
  sets: readonly MeasurementSet[] = [],
): PatternOptionsValue {
  return { ...value, clientId, measurementSetId: newestSet(sets)?.id ?? null };
}

/**
 * Sets one seam allowance.
 *
 * @param value - Current options.
 * @param kind - Edge kind.
 * @param mm - New allowance in mm.
 * @returns The new options.
 */
export function withSeamAllowance(
  value: PatternOptionsValue,
  kind: EdgeKind,
  mm: number,
): PatternOptionsValue {
  return { ...value, seamAllowanceMm: { ...value.seamAllowanceMm, [kind]: mm } };
}

/**
 * The default seam allowance of an edge kind.
 *
 * @param kind - Edge kind.
 * @returns Millimetres.
 */
export function defaultAllowanceFor(kind: EdgeKind): number {
  return DEFAULT_SEAM_ALLOWANCE_MM[kind];
}

/**
 * True when every seam allowance is at its default.
 *
 * @param value - Current options.
 * @returns Whether "reset all" would change nothing.
 */
export function isDefaultSeamAllowance(value: PatternOptionsValue): boolean {
  return EDGE_KINDS.every((kind) => value.seamAllowanceMm[kind] === DEFAULT_SEAM_ALLOWANCE_MM[kind]);
}

/**
 * Decides what the panel chooses by itself: the `?clientId=` client while none is chosen, then the newest set.
 *
 * @param value - Current options.
 * @param preselectClientId - Client from the URL, or null.
 * @param sets - The chosen client's sets once loaded, newest first.
 * @returns The options to apply, or null when nothing should change.
 */
export function autoSelection(
  value: PatternOptionsValue,
  preselectClientId: string | null,
  sets: readonly MeasurementSet[],
): PatternOptionsValue | null {
  if (value.clientId === null)
    return preselectClientId === null ? null : withClient(value, preselectClientId);
  const newest = newestSet(sets);
  return value.measurementSetId === null && newest ? { ...value, measurementSetId: newest.id } : null;
}
