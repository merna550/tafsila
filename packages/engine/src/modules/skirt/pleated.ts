/**
 * Knife-pleated skirt (issue #137, FR-PAT-05). Method: Aldrich, Chapter 3, "Pleated skirts": a rectangle whose width is
 * the finished waist plus twice the pleat depth for every pleat; the pleats are spaced evenly so the waist closes to
 * waist + ease. Each pleat is a fold line laid onto its placement line, shown by an arrow (decision 137).
 */
import type { Mark } from "@tafsila/schemas";
import {
  KNIFE_PLEAT_COUNT,
  KNIFE_PLEAT_DEPTH_MM,
  MIN_PLEATS_PER_PANEL,
  PLEAT_ARROW_DROP_MM,
} from "../../constants/skirt-fullness";
import { pt } from "../../geometry";
import { withPiece } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { fullnessClosureRule } from "./fullness-rule";
import {
  type Band,
  finishedWaistMm,
  panelPiece,
  panelPlan,
  panelsRound,
  SKIRT_PANEL_NAMES,
  skirtLengthMm,
  slotsOf,
} from "./panels";

/** Fabric each knife pleat takes out of the waist: the pleat folds twice its depth into a double layer. */
export const PLEAT_INTAKE_MM = 2 * KNIFE_PLEAT_DEPTH_MM;

/**
 * Pleats on one panel so the whole skirt has about `KNIFE_PLEAT_COUNT`, never fewer than `MIN_PLEATS_PER_PANEL`.
 *
 * @param round - How many panels make the full circumference.
 * @returns Pleats per panel.
 */
export function pleatsPerPanel(round: number): number {
  return Math.max(MIN_PLEATS_PER_PANEL, Math.round(KNIFE_PLEAT_COUNT / round));
}

/** Where one pleat sits on a panel, x from the panel's centre (or left) edge, in mm. */
export interface PleatPosition {
  /** The placement line the fold is laid on. */
  readonly placementXMm: number;
  /** The fold line. */
  readonly foldXMm: number;
}

/**
 * Even pleat positions on a panel whose finished (pleated) width is `finishedMm`: half a space, then pleat, space,
 * pleat, ..., half a space, so pleats on joined panels stay evenly spaced.
 *
 * @param finishedMm - Panel width after pleating.
 * @param count - Pleats on the panel.
 * @returns Pleat positions, centre edge first.
 */
export function pleatPositions(finishedMm: number, count: number): PleatPosition[] {
  const spaceMm = finishedMm / count;
  return Array.from({ length: count }, (_, i) => {
    const placementXMm = spaceMm / 2 + i * (spaceMm + PLEAT_INTAKE_MM);
    return { placementXMm, foldXMm: placementXMm + PLEAT_INTAKE_MM };
  });
}

/**
 * The three marks of one pleat: fold line, placement line (both full length) and the direction arrow at the waist.
 *
 * @param pleat - Pleat position.
 * @param index - Pleat number on the panel, from 1.
 * @param heightMm - Panel height.
 * @returns The marks.
 */
function pleatMarks(pleat: PleatPosition, index: number, heightMm: number): Mark[] {
  const id = `pleat-${index}`;
  const { foldXMm: f, placementXMm: p } = pleat;
  return [
    { id: `${id}-fold`, kind: "pleat-fold", shape: "line", from: pt(f, 0), to: pt(f, heightMm) },
    { id: `${id}-placement`, kind: "pleat-placement", shape: "line", from: pt(p, 0), to: pt(p, heightMm) },
    {
      id: `${id}-direction`,
      kind: "pleat-direction",
      shape: "arrow",
      edgeId: "waist",
      from: pt(f, PLEAT_ARROW_DROP_MM),
      to: pt(p, PLEAT_ARROW_DROP_MM),
      text: { ar: "اطوي الخط على الخط", en: "Fold line to line" },
    },
  ];
}

/** Knife-pleated skirt: rectangle panels with evenly spaced pleats closing to waist + ease. */
export const pleatedSkirtModule: FeatureModule = {
  id: "skirt-pleated",
  order: 10,
  appliesTo: (spec) => spec.skirt?.type === "pleated",
  draft: (ctx) => {
    const finishedMm = finishedWaistMm(ctx);
    const heightMm = skirtLengthMm(ctx);
    const plan = panelPlan(ctx, finishedMm + KNIFE_PLEAT_COUNT * PLEAT_INTAKE_MM);
    const round = panelsRound(plan);
    const count = pleatsPerPanel(round);
    const band: Band = {
      id: "skirt",
      names: SKIRT_PANEL_NAMES,
      circumferenceMm: finishedMm + round * count * PLEAT_INTAKE_MM,
      heightMm,
      topEdgeId: "waist",
      bottomEdgeId: "hem",
    };
    const marks = pleatPositions(finishedMm / round, count).flatMap((pleat, i) =>
      pleatMarks(pleat, i + 1, heightMm),
    );
    return slotsOf(plan).reduce((acc, slot) => withPiece(acc, panelPiece(band, slot, plan, { marks })), ctx);
  },
  validations: [fullnessClosureRule],
};
