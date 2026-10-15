/* eslint-disable no-magic-numbers -- this file is a data table of body measurements in millimetres */
/**
 * The shared size matrix (issue #123, SRS §11): the 5 chart sizes plus 20 custom measurement sets.
 * Every engine property test and snapshot reads from here, never from its own copy.
 *
 * Chart sizes come from the default size chart fixture, so when the real chart lands only data changes.
 * Custom sets are `synthetic` today; Merna replaces them with anonymised real sets (`source: "real"`),
 * no code change. Real client data never goes in the repo.
 */
import fc from "fast-check";
import type { Measurements } from "@tafsila/schemas";
import { egyptianSizeChart } from "./egyptian-size-chart";

/** Where a matrix entry comes from. */
export type SizeMatrixSource = "chart" | "synthetic" | "real";

/** One body in the matrix. */
export interface SizeMatrixEntry {
  /** Stable id, used in test names and snapshot file names. */
  readonly id: string;
  /** Human label (English). */
  readonly label: string;
  /** Where the numbers come from. */
  readonly source: SizeMatrixSource;
  /** The 18 measurements in mm. */
  readonly measurements: Measurements;
}

/** Chart size labels in order. */
const CHART_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

/** The five chart entries, taken from the default size chart. */
const CHART_ENTRIES: readonly SizeMatrixEntry[] = CHART_SIZES.map((size) => ({
  id: `size-${size.toLowerCase()}`,
  label: `Chart size ${size}`,
  source: "chart" as const,
  measurements: egyptianSizeChart[size]!,
}));

/**
 * Builds a synthetic custom set: a chart size with some measurements replaced.
 *
 * @param id - Stable id.
 * @param label - Human label.
 * @param base - Chart size the set starts from.
 * @param overrides - Measurements that differ from the base, in mm.
 * @returns The matrix entry.
 */
function custom(
  id: string,
  label: string,
  base: (typeof CHART_SIZES)[number],
  overrides: Partial<Measurements>,
): SizeMatrixEntry {
  return {
    id,
    label,
    source: "synthetic",
    measurements: { ...egyptianSizeChart[base]!, ...overrides },
  };
}

