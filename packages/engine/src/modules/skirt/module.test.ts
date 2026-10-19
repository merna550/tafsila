/** The straight and A-line skirt modules in the pipeline: lengths, slits, FR-VAL properties and snapshots (issue #135). */
import type { DesignSpec, Measurements, PatternResult } from "@tafsila/schemas";
import {
  aLineAnkleSideSlitSkirt,
  aLineMidiSkirt,
  SIZE_MATRIX,
  straightKneeSkirt,
  straightMidiBackSlitSkirt,
  straightMidiSkirt,
} from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { A_LINE_HEM_GAIN_KEY, SLIT_HIP_CLEARANCE_MM, WALKING_HEM_MIN_MM } from "../../constants/skirt-style";
import { CIRCUMFERENCE_TOLERANCE_MM, SEAM_MATCH_TOLERANCE_MM } from "../../constants/validation";
import { samplePath, selfIntersections } from "../../geometry";
import { bodyLineMultiplier } from "../../pieces/body-lines";
import { edgeLengthMm } from "../../pieces/measure";
import { createContext } from "../../pipeline/draft-context";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { expectSvgSnapshot } from "../../render/expect-svg-snapshot";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { skirtBlockModule } from "../../blocks/skirt/skirt-module";
import { skirtShapeModule } from "./shape-module";
import { SLIT_EDGE_ID } from "./slit";
import { skirtSlitModule } from "./slit-module";
import { withoutWaistFinish } from "../../test-utils/piece-ids";

const sizeM = SIZE_MATRIX.find((e) => e.id === "size-m")!.measurements;
const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");
const LENGTHS = ["mini", "knee", "midi", "ankle", "floor"] as const;
const TYPES = ["straight", "a-line"] as const;
type Skirt = NonNullable<DesignSpec["skirt"]>;
type SlitOption = Skirt["slit"];
const SLITS: readonly SlitOption[] = [
  undefined,
  { position: "front", lengthMm: 120 },
  { position: "back", lengthMm: 200 },
  { position: "side", lengthMm: 250 },
];

/**
 * A skirt design with the given type, length and slit.
 *
 * @param type - Straight or A-line.
 * @param length - Named length.
 * @param slit - Optional slit.
 * @returns The design.
 */
function design(type: Skirt["type"], length: Skirt["length"], slit?: SlitOption): DesignSpec {
  return { ...straightKneeSkirt, skirt: { type, length, ...(slit ? { slit } : {}) } };
}

/**
 * Drafts a design.
 *
 * @param spec - Design.
 * @param m - Measurements.
 * @returns The pattern.
 */
function draft(spec: DesignSpec, m: Measurements = sizeM): PatternResult {
  return generatePattern(spec, m, DEFAULT_ENGINE_OPTIONS);
}

/**
 * The finished hem circumference of a pattern.
 *
 * @param result - Pattern.
 * @returns Hem circumference in mm.
 */
function hemMm(result: PatternResult): number {
  return result.pieces.reduce((sum, p) => sum + edgeLengthMm(p, "hem") * bodyLineMultiplier(p), 0);
}

describe("skirt shape module", () => {
  it("applies to straight and A-line skirts only", () => {
    expect(skirtShapeModule.appliesTo(straightKneeSkirt)).toBe(true);
    expect(skirtShapeModule.appliesTo(aLineMidiSkirt)).toBe(true);
    expect(skirtShapeModule.appliesTo(design("circle-half", "knee"))).toBe(false);
  });

  it("leaves the straight block as it is", () => {
    const ctx = skirtBlockModule.draft(createContext(straightKneeSkirt, sizeM, DEFAULT_ENGINE_OPTIONS));
    expect(skirtShapeModule.draft(ctx)).toBe(ctx);
  });

  it("records the A-line hem gain of each half", () => {
    const ctx = skirtBlockModule.draft(createContext(aLineMidiSkirt, sizeM, DEFAULT_ENGINE_OPTIONS));
    const done = skirtShapeModule.draft(ctx);
    expect(done.resolved[A_LINE_HEM_GAIN_KEY.front]).toBeGreaterThan(0);
    expect(done.resolved[A_LINE_HEM_GAIN_KEY.back]).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    expect(draft(aLineAnkleSideSlitSkirt)).toEqual(draft(aLineAnkleSideSlitSkirt));
  });
});

