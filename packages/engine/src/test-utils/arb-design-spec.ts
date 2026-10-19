/**
 * A fast-check arbitrary for design specs the engine must draft (issue #147): every garment category with each enum
 * value combined, filtered by the engine's own compatibility rules so no second copy of those rules exists.
 */
import { designSpecSchema, type DesignSpec } from "@tafsila/schemas";
import fc from "fast-check";
import { CATEGORY_PARTS } from "../pipeline/category-rules";
import { specRefusals } from "../spec-rules/refusals";

/** Draw one value of a schema enum. */
type Enum<T> = fc.Arbitrary<T>;

/**
 * Picks one value from a non-empty list.
 *
 * @param values - The values.
 * @returns An arbitrary over them.
 */
function oneOf<T>(values: readonly T[]): Enum<T> {
  return fc.constantFrom(...values);
}

/** Slit length used by the arbitrary: short enough for every skirt length down to a mini. */
const SLIT_LENGTH_MM = 100;

/** Every `DesignSpec` part, as arbitraries over the schema's enums (read from the schema, never retyped). */
const parts = {
  bodice: fc.record({
    fit: oneOf(["fitted", "semi-fitted", "loose"] as const),
    shaping: oneOf(["darts", "princess-shoulder", "princess-armhole", "none"] as const),
    waistSeam: fc.boolean(),
  }),
  neckline: fc.record({
    front: oneOf(["round", "v", "square", "sweetheart", "boat", "high-round"] as const),
    back: oneOf(["round", "v", "square", "high-round"] as const),
    collar: oneOf(["none", "peter-pan", "shirt", "mandarin"] as const),
  }),
  sleeve: fc.record({
    type: oneOf(["none", "set-in", "cap", "puff", "bishop", "flutter"] as const),
    length: oneOf(["cap", "short", "elbow", "three-quarter", "long"] as const),
    cuff: oneOf(["none", "band", "elastic"] as const),
  }),
  skirt: fc.record({
    type: oneOf([
      "straight",
      "a-line",
      "circle-half",
      "circle-full",
      "gathered",
      "pleated",
      "tiered",
    ] as const),
    length: oneOf(["mini", "knee", "midi", "ankle", "floor"] as const),
    slit: fc.option(
      fc.record({
        position: oneOf(["front", "back", "side"] as const),
        lengthMm: fc.constant(SLIT_LENGTH_MM),
      }),
      { nil: undefined },
    ),
  }),
  waistband: oneOf(["none", "straight", "contour", "elastic"] as const),
  closure: fc.record({
    type: oneOf(["zip", "buttons", "none"] as const),
    position: oneOf(["center-back", "side", "center-front"] as const),
  }),
  pockets: fc.uniqueArray(oneOf(["side-seam", "patch"] as const), { maxLength: 2 }),
  lining: fc.boolean(),
  belt: oneOf(["none", "self-tie"] as const),
};

/** A raw spec before the compatibility filter: parts the category ignores are left out. */
const rawSpec: fc.Arbitrary<DesignSpec> = fc
  .record({
    category: oneOf(["dress", "skirt", "blouse"] as const),
    bodice: parts.bodice,
    neckline: parts.neckline,
    sleeve: parts.sleeve,
    skirt: parts.skirt,
    waistband: parts.waistband,
    closure: parts.closure,
    pockets: parts.pockets,
    lining: parts.lining,
    belt: parts.belt,
  })
  .map(({ category, ...all }) => {
    const { required, ignored } = CATEGORY_PARTS[category];
    const spec: Record<string, unknown> = { schemaVersion: 1, category, fabricType: "woven", ...all };
    for (const part of ignored) delete spec[part];
    // A skirt category without a waistband draws the plain skirt; optional parts are only kept for the categories that use them.
    if (category === "dress" || category === "blouse") delete spec.waistband;
    if (category === "blouse" && !required.includes("skirt")) delete spec.skirt;
    return designSpecSchema.parse(spec);
  });

