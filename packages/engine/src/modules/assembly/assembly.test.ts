/** Unit tests of garment assembly (issue #144): waist seam dress, one-piece dress, princess, category seeds. */
import { patternResultSchema, type PatternResult, type Piece, type Point } from "@tafsila/schemas";
import {
  CATEGORY_SEEDS,
  SIZE_MATRIX,
  onePieceDress,
  princessOnePieceDress,
  seedDress,
  sizeM,
} from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { SKIRT_DART_LENGTH_MM } from "../../constants/skirt-block";
import { distance } from "../../geometry";
import { dartLegLengthsMm, edgeLengthMm } from "../../pieces/measure";
import type { DraftContext } from "../../pipeline/draft-context";
import { generatePattern } from "../../pipeline/generate-pattern";
import { lowerApex } from "./fisheye";
import { dressWaistSeamRule } from "./waist-seam";

/** Wall-clock allowance on a busy CI runner with coverage. */
const TIMEOUT_MS = 30_000;

/**
 * A piece of a result by id.
 *
 * @param result - The pattern.
 * @param id - Piece id.
 * @returns The piece.
 */
function piece(result: PatternResult, id: string): Piece {
  const found = result.pieces.find((p) => p.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
}

/**
 * The first point of an edge.
 *
 * @param p - The piece.
 * @param edgeId - Edge id.
 * @returns The point.
 */
function edgeStart(p: Piece, edgeId: string): Point {
  return p.stitchPath[p.edges.find((e) => e.id === edgeId)!.fromSegment]!.from;
}

/**
 * Checks of a result with a given code.
 *
 * @param result - The pattern.
 * @param code - Check code.
 * @returns The checks.
 */
function checks(result: PatternResult, code: string): PatternResult["validation"]["checks"] {
  return result.validation.checks.filter((c) => c.code === code);
}

describe("dress with a waist seam", () => {
  const result = generatePattern(seedDress, sizeM);

  it("puts each skirt dart under the bodice dart (closed waist, 0.1 mm)", () => {
    for (const [half, centre] of [
      ["front", "cf"],
      ["back", "cb"],
    ] as const) {
      const bodice = piece(result, `bodice-${half}`);
      const dart = bodice.darts.find((d) => d.id === "waist-dart")!;
      const bodiceMm = distance(edgeStart(bodice, centre), dart.legs[1]);
      const skirtDart = piece(result, `skirt-${half}`).darts[0]!;
      expect(Math.hypot(skirtDart.legs[0].x, skirtDart.legs[0].y)).toBeCloseTo(bodiceMm, 1);
    }
  });

  it("pairs the waist dart notches within 2 mm (FR-VAL-04)", () => {
    const waist = checks(result, "NOTCH_OK").filter((c) => c.refs?.some((r) => r.includes("#waist-dart")));
    expect(waist).toHaveLength(2);
    expect(checks(result, "NOTCH_MISMATCH")).toEqual([]);
  });

  it.each(["straight", "a-line", "circle-half", "gathered", "pleated"] as const)(
    "matches the waist seam with a %s skirt",
    (type) => {
      const out = generatePattern({ ...seedDress, skirt: { type, length: "knee" } }, sizeM);
      const rows = checks(out, "DRESS_WAIST_SEAM_OK");
      expect(rows).toHaveLength(2);
      expect(out.validation.status).not.toBe("fail");
    },
    TIMEOUT_MS,
  );

  it("fails and names the half when the skirt front waist is 3 mm short", () => {
    const skirt = piece(result, "skirt-front");
    const shortened: Piece = {
      ...skirt,
      marks: [
        {
          id: "short",
          kind: "gather",
          shape: "line",
          edgeId: "waist",
          from: { x: 0, y: 0 },
          to: { x: 100, y: 0 },
          lengthMm: 97,
        },
      ],
    };
    const ctx = {
      spec: seedDress,
      pieces: result.pieces.map((p) => (p.id === skirt.id ? shortened : p)),
    } as unknown as DraftContext;
    const rows = dressWaistSeamRule.runMany!(ctx);
    expect(rows[0]).toMatchObject({ code: "DRESS_WAIST_SEAM_LENGTH", status: "fail", refs: ["front/waist"] });
    expect(rows[0]!.message.en).toContain("front");
    expect(rows[1]!.status).toBe("pass");
  });
});

describe("one-piece dress", () => {
  const result = generatePattern(onePieceDress, sizeM);
  const withSeam = generatePattern(seedDress, sizeM);

  it("has bodice pieces that run to the hem and no skirt pieces", () => {
    expect(result.pieces.some((p) => p.id.startsWith("skirt-"))).toBe(false);
    expect(piece(result, "bodice-front").name.en).toBe("Dress front");
    expect(piece(result, "bodice-back").edges.map((e) => e.id)).toContain("hem");
    expect(result.validation.status).not.toBe("fail");
  });

  it("turns the waist dart into a fisheye with equal legs", () => {
    for (const half of ["front", "back"] as const) {
      const darts = piece(result, `bodice-${half}`).darts;
      const upper = darts.find((d) => d.id === "waist-dart")!;
      const lower = darts.find((d) => d.id === "waist-dart-lower")!;
      const drafted = piece(withSeam, `bodice-${half}`).darts.find((d) => d.id === "waist-dart")!;
      expect(upper.apex).toEqual(drafted.apex);
      expect(lower.legs).toEqual(upper.legs);
      const [a, b] = dartLegLengthsMm(lower);
      expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
      expect(lower.apex.y).toBeGreaterThan(upper.legs[0].y);
    }
  });

  it("places the lower apex at the skirt dart length", () => {
    const legs: [Point, Point] = [
      { x: 110, y: 400 },
      { x: 80, y: 400 },
    ];
    expect(lowerApex(legs, "back", 2000)).toEqual({ x: 95, y: 400 + SKIRT_DART_LENGTH_MM.back });
    expect(lowerApex(legs, "front", 450).y).toBeCloseTo(430, 6);
  });

  it("matches the side seams front to back within 2 mm", () => {
    const front = edgeLengthMm(piece(result, "bodice-front"), "side", { closeDarts: true });
    const back = edgeLengthMm(piece(result, "bodice-back"), "side", { closeDarts: true });
    expect(Math.abs(front - back)).toBeLessThanOrEqual(2);
  });

  it("measures bust, waist and hip within 5 mm (FR-VAL-03)", () => {
    const rows = result.validation.checks.filter((c) => c.id === "FR-VAL-03");
    expect(rows.map((c) => c.code)).toEqual(["CIRCUMFERENCE_OK", "CIRCUMFERENCE_OK", "CIRCUMFERENCE_OK"]);
  });
});

describe("princess one-piece dress", () => {
  const result = generatePattern(princessOnePieceDress, sizeM);

  it("runs the style seams to the hem and pairs them within 2 mm", () => {
    for (const half of ["front", "back"] as const) {
      const centre = piece(result, `bodice-${half}-centre`);
      const side = piece(result, `bodice-${half}-side`);
      const style = centre.edges.find((e) => e.pairsWith?.pieceId === side.id)!;
      const centreMm = edgeLengthMm(centre, style.id);
      const sideMm = edgeLengthMm(side, style.id);
      expect(Math.abs(centreMm - sideMm)).toBeLessThanOrEqual(2);
      expect(centre.edges.some((e) => e.id === "hem")).toBe(true);
      expect(side.edges.some((e) => e.id === "hem")).toBe(true);
    }
    expect(result.validation.status).not.toBe("fail");
  });
});

describe("category seeds", () => {
  const chart = SIZE_MATRIX.filter((e) => e.source === "chart");

  it.each(Object.entries(CATEGORY_SEEDS))(
    "%s is schema-valid and passes FR-VAL on the chart sizes",
    (_category, spec) => {
      expect(chart).toHaveLength(5);
      for (const entry of chart) {
        const out = generatePattern(spec, entry.measurements);
        expect(patternResultSchema.safeParse(out).success).toBe(true);
        expect(out.validation.status, entry.id).not.toBe("fail");
      }
    },
    TIMEOUT_MS,
  );
});
