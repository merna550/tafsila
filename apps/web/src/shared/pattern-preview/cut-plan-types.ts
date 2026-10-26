/**
 * The direct-cut checklist as the page uses it (issue #291). Plain JSON, so it crosses the worker boundary. The worker
 * fills it from the engine's `cutSteps` in one adapter (`cut-plan.ts`); nothing in `apps/web` knows the engine's own type.
 */

/** One text in both languages. */
export interface LocalizedText {
  /** Arabic text. */
  readonly ar: string;
  /** English text. */
  readonly en: string;
}

/** A point in mm, in the piece's diagram frame (the top-left of the cut line is 0,0). */
export interface PlanPoint {
  /** Horizontal position, mm. */
  readonly x: number;
  /** Vertical position, mm. */
  readonly y: number;
}

/** A marked point of a piece, as shown in the steps. */
export interface CutPlanPoint {
  /** The label shown in the steps ("A", "B", ...), unique in the piece. */
  readonly id: string;
  /** The label (same as `id`). */
  readonly label: string;
  /** Where the point is. */
  readonly at: PlanPoint;
}

/** A distance segment drawn for the current step: it ends at the marked point and carries its length. */
export interface CutPlanGuide {
  /** Where the segment starts (on the reference or the top line). */
  readonly from: PlanPoint;
  /** Where it ends (at the marked point). */
  readonly to: PlanPoint;
  /** Its length, mm, as the step text measures it. */
  readonly mm: number;
}

/** Which small diagram of the printed sheet a step belongs to. */
export type CutStepGroup = "corners" | "curves" | "marks";

/** One numbered step of a piece. */
export interface CutPlanStep {
  /** Stable for one version, curve step and engine version: `<pieceId>#<engine step number>`. */
  readonly id: string;
  /** Number shown to the tailor, 1..n without gaps. */
  readonly no: number;
  /** The full sentence, cm already in it. */
  readonly text: LocalizedText;
  /** The points this step marks or connects. */
  readonly pointIds: readonly string[];
  /** The distance segments drawn while the step is current (issue #292); empty for connecting steps. */
  readonly guides: readonly CutPlanGuide[];
  /** The printed diagram the step belongs to. */
  readonly group: CutStepGroup;
}

/** A reference line of the diagram. */
export interface CutPlanLine {
  /** Line id. */
  readonly id: string;
  /** Fold, grain-parallel reference or the top line. */
  readonly kind: "fold" | "grain" | "top";
  /** Start. */
  readonly from: PlanPoint;
  /** End. */
  readonly to: PlanPoint;
}

/** Everything the checklist shows for one piece. */
export interface CutPiecePlan {
  /** Piece id. */
  readonly pieceId: string;
  /** Piece name. */
  readonly name: LocalizedText;
  /** How many to cut. */
  readonly cutCount: number;
  /** True when the piece is cut on the fold. */
  readonly onFold: boolean;
  /** Where the distances are measured from, in words and as drawn lines. */
  readonly reference: { readonly text: LocalizedText; readonly lines: readonly CutPlanLine[] };
  /** The marked points. */
  readonly points: readonly CutPlanPoint[];
  /** The steps to tick, in order. */
  readonly steps: readonly CutPlanStep[];
  /** The reference drawing: the box and the cut line as an SVG path. */
  readonly diagram: { readonly widthMm: number; readonly heightMm: number; readonly outlineD: string };
}

/** The checklist of a whole pattern. */
export interface CutPlan {
  /** Engine version that drafted the pattern, printed on the sheet. */
  readonly engineVersion: string;
  /** Gap between curve points, mm. */
  readonly curveStepMm: number;
  /** One entry per piece. */
  readonly pieces: readonly CutPiecePlan[];
}