describe("skirt lengths", () => {
  it("puts each named length at the resolved length, in order, within the body", () => {
    const hems = LENGTHS.map((length) => {
      const result = draft(design("a-line", length));
      const ys = result.pieces.flatMap((p) => samplePath(p.stitchPath).map((q) => q.y));
      expect(Math.max(...ys)).toBeLessThanOrEqual(sizeM.waistToFloor);
      return Math.max(...ys);
    });
    expect([...hems].sort((a, b) => a - b)).toEqual(hems);
  });

  it("lets lengthMm win over the named length", () => {
    const spec: DesignSpec = {
      ...straightKneeSkirt,
      skirt: { type: "straight", length: "floor", lengthMm: 650 },
    };
    const centre = draft(spec).pieces[0]!.stitchPath.at(-1)!;
    expect(centre.from.y).toBe(650);
  });

  it("reports a lengthMm longer than the body as a failed input, with no pieces", () => {
    const spec: DesignSpec = {
      ...straightKneeSkirt,
      skirt: { type: "a-line", length: "knee", lengthMm: sizeM.waistToFloor + 1 },
    };
    const result = draft(spec);
    expect(result.pieces).toEqual([]);
    expect(result.validation.checks.map((c) => [c.code, c.status])).toContainEqual([
      "SKIRT_LENGTH_OUT_OF_BODY",
      "fail",
    ]);
  });
});

describe("skirt slits", () => {
  it("cuts a back slit into the centre-back seam with a notch at its top", () => {
    const back = draft(straightMidiBackSlitSkirt).pieces.find((p) => p.id === "skirt-back")!;
    expect(back.edges.some((e) => e.id === SLIT_EDGE_ID)).toBe(true);
    expect(back.notches.map((n) => n.edgeId)).toEqual(["cb"]);
  });

  it("cuts a front slit by giving the front a centre seam", () => {
    const front = draft(design("straight", "midi", SLITS[1])).pieces.find((p) => p.id === "skirt-front")!;
    expect(front.cut.quantity).toBe(2);
    expect(front.edges.find((e) => e.id === "cf")!.kind).toBe("other");
  });

  it("cuts a side slit into both side seams, notches paired", () => {
    const result = draft(aLineAnkleSideSlitSkirt);
    expect(withoutWaistFinish(result.pieces).every((p) => p.notches.some((n) => n.edgeId === "side"))).toBe(
      true,
    );
    expect(result.validation.checks.filter((c) => c.code === "NOTCH_OK")).toHaveLength(1);
  });

  it("fails a slit that reaches above the hip line and does not cut it (FR-VAL-08)", () => {
    const result = draft(design("straight", "knee", { position: "back", lengthMm: 600 }));
    const check = result.validation.checks.find((c) => c.code === "SLIT_ABOVE_HIP")!;
    expect(check.status).toBe("fail");
    expect(result.pieces.every((p) => p.edges.every((e) => e.id !== SLIT_EDGE_ID))).toBe(true);
  });

  it("warns that a slit on a circle skirt is not drafted", () => {
    const result = draft(design("circle-half", "knee", SLITS[2]));
    expect(result.validation.checks.find((c) => c.code === "SLIT_NOT_DRAFTED")!.status).toBe("warn");
    expect(
      skirtSlitModule.draft(
        createContext(design("circle-half", "knee", SLITS[2]), sizeM, DEFAULT_ENGINE_OPTIONS),
      ).pieces,
    ).toEqual([]);
  });
});

describe("walking ease (FR-VAL-08)", () => {
  it("warns for a straight midi skirt without a slit", () => {
    const check = draft(straightMidiSkirt).validation.checks.find((c) => c.code === "PLAUS_WALKING_EASE");
    expect(check?.status).toBe("warn");
  });

  it("does not warn at the knee, with a slit, or for an A-line", () => {
    for (const spec of [straightKneeSkirt, straightMidiBackSlitSkirt, aLineMidiSkirt]) {
      expect(draft(spec).validation.checks.some((c) => c.code === "PLAUS_WALKING_EASE")).toBe(false);
    }
  });
});

