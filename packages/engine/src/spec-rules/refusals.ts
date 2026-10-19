/**
 * The one list of part combinations the engine refuses before drafting (issue #238, decision 238, 1). The design picker
 * and the property-test arbitrary both read it, and it calls the modules' own predicates, so nothing is copied.
 */
import type { DesignSpec } from "@tafsila/schemas";
import { closureIssue } from "../modules/closure/compatibility";
import { collarCombinationIssue } from "../modules/collar/combinations";
import { pocketAllowed } from "../modules/pocket/compatibility";
import { sleeveCombinationIssue } from "../modules/sleeve/combinations";
import { SLIT_SKIRT_TYPES } from "../modules/skirt/rules";
import { CATEGORY_PARTS, isOnePieceDress, ONE_PIECE_SKIRT_TYPES } from "../pipeline/category-rules";
import { INPUT_ERROR_MESSAGES, type InputErrorCode } from "../pipeline/input-errors";
import { formatMessage } from "../validation/messages";
import { withoutIgnoredParts } from "./feature-paths";

/** A reason the picker refuses a value: an input error code, or the slit warning (a slit on a skirt that cannot take one). */
export type RefusalCode = InputErrorCode | "SLIT_NOT_DRAFTED";

/**
 * Every refusal that applies to a design's part combinations, in a fixed order.
 *
 * @param spec - A schema-valid design; parts its category ignores are not looked at (the engine drops them).
 * @returns The refusal codes; empty when the engine accepts the combination.
 */
export function specRefusals(spec: DesignSpec): RefusalCode[] {
  const drafted = withoutIgnoredParts(spec);
  if (CATEGORY_PARTS[drafted.category].required.some((part) => drafted[part] === undefined)) {
    return ["SPEC_PART_MISSING"];
  }
  const codes: (RefusalCode | undefined)[] = [
    isOnePieceDress(drafted) && !ONE_PIECE_SKIRT_TYPES.includes(drafted.skirt!.type)
      ? "DRESS_ONE_PIECE_SKIRT_UNSUPPORTED"
      : undefined,
    drafted.skirt?.slit !== undefined && !SLIT_SKIRT_TYPES.has(drafted.skirt.type)
      ? "SLIT_NOT_DRAFTED"
      : undefined,
    closureIssue(drafted),
    collarCombinationIssue(drafted),
    sleeveCombinationIssue(drafted),
    drafted.pockets.some((style) => !pocketAllowed(drafted, style)) ? "POCKET_UNSUPPORTED" : undefined,
  ];
  return codes.filter((code): code is RefusalCode => code !== undefined);
}

/**
 * The bilingual text for a refusal code.
 *
 * @param code - The refusal code.
 * @param spec - The design, for the skirt type named by the slit message.
 * @returns Arabic and English text.
 */
export function refusalMessage(code: RefusalCode, spec: DesignSpec): { ar: string; en: string } {
  if (code === "SLIT_NOT_DRAFTED") return formatMessage(code, { type: spec.skirt?.type ?? "" });
  return INPUT_ERROR_MESSAGES[code];
}
