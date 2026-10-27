import {
  dartedBlouse,
  gatheredKneeSkirt,
  linedCircleSkirt,
  pleatedKneeSkirt,
  puffSleeveBlouse,
  seedDress,
  vNeckHalfCircleDress,
} from "@tafsila/test-fixtures";
import * as fixtures from "@tafsila/test-fixtures";
import { designSpecSchema, fabricRecommendationResultSchema, type DesignSpec } from "@tafsila/schemas";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DRAFT_CATALOGUE } from "./draft-catalogue";
import { DRAFT_RULES } from "./draft-rules";
import { NEUTRAL_REASON } from "./reasons";
import { recommend } from "./recommend";

const run = (spec: DesignSpec) => recommend(spec, DRAFT_CATALOGUE, DRAFT_RULES);
const ids = (r: ReturnType<typeof run>) => r.recommended.map((x) => x.fabricId);
const avoided = (r: ReturnType<typeof run>) => r.avoid.map((x) => x.fabricId);

describe("recommend, concrete designs", () => {
  it("a half-circle dress favours draping fabrics and avoids taffeta and poplin", () => {
    const r = run(vNeckHalfCircleDress);
    expect(ids(r)).toContain("crepe");
    expect(avoided(r)).toEqual(expect.arrayContaining(["taffeta", "cotton-poplin"]));
    expect(r.avoid.find((a) => a.fabricId === "taffeta")?.ruleId).toBe("circle-skirt-drape");
  });
  it("a puff-sleeve blouse ranks a fabric with body above chiffon", () => {
    const r = run(puffSleeveBlouse);
    const rank = (id: string) => (ids(r).includes(id) ? ids(r).indexOf(id) : Infinity);
    expect(rank("cotton-poplin")).toBeLessThan(rank("chiffon"));
    expect(rank("crepe")).toBeLessThan(rank("viscose"));
  });
  it("a lined circle skirt returns 3 to 5 fabrics with reasons in both languages", () => {
    const r = run(linedCircleSkirt);
    expect(r.recommended.length).toBeGreaterThanOrEqual(3);
    expect(r.recommended.length).toBeLessThanOrEqual(5);
    for (const x of r.recommended) expect(x.reason.ar && x.reason.en).toBeTruthy();
  });
  it("a spec that matches no rule still returns 3 fabrics with the neutral reason", () => {
    const r = recommend(dartedBlouse, DRAFT_CATALOGUE, []);
    expect(r.recommended).toHaveLength(3);
    expect(r.avoid).toEqual([]);
    for (const x of r.recommended) expect(x.reason).toEqual(NEUTRAL_REASON);
  });
});

describe("recommend, snapshots", () => {
  const designs = {
    vNeckHalfCircleDress,
    dartedBlouse,
    puffSleeveBlouse,
    gatheredKneeSkirt,
    pleatedKneeSkirt,
    linedCircleSkirt,
    seedDress,
  };
  it.each(Object.entries(designs))("%s", (_name, spec) => {
    const r = run(spec);
    expect({
      recommended: r.recommended.map((x) => [x.fabricId, x.score, x.reason.en]),
      avoid: r.avoid.map((a) => [a.fabricId, a.ruleId]),
    }).toMatchSnapshot();
  });
});

describe("recommend, every fixture design", () => {
  const specs = Object.entries(fixtures).filter(([, v]) => designSpecSchema.safeParse(v).success) as [
    string,
    DesignSpec,
  ][];
  it("finds fixture designs", () => {
    expect(specs.length).toBeGreaterThan(20);
  });
  it.each(specs)("%s: 3 to 5 results, valid shape, lists do not overlap", (_name, spec) => {
    const r = run(spec);
    expect(fabricRecommendationResultSchema.safeParse(r).success).toBe(true);
    expect(ids(r).filter((id) => avoided(r).includes(id))).toEqual([]);
  });
});

const pick = <T extends string>(values: readonly T[]) => fc.constantFrom(...values);
const specArb: fc.Arbitrary<DesignSpec> = fc.record({
  schemaVersion: fc.constant(1 as const),
  category: pick(["dress", "skirt", "blouse"] as const),
  fabricType: fc.constant("woven" as const),
  bodice: fc.record({
    fit: pick(["fitted", "semi-fitted", "loose"] as const),
    shaping: pick(["darts", "none"] as const),
    waistSeam: fc.boolean(),
  }),
  neckline: fc.record({
    front: pick(["round", "v"] as const),
    back: pick(["round", "v"] as const),
    collar: pick(["none", "peter-pan", "shirt", "mandarin"] as const),
  }),
  sleeve: fc.record({
    type: pick(["none", "set-in", "cap", "puff", "bishop", "flutter"] as const),
    length: pick(["short", "long"] as const),
    cuff: pick(["none", "band", "elastic"] as const),
  }),
  skirt: fc.record({
    type: pick([
      "straight",
      "a-line",
      "circle-half",
      "circle-full",
      "gathered",
      "pleated",
      "tiered",
    ] as const),
    length: pick(["mini", "knee", "midi", "ankle", "floor"] as const),
  }),
  waistband: pick(["none", "straight", "contour", "elastic"] as const),
  closure: fc.record({
    type: pick(["zip", "buttons", "none"] as const),
    position: pick(["center-back", "side", "center-front"] as const),
  }),
  pockets: fc.subarray(["side-seam", "patch"] as const),
  lining: fc.boolean(),
  belt: pick(["none", "self-tie"] as const),
});

describe("recommend, properties", () => {
  it("is deterministic, order independent, 3 to 5 long and its lists never overlap", () => {
    fc.assert(
      fc.property(specArb, (spec) => {
        const a = run(spec);
        expect(run(spec)).toEqual(a);
        expect(recommend(spec, [...DRAFT_CATALOGUE].reverse(), [...DRAFT_RULES].reverse())).toEqual(a);
        expect(a.recommended.length).toBeGreaterThanOrEqual(3);
        expect(a.recommended.length).toBeLessThanOrEqual(5);
        expect(ids(a).filter((id) => avoided(a).includes(id))).toEqual([]);
      }),
      { numRuns: 300 },
    );
  });
});
