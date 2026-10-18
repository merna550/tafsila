/**
 * Gathered skirt (issue #137, FR-PAT-05). Method: Aldrich, Chapter 3, "Gathered skirt": a rectangle of the finished
 * length, its width the finished waist times the gather ratio, gathered to the waist. Decision 137.
 */
import { DEFAULT_FABRIC_WEIGHT, GATHER_RATIO_BY_WEIGHT } from "../../constants/skirt-fullness";
import { withPiece } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { fullnessClosureRule } from "./fullness-rule";
import {
  type Band,
  finishedWaistMm,
  gatherMark,
  panelPiece,
  panelPlan,
  panelWidthMm,
  skirtLengthMm,
  SKIRT_PANEL_NAMES,
  slotsOf,
} from "./panels";

/** Gathered width over finished width for the gathered skirt. */
export const GATHERED_SKIRT_RATIO = GATHER_RATIO_BY_WEIGHT[DEFAULT_FABRIC_WEIGHT];

/** Gathered skirt: rectangle panels whose waist is gathered to waist + ease. */
export const gatheredSkirtModule: FeatureModule = {
  id: "skirt-gathered",
  order: 10,
  appliesTo: (spec) => spec.skirt?.type === "gathered",
  draft: (ctx) => {
    const circumferenceMm = finishedWaistMm(ctx) * GATHERED_SKIRT_RATIO;
    const band: Band = {
      id: "skirt",
      names: SKIRT_PANEL_NAMES,
      circumferenceMm,
      heightMm: skirtLengthMm(ctx),
      topEdgeId: "waist",
      bottomEdgeId: "hem",
    };
    const plan = panelPlan(ctx, () => circumferenceMm);
    const widthMm = panelWidthMm(band, plan);
    const marks = [gatherMark(band.topEdgeId, widthMm, widthMm / GATHERED_SKIRT_RATIO)];
    return slotsOf(plan).reduce((acc, slot) => withPiece(acc, panelPiece(band, slot, plan, { marks })), ctx);
  },
  validations: [fullnessClosureRule],
};
