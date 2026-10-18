/**
 * Rectangle panels shared by the gathered, knife-pleated and tiered skirts (issue #137, decision 137). Method: Aldrich,
 * Metric Pattern Cutting for Women's Wear, Chapter 3: these skirts are rectangles of the finished length whose top is
 * gathered or pleated to the waist, so no block is traced. Panels split at the fabric width (FR-VAL-08).
 */
import {
  DEFAULT_SEAM_ALLOWANCE_MM,
  type Edge,
  type EngineOptions,
  type Mark,
  type Piece,
} from "@tafsila/schemas";
import {
  MAX_PANELS_PER_HALF,
  PANEL_GRAIN_LINE_SHARE,
  PANEL_GRAIN_X_SHARE,
} from "../../constants/skirt-fullness";
import { DraftingError } from "../../errors/drafting-error";
import { lineSeg, pt } from "../../geometry";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import type { ResolvedDraftInputs } from "../../resolve/types";

/** Where a panel sits: the front or back half cut on the fold, or one of the equal panels of a split skirt. */
export type PanelSlot = "front" | "back" | "panel";

/** A quarter of a circumference: a half cut on the fold. */
const QUARTER = 4;

/** Index of each side in a panel stitch path: top (centre to side), side, bottom (side to centre), centre. */
export const PANEL_SEGMENT = { top: 0, side: 1, bottom: 2, centre: 3 } as const;

/** One horizontal band of a skirt (the whole skirt, or one tier), drawn all round the body. */
export interface Band {
  /** Prefix of the piece ids: `skirt` gives `skirt-front`, `tier-2` gives `tier-2-panel`. */
  readonly id: string;
  /** Bilingual piece name for each slot. */
  readonly names: Readonly<Record<PanelSlot, Piece["name"]>>;
  /** Flat width of the band all round the body, in mm. */
  readonly circumferenceMm: number;
  /** Height of the band, in mm. */
  readonly heightMm: number;
  /** Id of the top edge (`waist` or `top`). */
  readonly topEdgeId: string;
  /** Id of the bottom edge (`hem` or `bottom`). */
  readonly bottomEdgeId: string;
}

/** Piece names of the one-band skirts (copy glossary: تنورة = skirt). */
export const SKIRT_PANEL_NAMES: Band["names"] = {
  front: { ar: "أمام التنورة", en: "Skirt front" },
  back: { ar: "خلف التنورة", en: "Skirt back" },
  panel: { ar: "قطعة التنورة", en: "Skirt panel" },
};

/** How a skirt is cut: the same for every band so tier seams pair one panel with one panel. */
export interface PanelPlan {
  /** Panels in each half; 1 means front and back are cut on the fold. */
  readonly panelsPerHalf: number;
  /** True when the back has a centre-back seam (a centre-back zip); only used when `panelsPerHalf` is 1. */
  readonly centreBackSeam: boolean;
}

/** What a band's caller adds to one panel: pairings of the top and bottom edges, and marks. */
export interface PanelExtras {
  /** Pairing of the top edge (a tier seam). */
  readonly topPair?: Edge["pairsWith"];
  /** Pairing of the bottom edge (a tier seam). */
  readonly bottomPair?: Edge["pairsWith"];
  /** Construction marks in panel coordinates. */
  readonly marks: readonly Mark[];
}

/**
 * The resolved inputs: the pipeline's resolve step when it ran, else resolved here (as the straight block does).
 *
 * @param ctx - Current context.
 * @returns Resolved inputs.
 */
export function inputsOf(ctx: DraftContext): ResolvedDraftInputs {
  return ctx.inputs ?? resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options);
}

/**
 * Finished waist, whole circumference: waist plus total waist ease (what the gathers and pleats close to).
 *
 * @param ctx - Current context.
 * @returns Finished waist in mm.
 */
export function finishedWaistMm(ctx: DraftContext): number {
  return ctx.measurements.waist + inputsOf(ctx).totalEaseMm.waist;
}

/**
 * The resolved skirt length.
 *
 * @param ctx - Current context.
 * @returns Waist to hem in mm.
 * @throws {DraftingError} `SKIRT_LENGTH_MISSING` when no length was resolved (a programming error).
 */
export function skirtLengthMm(ctx: DraftContext): number {
  const lengthMm = inputsOf(ctx).skirtLengthMm;
  if (lengthMm === undefined) {
    throw new DraftingError("SKIRT_LENGTH_MISSING", "A panel skirt needs a resolved skirt length");
  }
  return lengthMm;
}