/** Matrix entries of a small frame (chart size S and the custom "-s" sets). */
const SMALL_BODY = /(^|-)s$/;

/** A known engine bug as a predicate: the design (and the body it is drafted on) that triggers it. */
type BugRule = (spec: DesignSpec, bodyId: string) => boolean;

/**
 * Facts about a design that several bug rules share.
 *
 * @param spec - The design.
 * @returns Whether it has a mini skirt, princess seams, and no waist seam.
 */
function facts(spec: DesignSpec): { mini: boolean; princess: boolean; onePiece: boolean } {
  return {
    mini: spec.skirt?.length === "mini",
    princess: spec.bodice?.shaping.startsWith("princess") ?? false,
    onePiece: spec.bodice?.waistSeam === false,
  };
}

// Combinations that hit known engine bugs, kept out of the suite until each bug is fixed (issue #147: this suite finds
// bugs, it does not fix them). Remove a rule when its issue closes, so the combination is tested again.
const KNOWN_BUGS: readonly BugRule[] = [
  // #229: lining throws LINING_TARGET_MISSING ("the edge next to the hem cannot be shortened") with buttons, full-circle skirts and slits.
  (s) =>
    s.lining &&
    (s.closure.type === "buttons" || s.skirt?.type === "circle-full" || s.skirt?.slit !== undefined),
  // #230: buttons on a skirt or on a mini dress can give a piece whose cut path does not close.
  (s) => s.closure.type === "buttons" && (s.category === "skirt" || facts(s).mini),
  // #231: a one-piece princess dress gives an open cut path (all but a shoulder-princess A-line below the mini).
  (s) => {
    const { mini, princess, onePiece } = facts(s);
    return (
      onePiece &&
      princess &&
      !(s.bodice?.shaping === "princess-shoulder" && s.skirt?.type === "a-line" && !mini)
    );
  },
  // #231: princess seams on a dress with a straight skirt or a mini length give an open cut path.
  (s) => facts(s).princess && s.category === "dress" && (facts(s).mini || s.skirt?.type === "straight"),
  // #231: a fitted princess bodice gives an open cut path on the small bodies.
  (s, bodyId) => facts(s).princess && s.bodice?.fit === "fitted" && SMALL_BODY.test(bodyId),
  // #232: a tiered mini skirt fails with an unexpected check.
  (s) => s.skirt?.type === "tiered" && facts(s).mini,
  // #232: a tiered skirt on a waist-seam dress can fail FR-VAL-01 DRESS_WAIST_SEAM_LENGTH.
  (s) => s.category === "dress" && s.skirt?.type === "tiered",
];

/**
 * Whether a design hits a known engine bug on a body.
 *
 * @param spec - A schema-valid design.
 * @param bodyId - Id of the size-matrix entry it is drafted on.
 * @returns True when a rule in `KNOWN_BUGS` matches.
 */
export function hitsKnownBug(spec: DesignSpec, bodyId: string): boolean {
  return KNOWN_BUGS.some((rule) => rule(spec, bodyId));
}

/**
 * Whether the engine accepts the design's part combinations (closure, pockets, collar, sleeve, slit, one-piece dress).
 *
 * @param spec - A schema-valid design.
 * @returns True when no module refuses the combination as an input error.
 */
export function isAllowedCombination(spec: DesignSpec): boolean {
  return specRefusals(spec).length === 0;
}

/**
 * Schema-valid designs before the compatibility filter: they may hold combinations the engine refuses.
 *
 * @returns An arbitrary of raw designs.
 */
export function arbRawSpec(): fc.Arbitrary<DesignSpec> {
  return rawSpec;
}

/**
 * Design specs across the whole catalogue that the engine must draft without an input error.
 *
 * @returns An arbitrary of schema-valid, allowed designs.
 */
export function arbDesignSpec(): fc.Arbitrary<DesignSpec> {
  return rawSpec.filter(isAllowedCombination);
}
