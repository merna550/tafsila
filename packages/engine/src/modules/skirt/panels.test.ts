/** Unit tests of the panel skirt helpers: panel plans, pleats, tiers, gather marks and the waist closure (issue #137). */
import type { DesignSpec, Mark } from "@tafsila/schemas";
import { gatheredKneeSkirt, SIZE_MATRIX } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { KNIFE_PLEAT_COUNT, MAX_PANELS_PER_HALF, TIER_WIDTH_RATIO } from "../../constants/skirt-fullness";
import { pt } from "../../geometry";
import { createContext, type DraftContext, withInputs, withPiece } from "../../pipeline/draft-context";
import { DEFAULT_ENGINE_OPTIONS } from "../../pipeline/generate-pattern";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { closedWaistMm } from "../../pieces/waist-seam";
import { fullnessClosureRule } from "./fullness-rule";
import {
  type Band,
  finishedWaistMm,
  gatherMark,
  panelPiece,
  panelPlan,
  panelsRound,
  panelWidthMm,
  SKIRT_PANEL_NAMES,
  skirtLengthMm,
  slotsOf,
} from "./panels";
import { PLEAT_INTAKE_MM, pleatedCircumferenceMm, pleatPositions, pleatsPerPanel } from "./pleated";
import { tierBands } from "./tiered";

const sizeM = SIZE_MATRIX.find((e) => e.id === "size-m")!.measurements;

/**
 * A fresh context for a design and fabric width.
 *
 * @param spec - The design.
 * @param fabricWidthMm - Fabric width.
 * @returns The context, before any module ran.
 */
function contextFor(spec: DesignSpec = gatheredKneeSkirt, fabricWidthMm = 1500): DraftContext {
  return createContext(spec, sizeM, { ...DEFAULT_ENGINE_OPTIONS, fabricWidthMm });
}

const band: Band = {
  id: "skirt",
  names: SKIRT_PANEL_NAMES,
  circumferenceMm: 2000,
  heightMm: 600,
  topEdgeId: "waist",
  bottomEdgeId: "hem",
};

describe("panelPlan", () => {
  it("cuts front and back on the fold when half the band and two allowances fit", () => {
    const plan = panelPlan(contextFor(), () => 2000);
    expect(plan).toEqual({ panelsPerHalf: 1, centreBackSeam: false });
    expect(slotsOf(plan)).toEqual(["front", "back"]);
    expect(panelsRound(plan)).toBe(4);
  });

  it("splits into the fewest equal panels that fit", () => {
    const plan = panelPlan(contextFor(gatheredKneeSkirt, 900), () => 4000);
    expect(plan.panelsPerHalf).toBe(3);
    expect(slotsOf(plan)).toEqual(["panel"]);
    expect(panelWidthMm({ circumferenceMm: 4000 }, plan)).toBeCloseTo(4000 / 6, 9);
  });

  it("stops at the most panels and keeps that split when nothing fits", () => {
    expect(panelPlan(contextFor(gatheredKneeSkirt, 100), () => 4000).panelsPerHalf).toBe(MAX_PANELS_PER_HALF);
  });

  it("asks for the widest band of each split (pleat counts change with it)", () => {
    const asked: number[] = [];
    panelPlan(contextFor(gatheredKneeSkirt, 900), (round) => {
      asked.push(round);
      return 4000;
    });
    expect(asked).toEqual([4, 4, 6]);
  });

  it("gives the back a centre-back seam for a centre-back zip", () => {
    const spec: DesignSpec = { ...gatheredKneeSkirt, closure: { type: "zip", position: "center-back" } };
    const plan = panelPlan(contextFor(spec), () => 2000);
    const back = panelPiece(band, "back", plan, { marks: [] });
    expect(back.cut).toEqual({ quantity: 2, onFold: false, mirror: true, fabric: "main" });
    expect(back.edges.find((e) => e.id === "cb")).toMatchObject({
      kind: "other",
      pairsWith: { pieceId: "skirt-back", edgeId: "cb" },
    });
  });
});

