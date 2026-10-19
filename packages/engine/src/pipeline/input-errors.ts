/**
 * Input-type drafting errors (issue #128, decision 128, 10): body proportions or a skirt length the blocks
 * cannot draft, and collars on a neckline or closure they cannot be drafted with (issue #141), sleeve style, length and cuff combinations the sleeve modules refuse (issue #142), and closures the category cannot take or a zip longer than its opening (issue #143). `generatePattern` turns them into a `fail` result with these messages instead of throwing.
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
  COLLAR_NECKLINE_UNSUPPORTED: {
    ar: "الياقة تحتاج فتحة رقبة دائرية أو دائرية عالية من الأمام والخلف. غيّري فتحة الرقبة أو اختاري بدون ياقة.",
    en: "A collar needs a round or high-round neckline at the front and back",
  },
  COLLAR_DEPTH_UNSUPPORTED: {
    ar: "ياقة القميص والياقة الصينية تُركّبان على الرقبة الطبيعية، فلا يمكن تعميق فتحة الرقبة معهما.",
    en: "A shirt or mandarin collar sits on the natural neck, so the neckline cannot be lowered",
  },
  COLLAR_CLOSURE_UNSUPPORTED: {
    ar: "هذه الياقة تحتاج فتحة عند الرقبة: ياقة القميص بأزرار أو سحاب في المنتصف الأمامي، والياقة الصينية في المنتصف الأمامي أو الخلفي.",
    en: "This collar needs an opening at the neck: centre front for a shirt collar, centre front or back for a mandarin collar",
  },
  SLEEVE_LENGTH_UNSUPPORTED: {
    ar: "هذا النوع من الأكمام لا يُرسم بهذا الطول. اختاري طولًا آخر أو نوع كم آخر.",
    en: "This sleeve style cannot be drafted at this length",
  },
  SLEEVE_CUFF_UNSUPPORTED: {
    ar: "هذه الأسورة لا تناسب نوع الكم وطوله: كم الأسقف يحتاج أسورة، والكم الكاب والفراشة بدون أسورة، والأستك على الكم العادي حتى الكوع فقط.",
    en: "This cuff does not suit the sleeve style and length: a bishop sleeve needs a cuff, cap and flutter sleeves take none, and elastic on a set-in sleeve stops at the elbow",
  },
  CLOSURE_UNSUPPORTED: {
    ar: "الأزرار تحتاج منتصف أمامي أو خلفي بدون شق وبدون تقسيم الجيبة لقطع. غيّري مكان الأزرار أو اختاري سحابًا.",
    en: "Buttons need a centre front or back line with no slit and no skirt split into panels; move them or choose a zip",
  },
  CLOSURE_ZIP_TOO_LONG: {
    ar: "السحاب أطول من الفتحة في هذا الطول. اختاري طولًا أطول أو مكانًا آخر للسحاب.",
    en: "The zip is longer than the opening at this length; choose a longer garment or another zip position",
  },
  SLEEVE_PUFF_UNSOLVABLE: {
    ar: "لا يمكن رسم رأس كم منفوخ بهذه المقاسات. راجعي محيط الذراع والقيم المدخلة.",
    en: "No puff sleeve head fits this armhole",
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
