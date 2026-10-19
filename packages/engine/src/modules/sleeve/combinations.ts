/**
 * Which sleeve lengths and cuffs each sleeve type allows (issue #142, decision 142, 1). Pure, so the AI and chat layers
 * can check a spec without drafting it; the sleeve modules refuse anything else as an input error.
 */
import type { DesignSpec } from "@tafsila/schemas";
import { SLEEVE_COMBINATIONS } from "../../constants/sleeve-style";

/** The refusal codes; each has a bilingual message in the input error catalogue. */
export type SleeveCombinationCode = "SLEEVE_LENGTH_UNSUPPORTED" | "SLEEVE_CUFF_UNSUPPORTED";

/**
 * Why a design's sleeve cannot be drafted, if it cannot.
 *
 * @param spec - The design.
 * @returns The refusal code, or undefined when the sleeve (or no sleeve) is allowed.
 */
export function sleeveCombinationIssue(spec: Pick<DesignSpec, "sleeve">): SleeveCombinationCode | undefined {
  const sleeve = spec.sleeve;
  if (!sleeve || sleeve.type === "none") return undefined;
  const cuffs = SLEEVE_COMBINATIONS[sleeve.type][sleeve.length];
  if (!cuffs) return "SLEEVE_LENGTH_UNSUPPORTED";
  return cuffs.includes(sleeve.cuff) ? undefined : "SLEEVE_CUFF_UNSUPPORTED";
}
