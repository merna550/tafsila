/**
 * Property tests of the bodice shaping modules (issue #138): FR-VAL-01 seams ≤ 2 mm, FR-VAL-04 notches ≤ 2 mm,
 * FR-VAL-03 bust and waist ± 5 mm after the dart manipulation, and closed simple panels, across the size matrix,
 * every fit, and with and without set-in sleeves.
 */
import type { DesignSpec, EaseProfile, Measurements, ValidationCheck } from "@tafsila/schemas";
import { SIZE_MATRIX, dartedBlouse, setInSleeveBlouse } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { BodiceFit } from "../../constants/ease";
import { isClosed, selfIntersections } from "../../geometry";
import type { DraftContext } from "../../pipeline/draft-context";
import { coreChecks, shapedContext } from "../../test-utils/shaped-context";
import { STYLE_EDGE_ID } from "./panel-parts";

type Shaping = NonNullable<DesignSpec["bodice"]>["shaping"];

const SHAPINGS: readonly Shaping[] = ["princess-shoulder", "princess-armhole", "none"];
const FITS: readonly BodiceFit[] = ["fitted", "semi-fitted", "loose"];
const PROFILES: readonly EaseProfile[] = ["fitted", "regular", "loose"];
const BASES = [dartedBlouse, setInSleeveBlouse] as const;

/** SRS tolerances. */
const SEAM_MM = 2;
const NOTCH_MM = 2;
const CIRCUMFERENCE_MM = 5;

/** One body, shaping, fit, ease profile and sleeve choice. */
interface Case {
  readonly id: string;
  readonly spec: DesignSpec;
  readonly profile: EaseProfile;
  readonly measurements: Measurements;
}

const CASES: Case[] = SIZE_MATRIX.flatMap((entry, i) =>
  SHAPINGS.flatMap((shaping) =>
    FITS.map((fit, j) => {
      const base = BASES[(i + j) % BASES.length]!;
      return {
        id: `${entry.id} ${shaping} ${fit} ${base.sleeve?.type}`,
        spec: { ...base, bodice: { ...base.bodice!, shaping, fit } },
        profile: PROFILES[(i + j) % PROFILES.length]!,
        measurements: entry.measurements,
      };
    }),
  ),
);

/** Contexts and checks per case, computed once (drafting is pure). */
const DRAFTED = new Map<Case, { ctx: DraftContext; checks: ValidationCheck[] }>();

/**
 * The drafted context and core checks of a case, once.
 *
 * @param c - The case.
 * @returns Context and checks.
 */
function drafted(c: Case): { ctx: DraftContext; checks: ValidationCheck[] } {
  const hit = DRAFTED.get(c);
  if (hit) return hit;
  const ctx = shapedContext(c.spec, c.measurements, c.profile);
  const value = { ctx, checks: coreChecks(ctx) };
  DRAFTED.set(c, value);
  return value;
}

const arbCase = fc.constantFrom(...CASES);
const ALL = { numRuns: CASES.length };

/**
 * The checks of one requirement.
 *
 * @param checks - All checks.
 * @param id - Requirement id.
 * @returns The matching checks.
 */
function of(checks: readonly ValidationCheck[], id: ValidationCheck["id"]): ValidationCheck[] {
  return checks.filter((c) => c.id === id);
}

describe("bodice shaping across the size matrix", () => {
  it("FR-VAL-01: every paired seam, princess seams included, matches within 2 mm", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const seams = of(drafted(c).checks, "FR-VAL-01");
        for (const s of seams) {
          expect(
            Math.abs((s.measuredMm ?? 0) - (s.expectedMm ?? 0)),
            `${c.id} ${s.refs?.join(" ")}`,
          ).toBeLessThanOrEqual(SEAM_MM);
        }
        if (c.spec.bodice!.shaping !== "none") {
          expect(seams.filter((s) => s.refs?.some((r) => r.endsWith(`/${STYLE_EDGE_ID}`)))).toHaveLength(2);
        }
      }),
      ALL,
    );
  });

  it("FR-VAL-04: the bust-level and sleeve notches align within 2 mm", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const notches = of(drafted(c).checks, "FR-VAL-04");
        expect(
          notches.every((n) => n.code === "NOTCH_OK" && (n.measuredMm ?? 0) <= NOTCH_MM),
          c.id,
        ).toBe(true);
        const bust = notches.filter((n) => n.refs?.some((r) => r.includes("#princess-bust")));
        expect(bust).toHaveLength(c.spec.bodice!.shaping === "none" ? 0 : 2);
      }),
      ALL,
    );
  });

  it("FR-VAL-03: bust and waist circumference stay within 5 mm after the manipulation", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const lines = of(drafted(c).checks, "FR-VAL-03");
        expect(lines.map((l) => l.refs?.[0]?.split(":").at(-1))).toEqual(["bodice-bust", "bodice-waist"]);
        for (const l of lines) {
          expect(Math.abs(l.measuredMm! - l.expectedMm!), `${c.id} ${l.code}`).toBeLessThanOrEqual(
            CIRCUMFERENCE_MM,
          );
        }
      }),
      ALL,
    );
  });

  it("draws closed, simple panels with no darts left on a princess bodice", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const bodice = drafted(c).ctx.pieces.filter((p) => p.id.startsWith("bodice"));
        expect(bodice).toHaveLength(c.spec.bodice!.shaping === "none" ? 2 : 4);
        for (const p of bodice) {
          expect(
            isClosed(p.stitchPath) && selfIntersections(p.stitchPath).length === 0,
            `${c.id} ${p.id}`,
          ).toBe(true);
        }
        const fronts = bodice.filter((p) => p.id.startsWith("bodice-front"));
        expect(fronts.every((p) => p.darts.length === 0)).toBe(true);
      }),
      ALL,
    );
  });
});