describe("straight and A-line properties across the size matrix", () => {
  const index = fc.integer({ min: 0, max: SIZE_MATRIX.length - 1 });
  const type = fc.constantFrom(...TYPES);
  const length = fc.constantFrom(...LENGTHS);
  const slit = fc.constantFrom(...SLITS);

  /**
   * One sample: the design, its body and pattern.
   *
   * @param i - Size matrix index.
   * @param t - Type.
   * @param l - Length.
   * @param s - Slit.
   * @returns Design, measurements and pattern.
   */
  const sample = (i: number, t: Skirt["type"], l: Skirt["length"], s: SlitOption) => {
    const spec = design(t, l, s);
    const m = SIZE_MATRIX[i]!.measurements;
    return { spec, m, result: draft(spec, m) };
  };

  it("matches the side seams within 2 mm and sews the hip and waist to measurement + ease within 5 mm", () => {
    fc.assert(
      fc.property(index, type, length, slit, (i, t, l, s) => {
        const { spec, m, result } = sample(i, t, l, s);
        const [front, back] = result.pieces;
        expect(Math.abs(edgeLengthMm(front!, "side") - edgeLengthMm(back!, "side"))).toBeLessThanOrEqual(
          SEAM_MATCH_TOLERANCE_MM,
        );
        const ease = resolveDraftInputs(spec, m, DEFAULT_ENGINE_OPTIONS).totalEaseMm;
        const circumference = result.validation.checks.filter((c) => c.id === "FR-VAL-03");
        expect(circumference.map((c) => c.status)).toEqual(["pass", "pass"]);
        const hip = circumference.find((c) => c.refs?.[0]?.endsWith("skirt-hip"))!;
        expect(Math.abs(hip.measuredMm! - (m.hip + ease.hip))).toBeLessThanOrEqual(
          CIRCUMFERENCE_TOLERANCE_MM,
        );
      }),
      { numRuns: 40 },
    );
  }, 30_000);

  it("draws closed outlines without crossings and fails only a slit reaching above the hip line", () => {
    fc.assert(
      fc.property(index, type, length, slit, (i, t, l, s) => {
        const { spec, m, result } = sample(i, t, l, s);
        for (const piece of result.pieces) expect(selfIntersections(piece.stitchPath)).toEqual([]);
        const inputs = resolveDraftInputs(spec, m, DEFAULT_ENGINE_OPTIONS);
        const maxSlitMm = inputs.skirtLengthMm! - inputs.hipDepthMm - SLIT_HIP_CLEARANCE_MM;
        const failing = result.validation.checks.filter((c) => c.status === "fail").map((c) => c.code);
        expect(failing).toEqual(s && s.lengthMm > maxSlitMm ? ["SLIT_ABOVE_HIP"] : []);
      }),
      { numRuns: 40 },
    );
  }, 30_000);

  it("widens the A-line hem by the declared gain and keeps the waist of the straight skirt", () => {
    fc.assert(
      fc.property(index, length, (i, l) => {
        const m = SIZE_MATRIX[i]!.measurements;
        const straight = draft(design("straight", l), m);
        const aLine = draft(design("a-line", l), m);
        const ctx = skirtShapeModule.draft(
          skirtBlockModule.draft(createContext(design("a-line", l), m, DEFAULT_ENGINE_OPTIONS)),
        );
        const declaredMm =
          2 * (ctx.resolved[A_LINE_HEM_GAIN_KEY.front]! + ctx.resolved[A_LINE_HEM_GAIN_KEY.back]!);
        const grownMm = hemMm(aLine) - hemMm(straight);
        expect(grownMm).toBeGreaterThanOrEqual(declaredMm - 0.1);
        // The four smooth hem bridges are slightly longer than their declared opening chords.
        expect(grownMm).toBeLessThanOrEqual(declaredMm + CIRCUMFERENCE_TOLERANCE_MM);
        const waist = (r: PatternResult) =>
          r.validation.checks.find((c) => c.refs?.[0]?.endsWith("skirt-waist"))!;
        expect(Math.abs(waist(aLine).measuredMm! - waist(straight).measuredMm!)).toBeLessThanOrEqual(
          CIRCUMFERENCE_TOLERANCE_MM,
        );
      }),
      { numRuns: 30 },
    );
  }, 30_000);

  it("warns about walking ease exactly for slit-less straight skirts below the knee with a narrow hem", () => {
    fc.assert(
      fc.property(index, type, length, slit, (i, t, l, s) => {
        const { spec, m, result } = sample(i, t, l, s);
        const lengthMm = resolveDraftInputs(spec, m, DEFAULT_ENGINE_OPTIONS).skirtLengthMm!;
        const expected =
          t === "straight" && !s && lengthMm > m.waistToKnee && hemMm(result) < WALKING_HEM_MIN_MM;
        expect(result.validation.checks.some((c) => c.code === "PLAUS_WALKING_EASE")).toBe(expected);
      }),
      { numRuns: 40 },
    );
  }, 30_000);
});

describe("straight and A-line SVG snapshot", () => {
  for (const t of TYPES) {
    for (const l of LENGTHS) {
      it(`${t} ${l} size-m`, async () => {
        await expectSvgSnapshot(draft(design(t, l)));
      });
    }
  }
  for (const [name, spec] of Object.entries({
    aLineMidiSkirt,
    straightMidiBackSlitSkirt,
    aLineAnkleSideSlitSkirt,
  })) {
    for (const entry of CHART) {
      it(`${name} ${entry.id}`, async () => {
        const result = draft(spec, entry.measurements);
        expect(result.validation.status).not.toBe("fail");
        await expectSvgSnapshot(result);
      });
    }
  }
});