/** The 20 custom sets covering the edges of the body types. */
const CUSTOM_ENTRIES: readonly SizeMatrixEntry[] = [
  custom("petite-s", "Petite, small", "S", {
    height: 1500,
    backLength: 360,
    frontLength: 385,
    armLength: 520,
    waistToKnee: 520,
    waistToFloor: 880,
    bustHeight: 220,
  }),
  custom("petite-m", "Petite, medium", "M", {
    height: 1520,
    backLength: 365,
    frontLength: 395,
    armLength: 530,
    waistToKnee: 530,
    waistToFloor: 900,
    bustHeight: 225,
  }),
  custom("tall-m", "Tall, medium", "M", {
    height: 1860,
    backLength: 440,
    frontLength: 475,
    armLength: 650,
    waistToKnee: 640,
    waistToFloor: 1180,
    bustHeight: 280,
  }),
  custom("tall-l", "Tall, large", "L", {
    height: 1900,
    backLength: 450,
    frontLength: 490,
    armLength: 670,
    waistToKnee: 650,
    waistToFloor: 1200,
    bustHeight: 285,
  }),
  custom("large-bust-small-waist", "Large bust, small waist", "M", {
    bust: 1100,
    highBust: 1040,
    underBust: 860,
    waist: 680,
    hip: 1000,
    bustPointDistance: 230,
    upperArm: 320,
  }),
  custom("large-bust-small-waist-xl", "Large bust, small waist, big frame", "XL", {
    bust: 1250,
    highBust: 1180,
    underBust: 990,
    waist: 840,
    hip: 1150,
    bustPointDistance: 250,
  }),
  custom("pear", "Pear, hip much wider than bust", "M", {
    bust: 880,
    highBust: 830,
    underBust: 760,
    waist: 700,
    hip: 1180,
    hipDepth: 215,
  }),
  custom("pear-l", "Pear, larger", "L", {
    bust: 960,
    highBust: 900,
    underBust: 820,
    waist: 780,
    hip: 1320,
    hipDepth: 225,
  }),
  custom("apple", "Apple, waist close to hip", "L", {
    bust: 1080,
    highBust: 1020,
    underBust: 940,
    waist: 1000,
    hip: 1040,
  }),
  custom("apple-xl", "Apple, waist close to hip, larger", "XL", {
    bust: 1180,
    highBust: 1110,
    underBust: 1020,
    waist: 1130,
    hip: 1170,
  }),
  custom("narrow-shoulders", "Narrow shoulders", "M", { shoulderWidth: 320, neck: 330 }),
  custom("narrow-shoulders-s", "Narrow shoulders, small", "S", {
    shoulderWidth: 300,
    neck: 320,
    upperArm: 240,
  }),
  custom("broad-shoulders", "Broad shoulders", "M", { shoulderWidth: 470, neck: 400 }),
  custom("broad-shoulders-xl", "Broad shoulders, larger", "XL", {
    shoulderWidth: 500,
    neck: 440,
    upperArm: 380,
  }),
  custom("long-arms", "Long arms", "M", { armLength: 710 }),
  custom("long-arms-l", "Long arms, large", "L", { armLength: 740, height: 1800 }),
  custom("short-arms", "Short arms", "M", { armLength: 460 }),
  custom("short-arms-s", "Short arms, small", "S", { armLength: 420, wrist: 140 }),
  custom("full-figure", "Full figure, plus size", "XXL", {
    bust: 1400,
    highBust: 1320,
    underBust: 1180,
    waist: 1250,
    hip: 1480,
    upperArm: 440,
    neck: 460,
  }),
  custom("slim-athletic", "Slim athletic", "S", {
    bust: 820,
    highBust: 780,
    underBust: 700,
    waist: 640,
    hip: 880,
    shoulderWidth: 400,
    upperArm: 260,
  }),
];

/** The size matrix: 5 chart sizes then 20 custom sets (25 entries). */
export const SIZE_MATRIX: readonly SizeMatrixEntry[] = [...CHART_ENTRIES, ...CUSTOM_ENTRIES];

/**
 * Integer between two bounds, inclusive.
 *
 * @param min - Lowest value in mm.
 * @param max - Highest value in mm.
 * @returns The arbitrary.
 */
function mm(min: number, max: number): fc.Arbitrary<number> {
  return fc.integer({ min, max });
}

/**
 * Generates valid measurement sets for property tests.
 * Ranges sit inside the hard M1 ranges of the engine; the order rules (high bust and under bust below bust,
 * knee above floor) hold by construction, so the engine reports no errors for any generated set.
 *
 * @returns An arbitrary of measurements in mm.
 */
export function arbMeasurements(): fc.Arbitrary<Measurements> {
  return fc
    .record({
      height: mm(1500, 1900),
      bust: mm(800, 1400),
      highBustGap: mm(20, 80),
      underBustGap: mm(100, 200),
      waist: mm(550, 1300),
      hip: mm(850, 1600),
      hipDepth: mm(150, 260),
      neck: mm(280, 480),
      shoulderWidth: mm(300, 500),
      backLength: mm(330, 520),
      frontExtra: mm(0, 80),
      bustPointDistance: mm(140, 280),
      bustHeight: mm(180, 400),
      armLength: mm(450, 700),
      upperArm: mm(200, 480),
      wrist: mm(120, 250),
      waistToKnee: mm(450, 750),
      waistToFloor: mm(800, 1250),
    })
    .map(({ highBustGap, underBustGap, frontExtra, bust, backLength, ...rest }) => ({
      unit: "mm" as const,
      ...rest,
      bust,
      highBust: bust - highBustGap,
      underBust: bust - underBustGap,
      backLength,
      frontLength: backLength + frontExtra,
    }));
}
