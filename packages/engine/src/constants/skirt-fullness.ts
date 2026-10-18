/**
 * Constants of the panel skirts: gathered, knife-pleated and tiered (issue #137, decision 137). Sources: Aldrich,
 * Metric Pattern Cutting for Women's Wear, Chapter 3 ("Skirts with gathers", "Pleated skirts", "Tiered skirts"); the
 * numbers are the usual starting values and are confirmed or changed by the sew-tests in `docs/test-cases/engine/sew-tests.md`.
 */
import type { DesignSpec } from "@tafsila/schemas";

/** A skirt type of the design spec. */
export type SkirtType = NonNullable<DesignSpec["skirt"]>["type"];

/** Skirt types drawn from rectangle panels instead of the straight skirt block. */
export const PANEL_SKIRT_TYPES: readonly SkirtType[] = ["gathered", "pleated", "tiered"];

/**
 * Whether a skirt type is drawn from rectangle panels (so it does not start from the straight block).
 *
 * @param type - Skirt type from the spec.
 * @returns True for gathered, pleated and tiered.
 */
export function isPanelSkirt(type: SkirtType): boolean {
  return PANEL_SKIRT_TYPES.includes(type);
}

/** Fabric weights the gather ratio depends on. */
export type FabricWeight = "light" | "medium" | "heavy";

/**
 * Gathered width over finished width per fabric weight: light fabric takes more fullness, heavy fabric less before it
 * gets bulky at the seam (Aldrich: 1.5 to 2 times).
 */
export const GATHER_RATIO_BY_WEIGHT: Readonly<Record<FabricWeight, number>> = {
  light: 2,
  medium: 1.8,
  heavy: 1.5,
};

/** The spec has no fabric weight yet, so the gathered skirt uses the medium ratio (1.8, as the issue asks). */
export const DEFAULT_FABRIC_WEIGHT: FabricWeight = "medium";

/** Depth of one knife pleat, in mm: each pleat takes twice this out of the waist. */
export const KNIFE_PLEAT_DEPTH_MM = 30;

/** Knife pleats on the whole skirt (four per quarter), spaced evenly round the waist. */
export const KNIFE_PLEAT_COUNT = 16;

/** Fewest knife pleats on one panel, so a narrow panel still has a pleat to fold. */
export const MIN_PLEATS_PER_PANEL = 1;

/** Length of the pleat direction arrow is the pleat intake; it is drawn this far below the waist, in mm. */
export const PLEAT_ARROW_DROP_MM = 40;

/** Each tier is this many times wider than the one above it; tier 1 is this many times the finished waist. */
export const TIER_WIDTH_RATIO = 1.5;

/** Share of the skirt length each tier takes, top to bottom: three tiers, each a little deeper so the hem hangs. Sums to 1. */
export const TIER_HEIGHT_SHARE = { top: 0.3, middle: 0.33, bottom: 0.37 } as const;

/** The tier shares in drafting order, top first. */
export const TIER_HEIGHT_SHARES: readonly number[] = [
  TIER_HEIGHT_SHARE.top,
  TIER_HEIGHT_SHARE.middle,
  TIER_HEIGHT_SHARE.bottom,
];

/** Most panels per half (front or back) before the engine gives up splitting and only warns (FR-VAL-08). */
export const MAX_PANELS_PER_HALF = 8;

/** Where the grain line starts and ends on a panel, as a share of the panel height. */
export const PANEL_GRAIN_LINE_SHARE = { from: 0.2, to: 0.8 } as const;

/** Where the grain line sits across a panel, as a share of the panel width from the left (centre) edge. */
export const PANEL_GRAIN_X_SHARE = 0.25;
