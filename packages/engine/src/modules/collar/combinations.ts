/**
 * Which collars go with which necklines and closures (issue #141, decision 141, 1). A collar is drafted from the
 * natural neck, so it needs a round or high-round neck front and back; a stand needs the natural depth and an opening
 * that lets the head through. Pure, so the AI and chat layers can check a spec without drafting it.
 */
import type { DesignSpec } from "@tafsila/schemas";
import { STAND_COLLARS } from "../../constants/collar";

/** The refusal codes; each has a bilingual message in the input error catalogue. */
export type CollarCombinationCode =
  "COLLAR_NECKLINE_UNSUPPORTED" | "COLLAR_DEPTH_UNSUPPORTED" | "COLLAR_CLOSURE_UNSUPPORTED";

/** Neck styles a collar can be drafted on, front and back. */
const COLLAR_NECK_STYLES: ReadonlySet<string> = new Set(["round", "high-round"]);

/**
 * Whether the closure opens the stand where the head needs it: CF for a shirt collar (its stand buttons there), CF
 * or CB for a mandarin. A peter pan takes any closure (the neckline's head-opening rule covers it).
 *
 * @param collar - The collar.
 * @param closure - The design's closure.
 * @returns True when the closure suits the collar.
 */
function closureFits(collar: string, closure: DesignSpec["closure"]): boolean {
  if (collar === "peter-pan") return true;
  if (closure.type === "none") return false;
  if (collar === "shirt") return closure.position === "center-front";
  return closure.position !== "side";
}

/**
 * Why a design's collar cannot be drafted, if it cannot.
 *
 * @param spec - The design.
 * @returns The refusal code, or undefined when the collar (or no collar) is allowed.
 */
export function collarCombinationIssue(
  spec: Pick<DesignSpec, "neckline" | "closure">,
): CollarCombinationCode | undefined {
  const neckline = spec.neckline;
  if (!neckline || neckline.collar === "none") return undefined;
  if (!COLLAR_NECK_STYLES.has(neckline.front) || !COLLAR_NECK_STYLES.has(neckline.back)) {
    return "COLLAR_NECKLINE_UNSUPPORTED";
  }
  const stand = STAND_COLLARS.has(neckline.collar);
  if (stand && neckline.depthFrontMm !== undefined) return "COLLAR_DEPTH_UNSUPPORTED";
  return closureFits(neckline.collar, spec.closure) ? undefined : "COLLAR_CLOSURE_UNSUPPORTED";
}
