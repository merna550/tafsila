/** Property tests of the bodice block (issue #128): FR-VAL-01, -03, -05, -07 across the size matrix. */
import { pieceSchema, type Dart, type EaseProfile, type Point } from "@tafsila/schemas";
import { SIZE_MATRIX, arbMeasurements, dartedBlouse } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { BodiceFit } from "../../constants/ease";
import {
  intersectSegments,
  isClosed,
  lineSeg,
  pointInPolygon,
  samplePath,
  segmentPoints,
  selfIntersections,
} from "../../geometry";
import { completePiece, generatePattern } from "../../pipeline/generate-pattern";
import { dartLegLengthsMm, edgeLengthMm } from "../../pieces/measure";
import { bodiceCase } from "../../test-utils/bodice-input";
import { draftBodice } from "./draft-bodice";

const PROFILES: EaseProfile[] = ["fitted", "regular", "loose"];
const FITS: BodiceFit[] = ["fitted", "semi-fitted", "loose"];
const CASES = SIZE_MATRIX.flatMap((e) =>
  PROFILES.flatMap((p) => FITS.map((f) => ({ id: e.id, m: e.measurements, p, f }))),
);
const arbCase = fc.constantFrom(...CASES);
const ALL = { numRuns: CASES.length };

/** SRS tolerances. */
const SEAM_MM = 2;
const CIRCUMFERENCE_MM = 5;
const DART_LEG_MM = 1;

/**
 * The closed outline of a dart (apex, legs).
 *
 * @param dart - The dart.
 * @returns Its three corners.
 */
function triangle(dart: Dart): Point[] {
  return [dart.apex, dart.legs[0], dart.legs[1]];
}

/**
 * Whether two triangles overlap: a corner inside the other or two sides crossing.
 *
 * @param a - First triangle.
 * @param b - Second triangle.
 * @returns True when they overlap.
 */
function trianglesOverlap(a: Point[], b: Point[]): boolean {
  const sides = (t: Point[]) => t.map((p, i) => lineSeg(p, t[(i + 1) % t.length]!));
  if (a.some((p) => pointInPolygon(p, b)) || b.some((p) => pointInPolygon(p, a))) return true;
  return sides(a).some((s) => sides(b).some((o) => intersectSegments(s, o).length > 0));
}

/** Sample points per cubic for the armhole direction check (enough to see a dip of a tenth of a mm). */
const CURVE_SAMPLES = 16;

/** Drafts per matrix case, computed once and shared by every property (the draft is pure). */
const DRAFTS = new Map<(typeof CASES)[number], ReturnType<typeof draftUncached>>();

/**
 * Drafts one matrix case.
 *
 * @param c - The case.
 * @returns The case input and draft.
 */
function draftUncached(c: (typeof CASES)[number]) {
  const bc = bodiceCase(c.m, c.p, c.f);
  return { ...bc, d: draftBodice(bc.input) };
}

/**
 * Drafts one matrix case, once.
 *
 * @param c - The case.
 * @returns The case input and draft.
 */
function draft(c: (typeof CASES)[number]) {
  const hit = DRAFTS.get(c);
  if (hit) return hit;
  const out = draftUncached(c);
  DRAFTS.set(c, out);
  return out;
}

