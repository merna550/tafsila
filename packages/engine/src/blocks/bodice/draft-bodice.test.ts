/** Unit tests of the bodice block (issue #128): key points, outline, edges, darts, fits, errors, purity. */
import { DEFAULT_SEAM_ALLOWANCE_MM, patternResultSchema, type Measurements } from "@tafsila/schemas";
import {
  dartedBlouse,
  egyptianSizeChart,
  referenceDrafts,
  REFERENCE_SIZES,
  vNeckHalfCircleDress,
} from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { DraftingError } from "../../errors/drafting-error";
import { distance, isClosed } from "../../geometry";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { createContext } from "../../pipeline/draft-context";
import { bodiceCase } from "../../test-utils/bodice-input";
import { deepFreeze } from "../../test-utils/deep-freeze";
import { bodiceBlock, draftBodice } from "./draft-bodice";

/** NFR-01 tolerance. */
const KEY_POINT_MM = 1;
/** Tighter drift guard: the reference is rounded to 0.1 mm. */
const DRIFT_MM = 0.06;

const M = egyptianSizeChart.M as Measurements;
const S = egyptianSizeChart.S as Measurements;

describe("draftBodice key points", () => {
  it.each(REFERENCE_SIZES)("size %s matches every reference point (± 1 mm, drift guard 0.06 mm)", (size) => {
    const { keyPoints } = draftBodice(bodiceCase(egyptianSizeChart[size] as Measurements).input);
    const ref = { ...referenceDrafts[size].bodiceBack, ...referenceDrafts[size].bodiceFront };
    expect(Object.keys(ref)).toHaveLength(26);
    for (const [name, p] of Object.entries(ref)) {
      const got = keyPoints[name as keyof typeof keyPoints];
      expect(got, name).toBeDefined();
      expect(Math.abs(got.x - p.x), `${name}.x`).toBeLessThanOrEqual(KEY_POINT_MM);
      expect(Math.abs(got.y - p.y), `${name}.y`).toBeLessThanOrEqual(KEY_POINT_MM);
      expect(Math.abs(got.x - p.x), `${name}.x drift`).toBeLessThan(DRIFT_MM);
      expect(Math.abs(got.y - p.y), `${name}.y drift`).toBeLessThan(DRIFT_MM);
    }
  });

  it("puts every outline key point on a segment end", () => {
    const d = draftBodice(bodiceCase(M).input);
    const ends = (path: typeof d.back.stitchPath) => path.map((s) => s.to);
    const onOutline = (pts: { x: number; y: number }[], path: typeof d.back.stitchPath) =>
      pts.every((p) => ends(path).some((e) => distance(e, p) < 0.01));
    const k = d.keyPoints;
    expect(
      onOutline(
        [
          k["bodice.back.nape"],
          k["bodice.back.neckPoint"],
          k["bodice.back.shoulderTip"],
          k["bodice.back.backWidthPoint"],
          k["bodice.back.underarm"],
          k["bodice.back.sideWaist"],
          k["bodice.back.waistDartLeft"],
          k["bodice.back.waistDartRight"],
          k["bodice.back.waistCB"],
        ],
        d.back.stitchPath,
      ),
    ).toBe(true);
    expect(
      onOutline(
        [
          k["bodice.front.neckCF"],
          k["bodice.front.neckPoint"],
          k["bodice.front.shoulderTip"],
          k["bodice.front.chestWidthPoint"],
          k["bodice.front.underarm"],
          k["bodice.front.bustDartUpper"],
          k["bodice.front.bustDartLower"],
          k["bodice.front.sideWaist"],
          k["bodice.front.waistDartLeft"],
          k["bodice.front.waistDartRight"],
          k["bodice.front.waistCF"],
        ],
        d.front.stitchPath,
      ),
    ).toBe(true);
    expect(isClosed(d.back.stitchPath) && isClosed(d.front.stitchPath)).toBe(true);
  });
});

