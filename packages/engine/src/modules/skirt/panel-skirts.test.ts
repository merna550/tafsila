/** Gathered, pleated and tiered skirts in the pipeline: pieces, FR-VAL-01/03/08 properties and snapshots (issue #137). */
import type { DesignSpec, Mark, PatternResult, Piece } from "@tafsila/schemas";
import {
  gatheredKneeSkirt,
  pleatedKneeSkirt,
  SIZE_MATRIX,
  straightKneeSkirt,
  tieredMidiSkirt,
} from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CIRCUMFERENCE_TOLERANCE_MM } from "../../constants/validation";
import { widthAcrossGrainMm } from "../../pieces/fabric-width";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { renderSvg } from "../../render";
import { expectSvgSnapshot } from "../../render/expect-svg-snapshot";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { gatheredSkirtModule } from "./gathered";
import { pleatedSkirtModule } from "./pleated";
import { tieredSkirtModule } from "./tiered";

/** The default fabric width, in mm. */
const DEFAULT_FABRIC_MM = 1500;

/** A narrow fabric that splits every panel skirt into equal panels. */
const NARROW_FABRIC_MM = 900;

const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");
const sizeM = SIZE_MATRIX.find((e) => e.id === "size-m")!.measurements;
const PANEL_SKIRTS: readonly DesignSpec[] = [gatheredKneeSkirt, pleatedKneeSkirt, tieredMidiSkirt];
const LENGTHS = ["mini", "knee", "midi", "ankle", "floor"] as const;

/**
 * Drafts a design with the given fabric width.
 *
 * @param spec - The design.
 * @param measurements - Body measurements.
 * @param fabricWidthMm - Fabric width.
 * @returns The pattern.
 */
function draft(spec: DesignSpec, measurements: unknown, fabricWidthMm = DEFAULT_FABRIC_MM): PatternResult {
  return generatePattern(spec, measurements, { ...DEFAULT_ENGINE_OPTIONS, fabricWidthMm });
}

/**
 * Whether a mark lies on or inside its rectangle panel.
 *
 * @param mark - The mark.
 * @param piece - Its piece.
 * @returns True when every point of the mark is inside the stitch outline's box.
 */
function insidePiece(mark: Mark, piece: Piece): boolean {
  const points = mark.shape === "point" ? [mark.at] : [mark.from, mark.to];
  const corners = piece.stitchPath.map((s) => s.to);
  const maxX = Math.max(...corners.map((p) => p.x));
  const maxY = Math.max(...corners.map((p) => p.y));
  return points.every((p) => p.x >= 0 && p.y >= 0 && p.x <= maxX + 1e-9 && p.y <= maxY + 1e-9);
}

/** One drafted sample per chart size, style and fabric width: drafted once and shared by the tests below. */
const SAMPLES = CHART.flatMap((entry) =>
  PANEL_SKIRTS.flatMap((spec) =>
    [DEFAULT_FABRIC_MM, NARROW_FABRIC_MM].map((w) => ({
      entry,
      spec,
      w,
      result: draft(spec, entry.measurements, w),
    })),
  ),
);

describe("panel skirt modules", () => {
  it("each applies to its own skirt type only, and the straight block skips them", () => {
    expect(gatheredSkirtModule.appliesTo(gatheredKneeSkirt)).toBe(true);
    expect(pleatedSkirtModule.appliesTo(pleatedKneeSkirt)).toBe(true);
    expect(tieredSkirtModule.appliesTo(tieredMidiSkirt)).toBe(true);
    expect(PANEL_SKIRTS.map((s) => gatheredSkirtModule.appliesTo(s))).toEqual([true, false, false]);
    expect(tieredSkirtModule.appliesTo(straightKneeSkirt)).toBe(false);
  });

  it("drafts gathered and pleated skirts as front and back on the fold, without darts", () => {
    for (const spec of [gatheredKneeSkirt, pleatedKneeSkirt]) {
      const result = draft(spec, sizeM);
      expect(result.pieces.map((p) => [p.id, p.cut.onFold, p.darts.length])).toEqual([
        ["skirt-front", true, 0],
        ["skirt-back", true, 0],
      ]);
    }
  });

  it("gathers the gathered skirt 1.8 times to the waist", () => {
    const front = draft(gatheredKneeSkirt, sizeM).pieces[0]!;
    const gather = front.marks!.find((m) => m.kind === "gather")!;
    expect(gather.edgeId).toBe("waist");
    expect(front.bbox.widthMm).toBeGreaterThan(gather.lengthMm! * 1.8);
  });

  it("marks every knife pleat with a fold line, a placement line and an arrow", () => {
    const front = draft(pleatedKneeSkirt, sizeM).pieces[0]!;
    const kinds = front.marks!.map((m) => m.kind);
    expect(kinds.filter((k) => k === "pleat-fold")).toHaveLength(4);
    expect(kinds.filter((k) => k === "pleat-placement")).toHaveLength(4);
    expect(kinds.filter((k) => k === "pleat-direction")).toHaveLength(4);
  });

  it("drafts three tiers whose seams declare the gathered length as intended ease", () => {
    const result = draft(tieredMidiSkirt, sizeM);
    expect(new Set(result.pieces.map((p) => p.id.split("-").slice(0, 2).join("-")))).toEqual(
      new Set(["tier-1", "tier-2", "tier-3"]),
    );
    const seam = result.pieces.find((p) => p.id.startsWith("tier-2"))!.edges.find((e) => e.id === "top")!;
    expect(seam.pairsWith!.intendedEaseMm).toBeGreaterThan(0);
  });

  it("splits into equal panels on narrow fabric", () => {
    const result = draft(tieredMidiSkirt, sizeM, NARROW_FABRIC_MM);
    expect(result.pieces.map((p) => p.id)).toEqual(["tier-1-panel", "tier-2-panel", "tier-3-panel"]);
    expect(new Set(result.pieces.map((p) => p.cut.quantity)).size).toBe(1);
    expect(result.pieces[0]!.cut.quantity).toBeGreaterThan(2);
  });

  it("renders the marks layer with the Arabic gather and pleat words", () => {
    const svg = renderSvg(draft(pleatedKneeSkirt, sizeM), { layers: ["marks"] });
    expect(svg).toContain('id="piece-skirt-front-mark-pleat-1-fold"');
    expect(svg).toContain("اطوي الخط على الخط");
    const gathered = renderSvg(draft(gatheredKneeSkirt, sizeM), { layers: ["marks"] });
    expect(gathered).toContain('stroke-dasharray="1 1.5"');
    expect(gathered).toMatch(/جمّعي إلى \d+ مم/);
  });

  it("is deterministic", () => {
    expect(draft(tieredMidiSkirt, sizeM, NARROW_FABRIC_MM)).toEqual(
      draft(tieredMidiSkirt, sizeM, NARROW_FABRIC_MM),
    );
  });
});

