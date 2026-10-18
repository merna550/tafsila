/** Stable bilingual messages for the engine validation report (FR-VAL-01…08). */

/** Arabic and English text for every stable structural-validation code. */
export const VALIDATION_MESSAGES = {
  SEAM_MATCH_OK: {
    ar: "طولا الحافتين متطابقان: {first} و{second}",
    en: "Paired edge lengths match: {first} and {second}",
  },
  SEAM_MATCH_MISMATCH: {
    ar: "فرق طول الحافتين {first} و{second} هو {mm} مم (المتوقع {expected} مم)",
    en: "Edge length difference for {first} and {second} is {mm} mm (expected {expected} mm)",
  },
  SEAM_MATCH_BROKEN_REF: {
    ar: "مرجع الحافة المقترنة غير موجود: {first} إلى {second}",
    en: "Paired edge reference is missing: {first} to {second}",
  },
  SLEEVE_CAP_OK: { ar: "راحة رأس الكم {mm} مم", en: "Sleeve-cap ease is {mm} mm" },
  SLEEVE_CAP_OUT_OF_RANGE: {
    ar: "راحة رأس الكم {mm} مم؛ المطلوب من {min} إلى {max} مم",
    en: "Sleeve-cap ease is {mm} mm; expected {min} to {max} mm",
  },
  SLEEVE_CAP_BROKEN_REF: {
    ar: "مرجع رأس الكم أو حردة الإبط غير موجود: {ref}",
    en: "Sleeve-cap or armhole reference is missing: {ref}",
  },
  CIRCUMFERENCE_OK: { ar: "محيط {line} يطابق القياس: {mm} مم", en: "{line} circumference matches: {mm} mm" },
  CIRCUMFERENCE_MISMATCH: {
    ar: "محيط {line} هو {mm} مم؛ المتوقع {expected} مم",
    en: "{line} circumference is {mm} mm; expected {expected} mm",
  },
  CIRCUMFERENCE_BROKEN_LINE: {
    ar: "لا يمكن قياس خط الجسم {line} على القطعة {piece}",
    en: "Body line {line} cannot be measured on piece {piece}",
  },
  NOTCH_OK: {
    ar: "علامتا المطابقة متحاذيتان: {first} و{second}",
    en: "Paired notches align: {first} and {second}",
  },
  NOTCH_MISMATCH: {
    ar: "فرق موضع علامتي {first} و{second} هو {mm} مم",
    en: "Notch position difference for {first} and {second} is {mm} mm",
  },
  NOTCH_BROKEN_REF: {
    ar: "علامة المطابقة المقترنة غير موجودة: {first} إلى {second}",
    en: "Paired notch reference is missing: {first} to {second}",
  },
  DART_LEGS_OK: { ar: "ضلعا البنسة متساويان: {ref}", en: "Dart legs match: {ref}" },
  DART_LEGS_MISMATCH: {
    ar: "فرق ضلعي البنسة {ref} هو {mm} مم",
    en: "Dart leg difference for {ref} is {mm} mm",
  },
  DART_APEX_OK: {
    ar: "رأس البنسة خلف حد نقطة الصدر: {ref}",
    en: "Dart apex respects the bust-point limit: {ref}",
  },
  DART_APEX_PAST_LIMIT: {
    ar: "بعد رأس البنسة {ref} عن نقطة الصدر {mm} مم؛ الحد {expected} مم",
    en: "Dart apex {ref} is {mm} mm from the bust point; limit {expected} mm",
  },
  STRUCT_OK: { ar: "بنية القطعة صحيحة", en: "Piece structure is valid" },
  STRUCT_OPEN_PATH: {
    ar: "الحافة مفتوحة: القطعة {piece} لا تقفل على نفسها",
    en: "Open outline: piece {piece} does not close",
  },
  STRUCT_SELF_INTERSECTION: {
    ar: "الحافة تتقاطع مع نفسها: القطعة {piece} بها {count} تقاطع",
    en: "Self-intersection: piece {piece} has {count} crossing(s)",
  },
  STRUCT_MISSING_SA: {
    ar: "لا يوجد بدل خياطة: {piece}/{edge}",
    en: "Seam allowance is missing: {piece}/{edge}",
  },
  LABELS_OK: { ar: "بيانات القطعة كاملة", en: "Piece markings are complete" },
  LABELS_NO_GRAIN: {
    ar: "خط النسيج غير موجود: القطعة {piece}",
    en: "Grain line is missing: piece {piece}",
  },
  LABELS_NO_NAME: {
    ar: "اسم القطعة غير موجود: القطعة {piece}",
    en: "Piece name is missing: piece {piece}",
  },
  LABELS_NO_CUT_INFO: {
    ar: "عدد القص غير موجود: القطعة {piece}",
    en: "Cut quantity is missing: piece {piece}",
  },
  PLAUS_OK: { ar: "قيم الباترون منطقية", en: "Pattern values are plausible" },
  PLAUS_NEGATIVE_EASE: {
    ar: "الراحة سالبة عند {line}: {mm} مم",
    en: "Negative ease at {line}: {mm} mm",
  },
  PLAUS_WIDER_THAN_FABRIC: {
    ar: "القطعة {piece} أعرض من القماش: {mm} مم مقابل {fabric} مم",
    en: "Piece {piece} is wider than the fabric: {mm} mm versus {fabric} mm",
  },
  PLAUS_WALKING_EASE: {
    ar: "ذيل التنورة {mm} مم أضيق من {expected} مم اللازمة للمشي: أضيفي فتحة أو شقًّا",
    en: "The skirt hem is {mm} mm, narrower than the {expected} mm needed to walk: add a slit or a vent",
  },
  SLIT_OK: { ar: "الفتحة {mm} مم تحت خط الأرداف", en: "The {mm} mm slit stays below the hip line" },
  SLIT_ABOVE_HIP: {
    ar: "الفتحة {mm} مم تصل فوق خط الأرداف؛ أقصى طول {expected} مم",
    en: "The {mm} mm slit reaches above the hip line; the longest is {expected} mm",
  },
  SLIT_NOT_DRAFTED: {
    ar: "الفتحة غير متاحة لتنورة {type} ولم تُرسم",
    en: "A slit is not available for a {type} skirt and was not drafted",
  },
  BODICE_DART_FREE_OK: {
    ar: "الصدر بدون بنس: تحولت البنسات إلى راحة تناسب القصة الواسعة أو شبه المحددة",
    en: "Dart-free bodice: the darts became ease, which suits a loose or semi-fitted fit",
  },
  BODICE_DART_FREE_FITTED: {
    ar: "القصة المحددة تحتاج بنسات أو قصة أميرة؛ الصدر بدون بنس لن يكون محددًا على الجسم",
    en: "A fitted bodice needs darts or princess seams; without them it will not fit closely",
  },
  FULLNESS_CLOSURE_OK: {
    ar: "الوسط بعد الكشكشة أو الكسرات {mm} مم كما هو مطلوب",
    en: "Waist after gathers or pleats is {mm} mm, as expected",
  },
  FULLNESS_CLOSURE_MISMATCH: {
    ar: "الوسط بعد الكشكشة أو الكسرات {mm} مم؛ المتوقع {expected} مم",
    en: "Waist after gathers or pleats is {mm} mm; expected {expected} mm",
  },
} as const;

/** A stable code accepted by {@link formatMessage}. */
export type ValidationMessageCode = keyof typeof VALIDATION_MESSAGES;

/** Values substituted into a validation message's named placeholders. */
export type ValidationMessageParams = Readonly<Record<string, string | number>>;

/**
 * Substitutes named values into one language of a validation message.
 *
 * @param template - Message containing `{name}` placeholders.
 * @param params - Values keyed by placeholder name.
 * @returns The formatted message.
 */
function formatTemplate(template: string, params: ValidationMessageParams): string {
  return template.replace(/\{([a-z]+)\}/gi, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder,
  );
}

/**
 * Builds the Arabic and English message for a stable validation code.
 *
 * @param code - Catalogue code.
 * @param params - Values for the code's named placeholders.
 * @returns The formatted bilingual message.
 */
export function formatMessage(
  code: ValidationMessageCode,
  params: ValidationMessageParams = {},
): { ar: string; en: string } {
  const template = VALIDATION_MESSAGES[code];
  return {
    ar: formatTemplate(template.ar, params),
    en: formatTemplate(template.en, params),
  };
}
