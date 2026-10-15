/** Ease tables (issue #126, decision 126-ease-tables). All values are millimetres for woven fabric. */
import type { DesignSpec, EaseProfile } from "@tafsila/schemas";

/** Body lines that carry ease. `acrossBack` is the whole back width and is style ease only. */
export type EaseLine = "bust" | "waist" | "hip" | "upperArm" | "acrossBack";

/** Total ease over the whole circumference (or width) for each body line. */
export type EaseTable = Readonly<Record<EaseLine, number>>;

/** The bodice fit chosen in the design spec. */
export type BodiceFit = NonNullable<DesignSpec["bodice"]>["fit"];

/**
 * Total ease per ease profile and body line, in mm over the whole circumference.
 * The `regular` column for bust, waist and hip is SRS §6.2. The other columns are proposals Merna approves in the PR.
 * Why each line (see `EASE_WHY`).
 */
export const EASE_TOTAL_MM: Readonly<Record<EaseProfile, EaseTable>> = {
  fitted: { bust: 60, waist: 20, hip: 30, upperArm: 40, acrossBack: 0 },
  regular: { bust: 80, waist: 40, hip: 50, upperArm: 50, acrossBack: 0 },
  loose: { bust: 120, waist: 70, hip: 80, upperArm: 80, acrossBack: 20 },
};

/** One-line reason for each row of `EASE_TOTAL_MM`, so a reviewer can read the numbers against their purpose. */
export const EASE_WHY: Readonly<Record<EaseLine, string>> = {
  bust: "regular is SRS 6.2; fitted keeps room to breathe and raise arms; loose adds a hand's width",
  waist: "regular is SRS 6.2; fitted is the least that sits without pulling",
  hip: "regular is SRS 6.2; hip ease is needed to sit and walk",
  upperArm: "regular equals the block's built-in 50, so the regular sleeve is unchanged",
  acrossBack:
    "back width is a ratio of the bust (no body measure), so its built-in is 0 and this is the remainder",
};

/**
 * Added (mm) to the bust, waist and hip totals by `bodice.fit`. `semi-fitted` is neutral because regular is the SRS default.
 * After the sum the total is floored at 0, so woven ease is never negative (FR-VAL-08).
 */
export const BODICE_FIT_MODIFIER_MM: Readonly<Record<BodiceFit, number>> = {
  fitted: -10,
  "semi-fitted": 0,
  loose: 30,
};

/**
 * Ease already inside the Aldrich blocks of `docs/engine/drafting-method.md` ("Ease already inside the blocks").
 * The ease tables hold the total, so resolve subtracts these to get the style ease; ease is never added twice.
 * Kept in step with the #122 reference drafts by a sync test.
 */
export const BLOCK_BUILT_IN_EASE_MM = {
  bust: 80,
  bodiceWaist: 40,
  skirtHip: 40,
  skirtWaist: 20,
  sleeveBicep: 50,
  sleeveWrist: 30,
  acrossBack: 0,
} as const;
