/** Turns the changes of a spec patch into one bilingual summary line each (FR-CHAT-02, FR-CHAT-04). Pure: no I/O. */
import type { BilingualText } from "@tafsila/schemas";

/** One change of a design as the engine's `applySpecPatch` reports it. */
export interface ChangeInput {
  /** Feature or length path, such as `sleeve.length`. */
  readonly path: string;
  /** Value before (undefined when the part did not exist). */
  readonly from: unknown;
  /** Value after (undefined when the part was removed). */
  readonly to: unknown;
}

/** Millimetres in a centimetre. */
const MM_PER_CM = 10;

/** Arabic and English name of each feature and length. */
const PATH_LABELS: Readonly<Record<string, BilingualText>> = {
  category: { ar: "نوع القطعة", en: "Garment type" },
  "bodice.shaping": { ar: "تشكيل الصدر", en: "Bodice shaping" },
  "bodice.fit": { ar: "قصة الصدر", en: "Bodice fit" },
  "bodice.waistSeam": { ar: "خياطة الوسط", en: "Waist seam" },
  "skirt.type": { ar: "نوع التنورة", en: "Skirt type" },
  "skirt.length": { ar: "طول التنورة", en: "Skirt length" },
  "skirt.slit": { ar: "فتحة التنورة", en: "Skirt slit" },
  waistband: { ar: "حزام الوسط", en: "Waistband" },
  "neckline.front": { ar: "فتحة الرقبة الأمامية", en: "Front neckline" },
  "neckline.back": { ar: "فتحة الرقبة الخلفية", en: "Back neckline" },
  "neckline.collar": { ar: "الياقة", en: "Collar" },
  "sleeve.type": { ar: "نوع الكم", en: "Sleeve type" },
  "sleeve.length": { ar: "طول الكم", en: "Sleeve length" },
  "sleeve.cuff": { ar: "أسورة الكم", en: "Cuff" },
  "closure.type": { ar: "نوع القفل", en: "Closure type" },
  "closure.position": { ar: "مكان القفل", en: "Closure position" },
  pockets: { ar: "الجيوب", en: "Pockets" },
  belt: { ar: "الحزام", en: "Belt" },
  lining: { ar: "البطانة", en: "Lining" },
  "neckline.depthFrontMm": { ar: "عمق فتحة الرقبة", en: "Front neckline depth" },
  "skirt.lengthMm": { ar: "طول التنورة", en: "Skirt length" },
  "skirt.slit.lengthMm": { ar: "طول فتحة التنورة", en: "Slit length" },
};