describe("draftBodice edges and darts", () => {
  const d = draftBodice(bodiceCase(S).input, {
    seamAllowance: { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: { "bodice-front/side": 20 } },
  });

  it("names the edges in path order and covers every segment", () => {
    expect(d.back.edges.map((e) => e.id)).toEqual(["neck", "shoulder", "armhole", "side", "waist", "cb"]);
    expect(d.front.edges.map((e) => e.id)).toEqual(["neck", "shoulder", "armhole", "side", "waist", "cf"]);
    for (const piece of [d.back, d.front]) {
      piece.edges.forEach((e, i) =>
        expect(e.fromSegment).toBe(i === 0 ? 0 : piece.edges[i - 1]!.toSegment + 1),
      );
      expect(piece.edges.at(-1)!.toSegment).toBe(piece.stitchPath.length - 1);
    }
  });

  it("pairs the shoulder and side seams and declares the back shoulder ease", () => {
    const edge = (p: typeof d.back, id: string) => p.edges.find((e) => e.id === id)!;
    expect(edge(d.back, "shoulder").pairsWith).toEqual({
      pieceId: "bodice-front",
      edgeId: "shoulder",
      intendedEaseMm: 0,
    });
    expect(edge(d.front, "shoulder").pairsWith).toEqual({ pieceId: "bodice-back", edgeId: "shoulder" });
    expect(edge(d.back, "side").pairsWith).toEqual({ pieceId: "bodice-front", edgeId: "side" });
    expect(edge(d.front, "side").pairsWith).toEqual({ pieceId: "bodice-back", edgeId: "side" });
    expect(edge(d.back, "cb").seamAllowanceMm).toBe(0);
    expect(edge(d.front, "cf").seamAllowanceMm).toBe(0);
    expect(edge(d.front, "side").seamAllowanceMm).toBe(20);
    expect(edge(d.back, "side").seamAllowanceMm).toBe(DEFAULT_SEAM_ALLOWANCE_MM.side);
  });

  it("places the S darts on the reference points", () => {
    const bust = d.front.darts.find((x) => x.id === "bust-dart")!;
    expect(bust.edgeId).toBe("side");
    expect(bust.legs).toEqual([
      { x: 240, y: 250 },
      { x: 240, y: 275 },
    ]);
    expect(bust.apex).toEqual({ x: 115, y: 262.5 });
    const waist = d.front.darts.find((x) => x.id === "waist-dart")!;
    expect(waist.legs[0].x).toBeCloseTo(103.8, 1);
    expect(waist.legs[0].y).toBeCloseTo(427.3, 1);
    expect(waist.legs[1].x).toBeCloseTo(76.1, 1);
    expect(waist.legs[1].y).toBeCloseTo(427.3, 1);
    expect(d.back.darts.map((x) => x.id)).toEqual(["waist-dart"]);
  });

  it("cuts both halves once on the fold, with a grain line parallel to the centre", () => {
    for (const piece of [d.back, d.front]) {
      expect(piece.cut).toEqual({ quantity: 1, onFold: true, mirror: false, fabric: "main" });
      expect(piece.grainLine[0].x).toBe(piece.grainLine[1].x);
      expect(piece.notches).toEqual([]);
    }
    expect(d.back.name).toEqual({ ar: "الظهر", en: "Back bodice" });
    expect(d.front.name).toEqual({ ar: "الصدر الأمامي", en: "Front bodice" });
  });
});

describe("draftBodice fit variants and small darts", () => {
  it.each([
    ["fitted", 257.5, 202.5],
    ["semi-fitted", 260, 205],
    ["loose", 267.5, 212.5],
  ] as const)("size M %s: underarm x and back waist without the dart", (fit, underarmX, waistQuarter) => {
    const c = bodiceCase(M, "regular", fit);
    const k = draftBodice(c.input).keyPoints;
    expect(k["bodice.back.underarm"].x).toBeCloseTo(underarmX, 9);
    expect(c.input.bodiceWaistQuarterMm).toBeCloseTo(waistQuarter, 9);
    const dart = k["bodice.back.waistDartRight"].x - k["bodice.back.waistDartLeft"].x;
    expect(k["bodice.back.sideWaist"].x - dart).toBeCloseTo(waistQuarter, 9);
  });

  it("drops a waist dart narrower than 6 mm and lets the side seam take the shaping", () => {
    const c = bodiceCase({ ...M, waist: M.bust });
    const d = draftBodice(c.input);
    expect(d.back.darts).toEqual([]);
    expect(d.front.darts.map((x) => x.id)).toEqual(["bust-dart"]);
    expect(d.keyPoints["bodice.back.sideWaist"].x).toBeCloseTo(c.input.bodiceWaistQuarterMm, 9);
    expect(d.back.edges.find((e) => e.id === "waist")!.toSegment).toBe(
      d.back.edges.find((e) => e.id === "waist")!.fromSegment,
    );
  });

  it("drafts no waist darts for shaping none", () => {
    const c = bodiceCase(M);
    const d = draftBodice({ ...c.input, waistDarts: false });
    expect(d.back.darts).toEqual([]);
  });
});

