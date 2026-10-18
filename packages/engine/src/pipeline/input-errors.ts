/**
 * Input-type drafting errors (issue #128, decision 128, 10): body proportions or a skirt length the blocks
 * cannot draft. `generatePattern` turns them into a `fail` result with these messages instead of throwing.
 */
import { DraftingError } from "../errors/drafting-error";

/** A message in Arabic and English. */
interface BilingualText {
  /** Arabic. */
  readonly ar: string;
  /** English. */
  readonly en: string;
}

/** Bilingual message per input error code (Merna reviews the Arabic copy). */
export const INPUT_ERROR_MESSAGES = {
  BODICE_SHOULDER_INVALID: {
    ar: "عرض الكتف صغير جدًا بالنسبة لمقاس الرقبة. راجعي القيم المدخلة.",
    en: "Shoulder width is too small for the neck size",
  },
  BODICE_LENGTHS_INVALID: {
    ar: "طول الظهر أو الأمام قصير جدًا بالنسبة لعمق الإبط. راجعي القيم المدخلة.",
    en: "Back or front length is too short for the armhole depth",
  },
  BODICE_BUST_POINT_OUT_OF_BLOCK: {
    ar: "مكان نقطة الصدر لا يتوافق مع أطوال الجسم. راجعي القيم المدخلة.",
    en: "The bust point does not fit these body lengths",
  },
  SLEEVE_CAP_UNSOLVABLE: {
    ar: "لا يمكن رسم رأس كم يناسب الإبط بهذه المقاسات. راجعي محيط الذراع والقيم المدخلة.",
    en: "No sleeve cap fits this armhole with this upper arm",
  },
  SLEEVE_LENGTH_TOO_SHORT: {
    ar: "طول الكم المختار قصير جدًا بالنسبة لعمق الإبط. اختاري طولًا أطول.",
    en: "The chosen sleeve length is too short for the armhole depth",
  },
  SKIRT_LENGTH_OUT_OF_BODY: {
    ar: "طول الجيبة خارج حدود الجسم. راجعي القيم المدخلة.",
    en: "Skirt length must be between the shortest skirt and waist-to-floor",
  },
  SKIRT_LENGTH_INVALID_BODY: {
    ar: "طول الجيبة خارج حدود الجسم. راجعي القيم المدخلة.",
    en: "The body's knee length does not fit its waist-to-floor length",
  },
} as const satisfies Record<string, BilingualText>;

/** One of the input error codes. */
export type InputErrorCode = keyof typeof INPUT_ERROR_MESSAGES;

/**
 * Whether an error is a `DraftingError` caused by the input (not a programming error).
 *
 * @param error - Anything thrown.
 * @returns True for a drafting error with an input code.
 */
export function isInputError(error: unknown): error is DraftingError & { code: InputErrorCode } {
  return error instanceof DraftingError && Object.hasOwn(INPUT_ERROR_MESSAGES, error.code);
}
