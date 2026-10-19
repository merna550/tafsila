/** One valid starting design per garment category, for the design picker (issue #238). */
import type { DesignSpec } from "@tafsila/schemas";

/** The plain parts every starting design is built from: darted bodice, round neck, short set-in sleeve, straight knee skirt. */
const PLAIN_PARTS = {
  bodice: { fit: "semi-fitted", shaping: "darts", waistSeam: true },
  neckline: { front: "round", back: "round", collar: "none" },
  sleeve: { type: "set-in", length: "short", cuff: "none" },
  skirt: { type: "straight", length: "knee" },
} as const satisfies Partial<DesignSpec>;

/** Fields every starting design shares. */
const COMMON = {
  schemaVersion: 1,
  fabricType: "woven",
  closure: { type: "zip", position: "center-back" },
  pockets: [],
  lining: false,
} as const satisfies Partial<DesignSpec>;

/**
 * The starting design of a category: simple choices that every module accepts together.
 *
 * @param category - The garment category.
 * @returns A new, valid design (a dress with a waist seam, a straight band skirt, a darted blouse).
 */
export function defaultSpec(category: DesignSpec["category"]): DesignSpec {
  const { bodice, neckline, sleeve, skirt } = structuredClone(PLAIN_PARTS) as Required<
    Pick<DesignSpec, "bodice" | "neckline" | "sleeve" | "skirt">
  >;
  const common = structuredClone(COMMON) as unknown as DesignSpec;
  if (category === "dress") return { ...common, category, bodice, neckline, sleeve, skirt, belt: "none" };
  if (category === "skirt") return { ...common, category, skirt, waistband: "straight" };
  return { ...common, category, bodice, neckline, sleeve };
}