describe("bodice properties across the size matrix (225 cases)", () => {
  it("FR-VAL-01: side and shoulder seams match within 2 mm", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const { d } = draft(c);
        const side = edgeLengthMm(d.front, "side", { closeDarts: true }) - edgeLengthMm(d.back, "side");
        const ease = d.back.edges.find((e) => e.id === "shoulder")!.pairsWith!.intendedEaseMm ?? 0;
        const shoulder = edgeLengthMm(d.back, "shoulder") - edgeLengthMm(d.front, "shoulder") - ease;
        expect(Math.abs(side)).toBeLessThanOrEqual(SEAM_MM);
        expect(Math.abs(shoulder)).toBeLessThanOrEqual(SEAM_MM);
      }),
      ALL,
    );
  });

  it("FR-VAL-03: bust and waist equal the measurement plus total ease within 5 mm", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const { d, resolved } = draft(c);
        const k = d.keyPoints;
        const bust = 2 * (k["bodice.back.underarm"].x + k["bodice.front.underarm"].x);
        const waist =
          2 *
          (edgeLengthMm(d.back, "waist", { closeDarts: true }) +
            edgeLengthMm(d.front, "waist", { closeDarts: true }));
        expect(Math.abs(bust - (c.m.bust + resolved.totalEaseMm.bust))).toBeLessThanOrEqual(CIRCUMFERENCE_MM);
        expect(Math.abs(waist - (c.m.waist + resolved.totalEaseMm.waist))).toBeLessThanOrEqual(
          CIRCUMFERENCE_MM,
        );
      }),
      ALL,
    );
  });

  it("FR-VAL-07: dart legs equal within 1 mm and the apexes not past the bust point", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const { d } = draft(c);
        for (const dart of [...d.back.darts, ...d.front.darts]) {
          const [a, b] = dartLegLengthsMm(dart);
          expect(Math.abs(a - b)).toBeLessThanOrEqual(DART_LEG_MM);
        }
        const bp = d.keyPoints["bodice.front.bustPoint"];
        expect(d.keyPoints["bodice.front.bustDartApex"].x).toBeGreaterThanOrEqual(bp.x);
        expect(d.keyPoints["bodice.front.waistDartApex"].y).toBeGreaterThanOrEqual(bp.y);
      }),
      ALL,
    );
  });

  it("FR-VAL-05: closed outlines without self-intersections, valid pieces, darts inside and apart", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const { d } = draft(c);
        for (const piece of [d.back, d.front]) {
          expect(isClosed(piece.stitchPath)).toBe(true);
          expect(selfIntersections(piece.stitchPath)).toEqual([]);
          expect(pieceSchema.safeParse(completePiece(piece)).success).toBe(true);
          const outline = samplePath(piece.stitchPath);
          for (const dart of piece.darts) expect(pointInPolygon(dart.apex, outline)).toBe(true);
        }
        const [bust, waist] = d.front.darts.map(triangle);
        if (bust && waist) expect(trianglesOverlap(bust, waist)).toBe(false);
      }),
      ALL,
    );
  });

  it("curves: the armhole runs downwards and the neck stays in its box", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const { d } = draft(c);
        // Collect the worst values first and assert once per case: an expect per sample point was the cost.
        const drops = [d.armhole.back, d.armhole.front].map((arm) => {
          const ys = samplePath(arm, CURVE_SAMPLES).map((p) => p.y);
          return Math.min(...ys.slice(1).map((y, i) => y - ys[i]!));
        });
        expect(Math.min(...drops)).toBeGreaterThanOrEqual(-1e-9);
        const neckW = d.keyPoints["bodice.back.neckPoint"].x;
        const boxes = [
          [d.back, d.keyPoints["bodice.back.nape"].y],
          [d.front, d.keyPoints["bodice.front.neckCF"].y],
        ] as const;
        for (const [piece, depth] of boxes) {
          // The control points bound the cubic, so checking them proves the whole curve is in the box.
          const pts = segmentPoints(piece.stitchPath[0]!);
          const inBox = pts.every(
            (p) => p.x >= -0.5 && p.x <= neckW + 0.5 && p.y >= -0.5 && p.y <= depth + 0.5,
          );
          expect(inBox).toBe(true);
        }
      }),
      ALL,
    );
  });
});

describe("bodice on random bodies", () => {
  it("never throws: two valid pieces, or a fail with a BODICE_ or MEAS_ code", () => {
    fc.assert(
      fc.property(arbMeasurements(), (m) => {
        const r = generatePattern(dartedBlouse, m);
        if (r.pieces.length > 0) {
          expect(r.pieces.map((p) => p.id)).toEqual(["bodice-back", "bodice-front"]);
          return;
        }
        expect(r.validation.status).toBe("fail");
        expect(r.validation.checks.some((x) => /^(BODICE_|MEAS_)/.test(x.code ?? ""))).toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});