describe("panel skirt checks for every chart size", () => {
  it("passes every check with no failure, every mark inside its piece", () => {
    for (const { result } of SAMPLES) {
      expect(result.validation.checks.filter((c) => c.status === "fail")).toEqual([]);
      for (const piece of result.pieces) {
        for (const mark of piece.marks ?? []) expect(insidePiece(mark, piece)).toBe(true);
      }
    }
  });
});

describe("panel skirt properties across the size matrix", () => {
  const index = fc.integer({ min: 0, max: SIZE_MATRIX.length - 1 });
  const spec = fc.constantFrom(...PANEL_SKIRTS);
  const length = fc.constantFrom(...LENGTHS);
  const fabric = fc.integer({ min: 600, max: 1800 });

  /**
   * One sample: a panel skirt at a length, size and fabric width.
   *
   * @param i - Size matrix index.
   * @param s - Design.
   * @param l - Length name.
   * @param w - Fabric width.
   * @returns The design and the pattern.
   */
  const sample = (i: number, s: DesignSpec, l: (typeof LENGTHS)[number], w: number) => {
    const design: DesignSpec = { ...s, skirt: { ...s.skirt!, length: l } };
    return { design, result: draft(design, SIZE_MATRIX[i]!.measurements, w) };
  };

  it("passes FR-VAL-01 on every gathered tier seam using its declared ease", () => {
    fc.assert(
      fc.property(index, length, fabric, (i, l, w) => {
        const { result } = sample(i, tieredMidiSkirt, l, w);
        const seams = result.validation.checks.filter((c) => c.id === "FR-VAL-01");
        const tierSeams = seams.filter((c) => c.refs?.some((r) => r.endsWith("/top")));
        const slots = result.pieces.length / 3;
        expect(tierSeams).toHaveLength(2 * slots);
        for (const c of seams) expect(c.status).toBe("pass");
        for (const c of tierSeams) expect(Math.abs(c.expectedMm!)).toBeGreaterThan(0);
      }),
      { numRuns: 40 },
    );
  });

  it("closes gathers and pleats to waist + ease within 5 mm (FR-VAL-03)", () => {
    fc.assert(
      fc.property(index, spec, length, fabric, (i, s, l, w) => {
        const { design, result } = sample(i, s, l, w);
        const m = SIZE_MATRIX[i]!.measurements;
        const expectedMm = m.waist + resolveDraftInputs(design, m, DEFAULT_ENGINE_OPTIONS).totalEaseMm.waist;
        const check = result.validation.checks.find((c) => c.code.startsWith("FULLNESS_CLOSURE"))!;
        expect(check.status).toBe("pass");
        expect(Math.abs(check.measuredMm! - expectedMm)).toBeLessThanOrEqual(CIRCUMFERENCE_TOLERANCE_MM);
      }),
      { numRuns: 60 },
    );
  });

  it("fits every panel across the fabric, or reports the FR-VAL-08 width warning", () => {
    fc.assert(
      fc.property(index, spec, length, fabric, (i, s, l, w) => {
        const { result } = sample(i, s, l, w);
        const widthCheck = result.validation.checks.find((c) => c.code === "PLAUS_WIDER_THAN_FABRIC");
        const fits = result.pieces.every((p) => widthAcrossGrainMm(p) <= w);
        expect(fits ? widthCheck === undefined : widthCheck?.status === "warn").toBe(true);
      }),
      { numRuns: 60 },
    );
  });
});

describe("panel skirt SVG snapshot", () => {
  for (const { entry, spec, w, result } of SAMPLES) {
    if (w !== DEFAULT_FABRIC_MM && entry.id !== "size-m") continue;
    it(`${spec.skirt!.type} fabric ${w} ${entry.id}`, async () => {
      await expectSvgSnapshot(result);
    });
  }
});