/**
 * Side seam allowance used to decide whether a panel fits across the fabric.
 *
 * @param options - Engine options.
 * @returns Allowance in mm.
 */
function sideAllowanceMm(options: EngineOptions): number {
  return options.seamAllowance.defaultsMm.side ?? DEFAULT_SEAM_ALLOWANCE_MM.side;
}

/**
 * The fewest panels per half so every panel, with its allowances, fits across the fabric. One panel means a half cut
 * on the fold (cut width = half the circumference plus two allowances). Past `MAX_PANELS_PER_HALF` the widest split
 * is kept and FR-VAL-08 warns.
 *
 * @param widestMm - Circumference of the widest band.
 * @param options - Engine options (fabric width and seam allowances).
 * @returns Panels per half.
 */
export function panelsPerHalf(widestMm: number, options: EngineOptions): number {
  const twoAllowancesMm = 2 * sideAllowanceMm(options);
  if (widestMm / 2 + twoAllowancesMm <= options.fabricWidthMm) return 1;
  for (let n = 2; n <= MAX_PANELS_PER_HALF; n += 1) {
    if (widestMm / (2 * n) + twoAllowancesMm <= options.fabricWidthMm) return n;
  }
  return MAX_PANELS_PER_HALF;
}

/**
 * The cutting plan for a skirt whose widest band has the given circumference.
 *
 * @param ctx - Current context.
 * @param widestMm - Circumference of the widest band.
 * @returns The plan.
 */
export function panelPlan(ctx: DraftContext, widestMm: number): PanelPlan {
  return {
    panelsPerHalf: panelsPerHalf(widestMm, ctx.options),
    centreBackSeam: ctx.spec.closure.position === "center-back",
  };
}

/**
 * The slots a plan cuts.
 *
 * @param plan - Cutting plan.
 * @returns Front and back, or the one repeated panel.
 */
export function slotsOf(plan: PanelPlan): readonly PanelSlot[] {
  return plan.panelsPerHalf === 1 ? ["front", "back"] : ["panel"];
}

/**
 * How many times one panel stands for the whole circumference (fold halves count twice).
 *
 * @param plan - Cutting plan.
 * @returns Quarters for front and back, else the panel count.
 */
export function panelsRound(plan: PanelPlan): number {
  return plan.panelsPerHalf === 1 ? QUARTER : 2 * plan.panelsPerHalf;
}

/**
 * Width of one panel of a band: a quarter (half of a half on the fold) or one of the split panels.
 *
 * @param band - The band.
 * @param plan - Cutting plan.
 * @returns Width in mm.
 */
export function panelWidthMm(band: Pick<Band, "circumferenceMm">, plan: PanelPlan): number {
  return band.circumferenceMm / panelsRound(plan);
}

/**
 * The piece id of a band panel.
 *
 * @param bandId - Band id.
 * @param slot - Slot.
 * @returns e.g. `tier-2-front`.
 */
export function panelId(bandId: string, slot: PanelSlot): string {
  return `${bandId}-${slot}`;
}

/**
 * Cut instructions of a slot.
 *
 * @param slot - Slot.
 * @param plan - Cutting plan.
 * @returns Front and back on the fold (back as a mirrored pair with a centre-back seam), or the panel count.
 */
function cutOf(slot: PanelSlot, plan: PanelPlan): Piece["cut"] {
  if (slot === "panel")
    return { quantity: 2 * plan.panelsPerHalf, onFold: false, mirror: false, fabric: "main" };
  return slot === "back" && plan.centreBackSeam
    ? { quantity: 2, onFold: false, mirror: true, fabric: "main" }
    : { quantity: 1, onFold: true, mirror: false, fabric: "main" };
}

/**
 * The segment range of a one-segment edge, before the finishing step writes its allowance.
 *
 * @param segment - Segment index.
 * @returns Edge range fields.
 */
function at(segment: number): Pick<Edge, "fromSegment" | "toSegment" | "seamAllowanceMm"> {
  return { fromSegment: segment, toSegment: segment, seamAllowanceMm: 0 };
}

/**
 * The two upright edges of a panel: side and centre for front and back, the two panel seams for a split skirt.
 *
 * @param bandId - Band id.
 * @param slot - Slot.
 * @param plan - Cutting plan.
 * @returns The side edge and the centre edge.
 */
