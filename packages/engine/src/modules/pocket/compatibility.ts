/**
 * Which pockets each design can take, as data (issue #145, decision 145, 2). A side-seam pocket needs a plain side
 * seam below the waist: it is refused on tiered skirts (a tier seam crosses the bag), on blouses (no hand room below
 * the waist) and with a side zip (the zip owns the left side seam). A patch pocket lies flat on the front: it is
 * refused where the fabric folds under it (pleated, gathered, tiered and circle skirts) or a princess seam splits the front.
 */
import type { DesignSpec } from "@tafsila/schemas";
import { DraftingError } from "../../errors/drafting-error";

/** One pocket style. */
export type PocketStyle = DesignSpec["pockets"][number];

/** Skirt types a side-seam pocket is refused on. */
const SIDE_SEAM_REFUSED_SKIRTS: readonly string[] = ["tiered"];

/** Skirt types a patch pocket is refused on. */
const PATCH_REFUSED_SKIRTS: readonly string[] = [
  "pleated",
  "gathered",
  "tiered",
  "circle-half",
  "circle-full",
];

/** The parts of a design the pocket matrix reads. */
type Pocketable = Pick<DesignSpec, "category" | "closure" | "skirt" | "bodice">;

/**
 * Whether a side-seam pocket is allowed.
 *
 * @param spec - The design.
 * @returns True when allowed.
 */
function sideSeamAllowed(spec: Pocketable): boolean {
  const sideZip = spec.closure.type === "zip" && spec.closure.position === "side";
  return spec.category !== "blouse" && !sideZip && !SIDE_SEAM_REFUSED_SKIRTS.includes(spec.skirt?.type ?? "");
}

/**
 * Whether a patch pocket is allowed.
 *
 * @param spec - The design.
 * @returns True when allowed.
 */
function patchAllowed(spec: Pocketable): boolean {
  const princess = spec.bodice?.shaping.startsWith("princess") ?? false;
  const splitFront = princess && (spec.category === "blouse" || spec.bodice?.waistSeam === false);
  return !PATCH_REFUSED_SKIRTS.includes(spec.skirt?.type ?? "") && !splitFront;
}

/**
 * Whether one pocket style is allowed on a design.
 *
 * @param spec - The design.
 * @param style - The pocket style.
 * @returns True when the style can be drafted.
 */
export function pocketAllowed(spec: Pocketable, style: PocketStyle): boolean {
  return style === "side-seam" ? sideSeamAllowed(spec) : patchAllowed(spec);
}

/**
 * Refuses a pocket the matrix does not allow.
 *
 * @param spec - The design.
 * @throws {DraftingError} POCKET_UNSUPPORTED (an input error).
 */
export function assertPockets(
  spec: Pick<DesignSpec, "category" | "closure" | "skirt" | "bodice" | "pockets">,
): void {
  const refused = spec.pockets.find((style) => !pocketAllowed(spec, style));
  if (refused) {
    throw new DraftingError("POCKET_UNSUPPORTED", `A ${spec.category} cannot take a ${refused} pocket here`);
  }
}
