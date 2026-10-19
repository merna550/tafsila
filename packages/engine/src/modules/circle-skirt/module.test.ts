/** The circle-skirt module in the pipeline: pieces, seams, FR-VAL-03/08 properties and snapshots (issue #136). */
import type { DesignSpec, PatternResult } from "@tafsila/schemas";
import {
  fullCircleKneeSkirt,
  halfCircleKneeSkirt,
  SIZE_MATRIX,
  straightKneeSkirt,
  vNeckHalfCircleDress,
} from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CIRCUMFERENCE_TOLERANCE_MM } from "../../constants/validation";
import { selfIntersections } from "../../geometry";
import { widthAcrossGrainMm } from "../../pieces/fabric-width";
import { edgeLengthMm } from "../../pieces/measure";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { expectSvgSnapshot } from "../../render/expect-svg-snapshot";
import { circleSkirtModule } from "./module";
import { withoutWaistFinish } from "../../test-utils/piece-ids";

/** The default fabric width of the issue's acceptance criterion, in mm. */
const DEFAULT_FABRIC_MM = 1500;

/** A narrow fabric that forces the split layout for every chart size. */
const NARROW_FABRIC_MM = 900;

const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");
const sizeM = SIZE_MATRIX.find((e) => e.id === "size-m")!.measurements;
const CIRCLES: readonly DesignSpec[] = [halfCircleKneeSkirt, fullCircleKneeSkirt];
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

describe("circleSkirtModule", () => {
  it("applies to half and full circles only", () => {
    expect(CIRCLES.every((spec) => circleSkirtModule.appliesTo(spec))).toBe(true);
    expect(circleSkirtModule.appliesTo(straightKneeSkirt)).toBe(false);
  });

  it("replaces the block's front and back: same ids, no darts", () => {
    const result = draft(halfCircleKneeSkirt, sizeM);
    expect(withoutWaistFinish(result.pieces).map((p) => [p.id, p.darts.length])).toEqual([
      ["skirt-front", 0],
      ["skirt-back", 0],
    ]);
  });

  it("cuts front and back on the fold when they fit, with no allowance on the fold", () => {
    const front = draft(halfCircleKneeSkirt, sizeM).pieces[0]!;
    expect(front.cut).toEqual({ quantity: 1, onFold: true, mirror: false, fabric: "main" });
    expect(Object.fromEntries(front.edges.map((e) => [e.id, e.seamAllowanceMm]))).toEqual({
      waist: 15,
      side: 15,
      hem: 30,
      cf: 0,
    });
  });

  it("splits into four pieces on narrow fabric, each centre seam paired with its mirror", () => {
    const result = draft(fullCircleKneeSkirt, sizeM, NARROW_FABRIC_MM);
    for (const piece of withoutWaistFinish(result.pieces)) {
      expect(piece.cut).toEqual({ quantity: 2, onFold: false, mirror: true, fabric: "main" });
      const centre = piece.edges.find((e) => e.id === (piece.id === "skirt-front" ? "cf" : "cb"))!;
      expect(centre).toMatchObject({ kind: "other", pairsWith: { pieceId: piece.id, edgeId: centre.id } });
    }
  });

  it("pairs the side seams front to back with equal lengths", () => {
    const [front, back] = draft(fullCircleKneeSkirt, sizeM).pieces;
    expect(front!.edges.find((e) => e.id === "side")!.pairsWith).toMatchObject({ pieceId: "skirt-back" });
    expect(edgeLengthMm(front!, "side")).toBeCloseTo(edgeLengthMm(back!, "side"), 6);
  });

  it("keeps the straight grain parallel to the centre line", () => {
    for (const piece of draft(fullCircleKneeSkirt, sizeM, NARROW_FABRIC_MM).pieces) {
      const centre = piece.stitchPath.at(-1)!;
      const [from, to] = piece.grainLine;
      expect(from.x).toBe(to.x);
      expect(centre.from.x).toBeCloseTo(centre.to.x, 9);
    }
  });

  it("cuts the back as a mirrored pair for a centre-back zip even when the fold fits", () => {
    const back = draft(vNeckHalfCircleDress, sizeM).pieces.find((p) => p.id === "skirt-back")!;
    expect(back.cut.quantity).toBe(2);
    expect(back.edges.find((e) => e.id === "cb")!.kind).toBe("other");
  });

  it("is deterministic", () => {
    expect(draft(fullCircleKneeSkirt, sizeM, NARROW_FABRIC_MM)).toEqual(
      draft(fullCircleKneeSkirt, sizeM, NARROW_FABRIC_MM),
    );
  });
});