/** Arabic and English name of each value a feature can take; one table, since the same word means the same everywhere. */
const VALUE_LABELS: Readonly<Record<string, BilingualText>> = {
  none: { ar: "بدون", en: "none" },
  dress: { ar: "فستان", en: "dress" },
  skirt: { ar: "تنورة", en: "skirt" },
  blouse: { ar: "بلوزة", en: "blouse" },
  fitted: { ar: "ضيق", en: "fitted" },
  "semi-fitted": { ar: "نصف ضيق", en: "semi-fitted" },
  loose: { ar: "واسع", en: "loose" },
  darts: { ar: "دارتات", en: "darts" },
  "princess-shoulder": { ar: "برنسيس من الكتف", en: "princess from the shoulder" },
  "princess-armhole": { ar: "برنسيس من الإبط", en: "princess from the armhole" },
  round: { ar: "دائرية", en: "round" },
  v: { ar: "على شكل V", en: "V" },
  square: { ar: "مربعة", en: "square" },
  sweetheart: { ar: "قلب", en: "sweetheart" },
  boat: { ar: "قارب", en: "boat" },
  "high-round": { ar: "دائرية عالية", en: "high round" },
  "peter-pan": { ar: "بيتر بان", en: "Peter Pan" },
  shirt: { ar: "قميص", en: "shirt" },
  mandarin: { ar: "ماندرين", en: "mandarin" },
  "set-in": { ar: "كم عادي", en: "set-in" },
  cap: { ar: "كاب", en: "cap" },
  puff: { ar: "منفوش", en: "puff" },
  bishop: { ar: "بيشوب", en: "bishop" },
  flutter: { ar: "رفرف", en: "flutter" },
  short: { ar: "قصير", en: "short" },
  elbow: { ar: "للكوع", en: "elbow" },
  "three-quarter": { ar: "ثلاثة أرباع", en: "three-quarter" },
  long: { ar: "طويل", en: "long" },
  band: { ar: "أسورة", en: "band" },
  elastic: { ar: "مطاط", en: "elastic" },
  straight: { ar: "مستقيمة", en: "straight" },
  "a-line": { ar: "إيه لاين", en: "A-line" },
  "circle-half": { ar: "نصف دائرة", en: "half circle" },
  "circle-full": { ar: "دائرة كاملة", en: "full circle" },
  gathered: { ar: "مكشكشة", en: "gathered" },
  pleated: { ar: "بليسيه", en: "pleated" },
  tiered: { ar: "طبقات", en: "tiered" },
  mini: { ar: "قصيرة جدا", en: "mini" },
  knee: { ar: "للركبة", en: "knee" },
  midi: { ar: "ميدي", en: "midi" },
  ankle: { ar: "للكاحل", en: "ankle" },
  floor: { ar: "للأرض", en: "floor" },
  front: { ar: "أمامية", en: "front" },
  back: { ar: "خلفية", en: "back" },
  side: { ar: "جانبية", en: "side" },
  contour: { ar: "منحني", en: "contour" },
  zip: { ar: "سوستة", en: "zip" },
  buttons: { ar: "أزرار", en: "buttons" },
  "center-back": { ar: "منتصف الظهر", en: "center back" },
  "center-front": { ar: "منتصف الأمام", en: "center front" },
  "self-tie": { ar: "رباط من نفس القماش", en: "self-tie" },
  "side-seam": { ar: "جيب خياطة جانبية", en: "side-seam" },
  patch: { ar: "جيب مفرود", en: "patch" },
  true: { ar: "نعم", en: "yes" },
  false: { ar: "لا", en: "no" },
};

/**
 * Names one value in both languages: a length in cm, a list of pockets, or a known option (otherwise the value itself).
 *
 * @param path - The feature or length the value belongs to.
 * @param value - The value.
 * @returns The text in both languages.
 */
function describeValue(path: string, value: unknown): BilingualText {
  if (value === undefined) return VALUE_LABELS.none!;
  if (path.endsWith("Mm") && typeof value === "number") {
    const cm = Math.round(value) / MM_PER_CM;
    return { ar: `${cm} سم`, en: `${cm} cm` };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return VALUE_LABELS.none!;
    const parts = value.map((item) => describeValue(path, item));
    return { ar: parts.map((p) => p.ar).join("، "), en: parts.map((p) => p.en).join(", ") };
  }
  const key =
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : JSON.stringify(value);
  return VALUE_LABELS[key] ?? { ar: key, en: key };
}

/**
 * Describes each change as one line, such as "Sleeve length: short → long" and "طول الكم: قصير ← طويل".
 * The order of the input is kept (the engine reports features first, then lengths, in a fixed order).
 *
 * @param changes - What differs between the design before and after the patch.
 * @returns One bilingual line per visible change.
 * @example
 * describeChanges([{ path: "sleeve.length", from: "short", to: "long" }])[0]?.en; // "Sleeve length: short → long"
 */
export function describeChanges(changes: readonly ChangeInput[]): BilingualText[] {
  return changes.flatMap((change) => {
    const label = PATH_LABELS[change.path] ?? { ar: change.path, en: change.path };
    const from = describeValue(change.path, change.from);
    const to = describeValue(change.path, change.to);
    // An absent part that becomes "none" (the engine fills it in) is no change the user can see.
    if (from.en === to.en) return [];
    return [{ ar: `${label.ar}: ${from.ar} ← ${to.ar}`, en: `${label.en}: ${from.en} → ${to.en}` }];
  });
}
