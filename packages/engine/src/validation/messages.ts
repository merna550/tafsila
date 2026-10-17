/** Stable bilingual messages for the engine validation report (FR-VAL-05, -06, -08). */

/** Arabic and English text for every stable structural-validation code. */
export const VALIDATION_MESSAGES = {
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