describe("panelPiece", () => {
  it("draws a rectangle with top, side, bottom and centre edges", () => {
    const front = panelPiece(band, "front", { panelsPerHalf: 1, centreBackSeam: false }, { marks: [] });
    expect(front.stitchPath.map((s) => s.to)).toEqual([pt(500, 0), pt(500, 600), pt(0, 600), pt(0, 0)]);
    expect(front.edges.map((e) => [e.id, e.kind])).toEqual([
      ["waist", "other"],
      ["side", "side"],
      ["hem", "hem"],
      ["cf", "fold"],
    ]);
    expect(front.cut.onFold).toBe(true);
  });

  it("pairs the two seams of a split panel with each other", () => {
    const panel = panelPiece(band, "panel", { panelsPerHalf: 3, centreBackSeam: false }, { marks: [] });
    expect(panel.cut.quantity).toBe(6);
    expect(panel.edges.map((e) => e.pairsWith?.edgeId)).toEqual([
      undefined,
      "seam-left",
      undefined,
      "seam-right",
    ]);
  });
});

describe("gatherMark", () => {
  it("runs along the top edge and says what length to gather to", () => {
    const mark = gatherMark("waist", 900, 500.4);
    expect(mark).toMatchObject({ kind: "gather", shape: "line", edgeId: "waist", lengthMm: 500.4 });
    expect(mark.text).toEqual({ ar: "جمّعي إلى 500 مم", en: "Gather to 500 mm" });
  });
});

describe("knife pleats", () => {
  it("puts about 16 pleats on the skirt and at least one on a panel", () => {
    expect(pleatsPerPanel(4) * 4).toBe(KNIFE_PLEAT_COUNT);
    expect(pleatsPerPanel(40)).toBe(1);
  });

  it("adds each pleat's intake to the finished waist", () => {
    expect(pleatedCircumferenceMm(800, 4)).toBe(800 + KNIFE_PLEAT_COUNT * PLEAT_INTAKE_MM);
  });

  it("spaces pleats evenly: half a space, pleat, space, ..., half a space", () => {
    const [first, second] = pleatPositions(200, 2);
    expect(first).toEqual({ placementXMm: 50, foldXMm: 50 + PLEAT_INTAKE_MM });
    expect(second!.placementXMm - first!.foldXMm).toBe(100);
  });
});

describe("tierBands", () => {
  it("makes three tiers, each the ratio wider, with heights adding up to the length", () => {
    const tiers = tierBands(800, 700);
    expect(tiers.map((t) => t.id)).toEqual(["tier-1", "tier-2", "tier-3"]);
    expect(tiers[1]!.circumferenceMm / tiers[0]!.circumferenceMm).toBeCloseTo(TIER_WIDTH_RATIO, 9);
    expect(tiers.reduce((sum, t) => sum + t.heightMm, 0)).toBeCloseTo(700, 9);
    expect(tiers.map((t) => [t.topEdgeId, t.bottomEdgeId])).toEqual([
      ["waist", "bottom"],
      ["top", "bottom"],
      ["top", "hem"],
    ]);
  });
});

describe("panel context helpers", () => {
  it("resolves the finished waist and the length when the pipeline has not", () => {
    const ctx = contextFor();
    expect(finishedWaistMm(ctx)).toBeGreaterThan(sizeM.waist);
    expect(skirtLengthMm(ctx)).toBeGreaterThan(0);
  });

  it("refuses a design without a skirt length", () => {
    const ctx = contextFor();
    const inputs = resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options);
    expect(() => skirtLengthMm(withInputs(ctx, { ...inputs, skirtLengthMm: undefined }))).toThrow(
      /skirt length/,
    );
  });
});

describe("fullnessClosureRule", () => {
  const plan = { panelsPerHalf: 1, centreBackSeam: false } as const;

  it("folds pleat intakes away and gathers runs to their length", () => {
    const pleat: Mark = {
      id: "p",
      kind: "pleat-direction",
      shape: "arrow",
      edgeId: "waist",
      from: pt(10, 40),
      to: pt(70, 40),
    };
    const dot: Mark = { id: "d", kind: "pleat-fold", shape: "point", edgeId: "waist", at: pt(0, 0) };
    const piece = panelPiece(band, "front", plan, { marks: [pleat, dot, gatherMark("waist", 500, 300)] });
    expect(closedWaistMm(piece)).toBeCloseTo(500 - 60 - 200, 9);
  });

  it("fails when the closed waist is far from waist + ease", () => {
    const ctx = contextFor();
    const resolved = withInputs(ctx, resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options));
    const drafted = slotsOf(plan).reduce(
      (acc, slot) => withPiece(acc, panelPiece(band, slot, plan, { marks: [] })),
      resolved,
    );
    expect(fullnessClosureRule.appliesTo(drafted)).toBe(true);
    expect(fullnessClosureRule.run(drafted)).toMatchObject({
      code: "FULLNESS_CLOSURE_MISMATCH",
      status: "fail",
    });
  });
});
