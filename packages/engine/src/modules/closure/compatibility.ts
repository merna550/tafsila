/**
 * Which closures each category can be drafted with, as data (issue #143, decision 143, 1). A zip goes in the centre
 * back, the side or the centre front seam; buttons need a centre line to lap over, so never at the side, and never
 * down a centre line a skirt slit already opens. `none` is allowed everywhere: its fit is warned, not refused.
 */
import type { DesignSpec } from "@tafsila/schemas";
import { DraftingError } from "../../errors/drafting-error";

/** A closure position. */
type Position = DesignSpec["closure"]["position"];

/** Every position. */
const ALL_POSITIONS: readonly Position[] = ["center-back", "side", "center-front"];

/** The centre lines. */
const CENTRES: readonly Position[] = ["center-back", "center-front"];

/** The same choices for every category. */
const ANY_CATEGORY = { zip: ALL_POSITIONS, buttons: CENTRES, none: ALL_POSITIONS } as const;

/** Allowed positions per category and closure type. */
export const CLOSURE_MATRIX: Readonly<
  Record<DesignSpec["category"], Readonly<Record<DesignSpec["closure"]["type"], readonly Position[]>>>
> = { dress: ANY_CATEGORY, skirt: ANY_CATEGORY, blouse: ANY_CATEGORY };

/** The centre line each slit position opens. */
const SLIT_CENTRE: Readonly<Record<string, Position>> = { front: "center-front", back: "center-back" };

/**
 * Why a design's closure cannot be drafted, or undefined when it can.
 *
 * @param spec - The design.
 * @returns `CLOSURE_UNSUPPORTED`, or undefined.
 */
export function closureIssue(
  spec: Pick<DesignSpec, "category" | "closure" | "skirt">,
): "CLOSURE_UNSUPPORTED" | undefined {
  const { type, position } = spec.closure;
  if (!CLOSURE_MATRIX[spec.category][type].includes(position)) return "CLOSURE_UNSUPPORTED";
  const slit = spec.skirt?.slit?.position;
  const slitHere = slit !== undefined && SLIT_CENTRE[slit] === position;
  return type === "buttons" && slitHere ? "CLOSURE_UNSUPPORTED" : undefined;
}

/**
 * Refuses a closure the matrix does not allow.
 *
 * @param spec - The design.
 * @throws {DraftingError} CLOSURE_UNSUPPORTED (an input error).
 */
export function assertClosure(spec: Pick<DesignSpec, "category" | "closure" | "skirt">): void {
  if (closureIssue(spec)) {
    throw new DraftingError(
      "CLOSURE_UNSUPPORTED",
      `A ${spec.category} cannot close with ${spec.closure.type} at ${spec.closure.position}`,
    );
  }
}