function uprightEdges(bandId: string, slot: PanelSlot, plan: PanelPlan): [Edge, Edge] {
  const self = panelId(bandId, slot);
  if (slot === "panel") {
    return [
      {
        id: "seam-right",
        ...at(PANEL_SEGMENT.side),
        kind: "side",
        pairsWith: { pieceId: self, edgeId: "seam-left", intendedEaseMm: 0 },
      },
      {
        id: "seam-left",
        ...at(PANEL_SEGMENT.centre),
        kind: "side",
        pairsWith: { pieceId: self, edgeId: "seam-right", intendedEaseMm: 0 },
      },
    ];
  }
  const other: PanelSlot = slot === "front" ? "back" : "front";
  const centreIsSeam = slot === "back" && plan.centreBackSeam;
  return [
    {
      id: "side",
      ...at(PANEL_SEGMENT.side),
      kind: "side",
      pairsWith: { pieceId: panelId(bandId, other), edgeId: "side", intendedEaseMm: 0 },
    },
    {
      id: slot === "front" ? "cf" : "cb",
      ...at(PANEL_SEGMENT.centre),
      kind: centreIsSeam ? "other" : "fold",
      ...(centreIsSeam ? { pairsWith: { pieceId: self, edgeId: "cb", intendedEaseMm: 0 } } : {}),
    },
  ];
}

/**
 * The four named edges of a panel; seam allowances are written later by the finishing step.
 *
 * @param band - The band.
 * @param slot - Slot.
 * @param plan - Cutting plan.
 * @param extras - Tier-seam pairings.
 * @returns Edges in stitch-path order.
 */
function panelEdges(band: Band, slot: PanelSlot, plan: PanelPlan, extras: PanelExtras): Edge[] {
  const [side, centre] = uprightEdges(band.id, slot, plan);
  const top: Edge = {
    id: band.topEdgeId,
    fromSegment: PANEL_SEGMENT.top,
    toSegment: PANEL_SEGMENT.top,
    kind: "other",
    seamAllowanceMm: 0,
    ...(extras.topPair ? { pairsWith: extras.topPair } : {}),
  };
  const bottom: Edge = {
    id: band.bottomEdgeId,
    fromSegment: PANEL_SEGMENT.bottom,
    toSegment: PANEL_SEGMENT.bottom,
    kind: band.bottomEdgeId === "hem" ? "hem" : "other",
    seamAllowanceMm: 0,
    ...(extras.bottomPair ? { pairsWith: extras.bottomPair } : {}),
  };
  return [top, side, bottom, centre];
}

/**
 * Draws one rectangle panel: x from the centre (or left seam) edge, y down from the top edge.
 *
 * @param band - The band.
 * @param slot - Slot.
 * @param plan - Cutting plan.
 * @param extras - Pairings and marks.
 * @returns The piece, ready for the finishing step.
 */
export function panelPiece(band: Band, slot: PanelSlot, plan: PanelPlan, extras: PanelExtras): PieceDraft {
  const w = panelWidthMm(band, plan);
  const h = band.heightMm;
  const corners = [pt(0, 0), pt(w, 0), pt(w, h), pt(0, h)];
  const grainXMm = w * PANEL_GRAIN_X_SHARE;
  return {
    id: panelId(band.id, slot),
    name: band.names[slot],
    cut: cutOf(slot, plan),
    stitchPath: corners.map((from, i) => lineSeg(from, corners[(i + 1) % corners.length]!)),
    edges: panelEdges(band, slot, plan, extras),
    notches: [],
    bodyLines: [],
    grainLine: [pt(grainXMm, h * PANEL_GRAIN_LINE_SHARE.from), pt(grainXMm, h * PANEL_GRAIN_LINE_SHARE.to)],
    darts: [],
    marks: [...extras.marks],
  };
}

/**
 * A gather mark along a panel's top edge.
 *
 * @param edgeId - The top edge id.
 * @param widthMm - Panel width (the run that is gathered).
 * @param gatheredToMm - Length after gathering.
 * @returns The mark.
 */
export function gatherMark(edgeId: string, widthMm: number, gatheredToMm: number): Mark {
  const mm = Math.round(gatheredToMm);
  return {
    id: `gather-${edgeId}`,
    kind: "gather",
    shape: "line",
    edgeId,
    from: pt(0, 0),
    to: pt(widthMm, 0),
    lengthMm: gatheredToMm,
    text: { ar: `جمّعي إلى ${mm} مم`, en: `Gather to ${mm} mm` },
  };
}
