/**
 * Property tests of the sleeve styles and cuffs (issue #142): FR-VAL-01, -02, -04 and -05, the cuff length, the
 * declared hem ease and the geometry, across the size matrix, every allowed row of the combination table and both
 * fabric widths; every refused row fails with its code.
 */
import type { Measurements, PatternResult, ValidationCheck } from "@tafsila/schemas";
import { SIZE_MATRIX, arbMeasurements, sizeM } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { SLEEVE_EDGE } from "../../blocks/sleeve/ids";
import { SLEEVE_COMBINATIONS, SLEEVE_LENGTHS } from "../../constants/sleeve-style";
import { isClosed, selfIntersections } from "../../geometry";
import { edgeLengthMm } from "../../pieces/measure";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { sleeveCombinationIssue } from "./combinations";
import { type Sleeve, sleeveDesign } from "./test-support";

/** Wall-clock allowance on a busy CI runner; locally each case takes a small part of it. */
const PIPELINE_TEST_TIMEOUT_MS = 30_000;

/** Fabric widths the layout is tried on. */
const WIDTHS = [1100, 1500] as const;

/** Every allowed row of the table. */
const ALLOWED: Sleeve[] = Object.entries(SLEEVE_COMBINATIONS).flatMap(([type, lengths]) =>
  Object.entries(lengths).flatMap(([length, cuffs]) =>
    (cuffs ?? []).map((cuff) => ({ type, length, cuff }) as Sleeve),
  ),
);

/** Every refused type × length × cuff. */
const REFUSED: Sleeve[] = (["set-in", "cap", "puff", "bishop", "flutter"] as const).flatMap((type) =>
  SLEEVE_LENGTHS.flatMap((length) =>
    (["none", "band", "elastic"] as const)
      .map((cuff) => ({ type, length, cuff }))
      .filter((sleeve) => sleeveCombinationIssue({ sleeve }) !== undefined),
  ),
);

/**
 * The deterministic case list: two rows per body, stepping through the table so every row meets several bodies,
 * with the fabric width alternating.
 */
const CASES = SIZE_MATRIX.flatMap((e, i) =>
  [0, 1].map((k) => {
    const sleeve = ALLOWED[(2 * i + k) % ALLOWED.length]!;
    const width = WIDTHS[(i + k) % WIDTHS.length]!;
    return [
      `${e.id} ${sleeve.type}/${sleeve.length}/${sleeve.cuff} ${width}`,
      e.measurements,
      sleeve,
      width,
    ] as const;
  }),
);

/**
 * Drafts the seed blouse with a sleeve.
 *
 * @param m - Measurements.
 * @param sleeve - The sleeve.
 * @param fabricWidthMm - Fabric width.
 * @returns The pattern.
 */
function draft(m: Measurements, sleeve: Sleeve, fabricWidthMm: number = 1500): PatternResult {
  return generatePattern(sleeveDesign(sleeve), m, { ...DEFAULT_ENGINE_OPTIONS, fabricWidthMm });
}

/** Pieces the sleeve modules draw: a check naming one of them is a sleeve check. */
const SLEEVE_REF = /^(sleeve|cap-sleeve|flutter-sleeve|cuff|sleeve-casing)[/#]/;

/**
 * Whether a check is about the sleeve or its cuff (a random body can fail bodice checks the sleeve does not touch).
 *
 * @param c - A check.
 * @returns True for a sleeve check.
 */
function isSleeveCheck(c: ValidationCheck): boolean {
  return /^(CUFF_|SLEEVE_CAP_)/.test(c.code ?? "") || (c.refs ?? []).some((ref) => SLEEVE_REF.test(ref));
}

/**
 * Asserts the sleeve invariants of one pattern.
 *
 * @param r - The pattern.
 * @param sleeve - The sleeve it was drafted with.
 * @param scope - `all` checks every row (size matrix), `sleeve` only the sleeve rows (random bodies).
 */
function expectSleeveInvariants(r: PatternResult, sleeve: Sleeve, scope: "all" | "sleeve" = "all"): void {
  for (const id of ["FR-VAL-01", "FR-VAL-02", "FR-VAL-04", "FR-VAL-05"]) {
    const failed = r.validation.checks.filter(
      (c) => c.id === id && c.status === "fail" && (scope === "all" || isSleeveCheck(c)),
    );
    expect(failed, id).toEqual([]);
  }
  const drawn = r.pieces.filter((p) => scope === "all" || SLEEVE_REF.test(`${p.id}/`));
  for (const piece of drawn) {
    expect(isClosed(piece.stitchPath), piece.id).toBe(true);
    expect(selfIntersections(piece.stitchPath), piece.id).toEqual([]);
  }
  if (sleeve.cuff === "none") return;
  expect(r.validation.checks.find((c) => c.code?.startsWith("CUFF_LENGTH"))?.code).toBe("CUFF_LENGTH_OK");
  const cuff = r.pieces.find((p) => p.id === "cuff" || p.id === "sleeve-casing")!;
  const seam = cuff.edges.find((e) => e.id === "seam-1")!;
  const hemMm = edgeLengthMm(
    r.pieces.find((p) => p.id === "sleeve")!,
    SLEEVE_EDGE.hem,
  );
  expect(edgeLengthMm(cuff, seam.id) - seam.pairsWith!.intendedEaseMm!).toBeCloseTo(hemMm, 2);
}

describe("sleeve styles across the size matrix", () => {
  it.each(CASES)(
    "%s",
    (_name, m, sleeve, width) => {
      const r = draft(m, sleeve, width);
      expect(r.pieces.length).toBeGreaterThan(0);
      expectSleeveInvariants(r, sleeve);
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it("is deterministic", () => {
    for (const sleeve of [ALLOWED[0]!, ALLOWED.at(-1)!])
      expect(draft(sizeM, sleeve)).toEqual(draft(sizeM, sleeve));
  });

  it("covers every allowed row", () => {
    const met = new Set(CASES.map(([, , s]) => `${s.type}/${s.length}/${s.cuff}`));
    expect(met.size).toBe(ALLOWED.length);
  });
});

describe("sleeve styles over random bodies", () => {
  it(
    "draft passing sleeves or report a coded input failure",
    () => {
      fc.assert(
        fc.property(arbMeasurements(), fc.constantFrom(...ALLOWED), (m, sleeve) => {
          const r = draft(m, sleeve);
          if (r.pieces.length === 0) {
            expect(r.validation.checks.some((c) => /^(BODICE_|SLEEVE_|MEAS_)/.test(c.code ?? ""))).toBe(true);
            return;
          }
          expectSleeveInvariants(r, sleeve, "sleeve");
        }),
        { numRuns: 6 },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );
});

describe("refused sleeve rows", () => {
  it.each(REFUSED.map((s) => [`${s.type}/${s.length}/${s.cuff}`, s] as const))(
    "%s fails with its code",
    (_name, sleeve) => {
      const code = sleeveCombinationIssue({ sleeve })!;
      const r = draft(sizeM, sleeve);
      expect(r.pieces).toEqual([]);
      expect(r.validation.checks.find((c) => c.code === code)?.status).toBe("fail");
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );
});
