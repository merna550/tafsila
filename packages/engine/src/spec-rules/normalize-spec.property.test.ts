/** Property tests: normalising any schema-valid design gives one the engine accepts (issue #238, like #147). */
import { designSpecSchema, type DesignSpec } from "@tafsila/schemas";
import { SIZE_MATRIX } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../pipeline/generate-pattern";
import { arbRawSpec, hitsKnownBug } from "../test-utils/arb-design-spec";
import { FEATURE_PATHS, withFeatureValue } from "./feature-paths";
import { normalizeSpec } from "./normalize-spec";
import { specRefusals } from "./refusals";
import { specOptions } from "./spec-options";

/** Runs per property (60 like #147; `FC_RUNS` raises it). */
const RUNS = Number(process.env.FC_RUNS ?? 60);

/** Input errors that depend on the body, so the picker cannot know them. */
const BODY_CODES: ReadonlySet<string> = new Set(["POCKET_NO_ROOM", "CLOSURE_ZIP_TOO_LONG"]);

describe("normalizeSpec (property)", () => {
  it("leaves no refusal and stays schema-valid", () => {
    fc.assert(
      fc.property(arbRawSpec(), (raw) => {
        const { spec } = normalizeSpec(raw);
        expect(specRefusals(spec), JSON.stringify(raw)).toEqual([]);
        expect(designSpecSchema.safeParse(spec).success).toBe(true);
        expect(normalizeSpec(spec).changed).toEqual([]);
      }),
      { numRuns: RUNS },
    );
  });

  it("is drafted on S and XXL without a design-combination refusal", () => {
    const bodies = ["size-s", "size-xxl"].map((id) => SIZE_MATRIX.find((e) => e.id === id)!);
    fc.assert(
      fc.property(arbRawSpec(), fc.constantFrom(...bodies), (raw, entry) => {
        const { spec } = normalizeSpec(raw);
        fc.pre(!hitsKnownBug(spec, entry.id)); // known bugs #229-#232
        const result = generatePattern(spec, entry.measurements, DEFAULT_ENGINE_OPTIONS);
        const refusals = result.validation.checks.filter(
          (c) => c.status === "fail" && !BODY_CODES.has(c.code ?? ""),
        );
        expect(refusals, JSON.stringify(spec)).toEqual([]);
      }),
      { numRuns: RUNS },
    );
  });

  it("never marks a refused value as allowed (no false allowed)", () => {
    fc.assert(
      fc.property(arbRawSpec(), (raw) => {
        const base: DesignSpec = normalizeSpec(raw).spec;
        const options = specOptions(base);
        for (const path of FEATURE_PATHS) {
          for (const option of options[path].values.filter((o) => o.allowed)) {
            const next = withFeatureValue(base, path, option.value);
            expect(specRefusals(next), `${path}=${String(option.value)} ${JSON.stringify(base)}`).toEqual([]);
          }
        }
      }),
      { numRuns: RUNS },
    );
  });
});