describe("circle skirt properties across the size matrix", () => {
  const index = fc.integer({ min: 0, max: SIZE_MATRIX.length - 1 });
  const spec = fc.constantFrom(...CIRCLES);
  const length = fc.constantFrom(...LENGTHS);
  const fabric = fc.integer({ min: 600, max: 1800 });

  /**
   * The circle skirt for one sample.
   *
   * @param i - Size matrix index.
   * @param s - Circle design.
   * @param l - Length name.
   * @param fabricWidthMm - Fabric width.
   * @returns The design and the pattern.
   */
  const sample = (i: number, s: DesignSpec, l: (typeof LENGTHS)[number], fabricWidthMm: number) => {
    const design: DesignSpec = { ...s, skirt: { ...s.skirt!, length: l } };
    return { design, result: draft(design, SIZE_MATRIX[i]!.measurements, fabricWidthMm) };
  };

  it("sews a waist of waist + ease within 5 mm (FR-VAL-03)", () => {
    fc.assert(
      fc.property(index, spec, length, fabric, (i, s, l, w) => {
        const { design, result } = sample(i, s, l, w);
        const m = SIZE_MATRIX[i]!.measurements;
        const expectedMm = m.waist + resolveDraftInputs(design, m, DEFAULT_ENGINE_OPTIONS).totalEaseMm.waist;
        const sewnMm = result.pieces.reduce((sum, p) => sum + edgeLengthMm(p, "waist") * 2, 0);
        expect(Math.abs(sewnMm - expectedMm)).toBeLessThanOrEqual(CIRCUMFERENCE_TOLERANCE_MM);
        const check = result.validation.checks.find((c) => c.id === "FR-VAL-03")!;
        expect(check.status).toBe("pass");
      }),
      { numRuns: 60 },
    );
  });

  it("draws closed outlines without crossings and passes every structural and seam check", () => {
    fc.assert(
      fc.property(index, spec, length, fabric, (i, s, l, w) => {
        const { result } = sample(i, s, l, w);
        for (const piece of result.pieces) expect(selfIntersections(piece.stitchPath)).toEqual([]);
        const failing = result.validation.checks.filter((c) => c.status === "fail");
        expect(failing).toEqual([]);
      }),
      { numRuns: 60 },
    );
  });

  it("fits every piece across the fabric, or reports the FR-VAL-08 width warning", () => {
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

  it("fits the default 1500 mm fabric for every chart size and length", () => {
    for (const entry of CHART) {
      for (const s of CIRCLES) {
        for (const l of LENGTHS) {
          const { result } = sample(SIZE_MATRIX.indexOf(entry), s, l, DEFAULT_FABRIC_MM);
          expect(result.validation.checks.some((c) => c.code === "PLAUS_WIDER_THAN_FABRIC")).toBe(false);
        }
      }
    }
  });
});

describe("circle skirt SVG snapshot", () => {
  for (const spec of CIRCLES) {
    for (const fabricWidthMm of [DEFAULT_FABRIC_MM, NARROW_FABRIC_MM]) {
      for (const entry of CHART) {
        it(`${spec.skirt!.type} fabric ${fabricWidthMm} ${entry.id}`, async () => {
          const result = draft(spec, entry.measurements, fabricWidthMm);
          expect(result.validation.status).not.toBe("fail");
          await expectSvgSnapshot(result);
        });
      }
    }
  }
});