describe("draftBodice bad proportions", () => {
  it("throws BODICE_SHOULDER_INVALID for a narrow shoulder and a large neck", () => {
    const c = bodiceCase({ ...M, shoulderWidth: 200, neck: 450 });
    expect(() => draftBodice(c.input)).toThrow(expect.objectContaining({ code: "BODICE_SHOULDER_INVALID" }));
  });

  it("throws BODICE_LENGTHS_INVALID for a back too short for the armhole", () => {
    const c = bodiceCase(M);
    expect(() => draftBodice({ ...c.input, backLength: 250 })).toThrow(
      expect.objectContaining({ code: "BODICE_LENGTHS_INVALID" }),
    );
  });

  it("gives a fail result, not a throw, when the bust point does not fit the lengths", () => {
    const result = generatePattern(dartedBlouse, {
      ...M,
      bustHeight: 420,
      backLength: 330,
      frontLength: 340,
    });
    expect(result.pieces).toEqual([]);
    expect(result.validation.status).toBe("fail");
    expect(result.validation.checks.at(-1)).toMatchObject({
      id: "FR-MEAS-01",
      code: "BODICE_BUST_POINT_OUT_OF_BLOCK",
      status: "fail",
    });
    expect(result.validation.checks.at(-1)!.message.ar).toMatch(/نقطة الصدر/);
    expect(patternResultSchema.safeParse(result).success).toBe(true);
  });

  it("gives a fail result for a skirt longer than the body", () => {
    const spec = { ...vNeckHalfCircleDress, skirt: { ...vNeckHalfCircleDress.skirt!, lengthMm: 2000 } };
    const result = generatePattern(spec, M);
    expect(result.validation.status).toBe("fail");
    expect(result.validation.checks.at(-1)?.code).toBe("SKIRT_LENGTH_OUT_OF_BODY");
  });
});

describe("bodice purity and pipeline", () => {
  it("does not change frozen input and gives identical output twice", () => {
    const input = deepFreeze(structuredClone(bodiceCase(M).input));
    const a = draftBodice(input);
    const b = draftBodice(input);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("drafts the seed blouse through generatePattern with the armhole lengths in resolved", () => {
    const result = generatePattern(dartedBlouse, M, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: "M" });
    expect(patternResultSchema.parse(result).pieces.map((p) => p.id)).toEqual([
      "bodice-back",
      "bodice-front",
    ]);
    expect(result.validation.status).toBe("pass");
  });

  it("writes the armhole lengths and armscye depth for the sleeve block", () => {
    const ctx = createContext(dartedBlouse, M, DEFAULT_ENGINE_OPTIONS);
    const withInputs = { ...ctx, inputs: bodiceCase(M).resolved };
    const out = bodiceBlock(withInputs);
    expect(out.resolved["bodice.armholeBackMm"]).toBeGreaterThan(0);
    expect(out.resolved["bodice.armholeFrontMm"]).toBeGreaterThan(0);
    expect(out.resolved["bodice.scyeDepthMm"]).toBeCloseTo(220, 9);
  });

  it("throws PIPELINE_STEP_ORDER when resolve has not run", () => {
    const ctx = createContext(dartedBlouse, M, DEFAULT_ENGINE_OPTIONS);
    expect(() => bodiceBlock(ctx)).toThrow(DraftingError);
    expect(() => bodiceBlock(ctx)).toThrow(/resolve step/);
  });
});
