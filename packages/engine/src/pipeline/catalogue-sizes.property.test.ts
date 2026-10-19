/**
 * Catalogue x size-matrix property suite (issue #147, FR-PAT-01..06): every allowed design on every matrix body is
 * drafted without throwing, gives a schema-valid result and a report with only expected notes. A failure prints the
 * shrunk spec and the measurements (fast-check shrinks the spec; the body is one of the 25 matrix entries).
 */
import { patternResultSchema } from "@tafsila/schemas";
import { SIZE_MATRIX, sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { arbDesignSpec, hitsKnownBug } from "../test-utils/arb-design-spec";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "./generate-pattern";

/**
 * Runs per property (decision 147: 60, not the planned 150, to stay near 10 s with coverage on CI; `FC_RUNS` raises it
 * for a nightly run).
 */
const CATALOGUE_RUNS = Number(process.env.FC_RUNS ?? 60);

/** Warning codes a valid design may raise on some bodies: they advise the user and never block the pattern. */
const ALLOWED_WARNINGS: ReadonlySet<string> = new Set([
  "WAIST_HIP_PASS_TIGHT", // a skirt waist smaller than the hip needs an opening
  "NECK_HEAD_OPENING_TIGHT", // a closed neckline smaller than the head
  "PLAUS_WALKING_EASE", // a narrow hem on a long skirt
  "WAISTBAND_CONTOUR_FLAT", // a contour band on a straight-topped skirt falls back to a straight band
  "CLOSURE_HIP_OPENING_TIGHT", // a zip opening smaller than the hip
  "BODICE_DART_FREE_FITTED", // a fitted bodice without darts
  "NECK_FRONT_DEPTH_CLAMPED", // a neckline deeper than the short front of a petite body is made shallower
]);

/** Input refusals that depend on the body or length, so the arbitrary cannot filter them out: a `fail` with only these is expected. */
const ALLOWED_REFUSALS: ReadonlySet<string> = new Set([
  "POCKET_NO_ROOM",
  "CLOSURE_ZIP_TOO_LONG",
  "CLOSURE_UNSUPPORTED",
]);

describe("catalogue x size matrix", () => {
  it("drafts every allowed design on every matrix body with only expected notes", () => {
    fc.assert(
      fc.property(arbDesignSpec(), fc.constantFrom(...SIZE_MATRIX), (spec, entry) => {
        fc.pre(!hitsKnownBug(spec, entry.id));
        const result = generatePattern(spec, entry.measurements, {
          ...DEFAULT_ENGINE_OPTIONS,
          sizeLabel: entry.id,
        });
        const parsed = patternResultSchema.safeParse(result);
        const context = JSON.stringify({
          spec,
          measurements: entry.measurements,
          schemaIssue: parsed.error?.issues[0],
        });
        expect(parsed.success, context).toBe(true);
        for (const check of result.validation.checks.filter((c) => c.status !== "pass")) {
          const allowed = check.status === "warn" ? ALLOWED_WARNINGS : ALLOWED_REFUSALS;
          expect(allowed.has(check.code ?? ""), `${check.id} ${check.code} ${context}`).toBe(true);
        }
      }),
      { numRuns: CATALOGUE_RUNS },
    );
  });

  it("refuses a design the arbitrary excludes (guards the allow-lists against drift)", () => {
    const oneRound = {
      ...vNeckHalfCircleDress,
      bodice: { fit: "fitted" as const, shaping: "darts" as const, waistSeam: false },
      skirt: { type: "circle-full" as const, length: "knee" as const },
    };
    const result = generatePattern(oneRound, sizeM, DEFAULT_ENGINE_OPTIONS);
    expect(result.validation.status).toBe("fail");
    expect(result.validation.checks.some((c) => c.code === "DRESS_ONE_PIECE_SKIRT_UNSUPPORTED")).toBe(true);
  });
});
