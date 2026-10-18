/**
 * Tiered skirt (issue #137, FR-PAT-05). Method: Aldrich, Chapter 3, "Tiered skirt": stacked rectangles, each
 * `TIER_WIDTH_RATIO` times wider than the one above, each gathered onto the one above; tier 1 is gathered to the
 * waist. Every tier seam declares its gathering as intended ease, so FR-VAL-01 checks it (decision 137).
 */
import type { Edge, Mark } from "@tafsila/schemas";
import { TIER_HEIGHT_SHARES, TIER_WIDTH_RATIO } from "../../constants/skirt-fullness";
import { withPiece } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { fullnessClosureRule } from "./fullness-rule";
import {
  type Band,
  finishedWaistMm,
  gatherMark,
  type PanelPlan,
  panelId,
  panelPiece,
  panelPlan,
  type PanelSlot,
  panelWidthMm,
  skirtLengthMm,
  slotsOf,
} from "./panels";

/**
 * The tiers of a skirt, top first.
 *
 * @param finishedMm - Finished waist.
 * @param lengthMm - Skirt length.
 * @returns One band per tier.
 */
export function tierBands(finishedMm: number, lengthMm: number): Band[] {
  const last = TIER_HEIGHT_SHARES.length;
  return TIER_HEIGHT_SHARES.map((share, i) => {
    const n = i + 1;
    return {
      id: `tier-${n}`,
      names: {
        front: { ar: `الطبقة ${n} - أمام`, en: `Tier ${n} front` },
        back: { ar: `الطبقة ${n} - خلف`, en: `Tier ${n} back` },
        panel: { ar: `الطبقة ${n} - قطعة`, en: `Tier ${n} panel` },
      },
      circumferenceMm: finishedMm * TIER_WIDTH_RATIO ** n,
      heightMm: lengthMm * share,
      topEdgeId: n === 1 ? "waist" : "top",
      bottomEdgeId: n === last ? "hem" : "bottom",
    };
  });
}

/**
 * The tier seam pairing from one band's edge to the neighbour band's, with the gathering as intended ease
 * (this panel's width minus the neighbour's).
 *
 * @param band - This band.
 * @param neighbour - The band it is sewn to, or none.
 * @param edgeId - The neighbour's edge.
 * @param cut - Slot and cutting plan.
 * @param cut.slot - Slot.
 * @param cut.plan - Cutting plan.
 * @returns The pairing, or undefined at the waist and hem.
 */
function tierPair(
  band: Band,
  neighbour: Band | undefined,
  edgeId: string,
  { slot, plan }: { slot: PanelSlot; plan: PanelPlan },
): Edge["pairsWith"] {
  if (!neighbour) return undefined;
  return {
    pieceId: panelId(neighbour.id, slot),
    edgeId,
    intendedEaseMm: panelWidthMm(band, plan) - panelWidthMm(neighbour, plan),
  };
}

/** Tiered skirt: three gathered tiers, panels split at the widest tier. */
export const tieredSkirtModule: FeatureModule = {
  id: "skirt-tiered",
  order: 10,
  appliesTo: (spec) => spec.skirt?.type === "tiered",
  draft: (ctx) => {
    const bands = tierBands(finishedWaistMm(ctx), skirtLengthMm(ctx));
    const widestMm = bands.at(-1)!.circumferenceMm;
    const plan = panelPlan(ctx, () => widestMm);
    return bands.reduce((outer, band, i) => {
      const widthMm = panelWidthMm(band, plan);
      const marks: Mark[] = [gatherMark(band.topEdgeId, widthMm, widthMm / TIER_WIDTH_RATIO)];
      return slotsOf(plan).reduce((acc, slot) => {
        const extras = {
          topPair: tierPair(band, bands[i - 1], "bottom", { slot, plan }),
          bottomPair: tierPair(band, bands[i + 1], "top", { slot, plan }),
          marks,
        };
        return withPiece(acc, panelPiece(band, slot, plan, extras));
      }, outer);
    }, ctx);
  },
  validations: [fullnessClosureRule],
};
