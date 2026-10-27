/**
 * DRAFT fabric catalogue: the fabrics of FR-REC-02 plus common woven fabrics of the Egyptian market.
 * DRAFT: reviewed by Merna in the PR (TC-FAB-314-01, TC-FAB-314-04). Scales 0 to 4; stretch is 0 for every woven fabric.
 * This is the source for the database seed (#317).
 */
import { FABRIC_LEVEL, type Fabric } from "@tafsila/schemas";

const { none, low, mid, high, max } = FABRIC_LEVEL;

/** The properties of a woven fabric except stretch, which is always `none` in v1. */
interface WovenLevels {
  readonly drape: number;
  readonly weight: number;
  readonly body: number;
  readonly sheen: number;
}

/**
 * Builds a woven fabric entry.
 *
 * @param names - Id and the Arabic and English names.
 * @param levels - Drape, weight, body and sheen on the 0 to 4 scale.
 * @param careNotes - Care notes in both languages.
 * @returns The fabric.
 */
function woven(
  names: Pick<Fabric, "id" | "nameAr" | "nameEn">,
  levels: WovenLevels,
  careNotes: Fabric["careNotes"],
): Fabric {
  return { ...names, properties: { ...levels, stretch: none }, careNotes };
}

/** The draft catalogue. */
export const DRAFT_CATALOGUE: readonly Fabric[] = [
  woven(
    { id: "crepe", nameAr: "كريب", nameEn: "Crepe" },
    { drape: high, weight: mid, body: mid, sheen: low },
    {
      ar: "غسيل لطيف على 30 درجة، كي على حرارة متوسطة",
      en: "Gentle wash at 30 degrees, medium iron",
    },
  ),
  woven(
    { id: "chiffon", nameAr: "شيفون", nameEn: "Chiffon" },
    { drape: max, weight: none, body: none, sheen: mid },
    {
      ar: "غسيل يدوي، كي على حرارة منخفضة",
      en: "Hand wash, low iron",
    },
  ),
  woven(
    { id: "georgette", nameAr: "جورجيت", nameEn: "Georgette" },
    { drape: max, weight: low, body: low, sheen: low },
    {
      ar: "غسيل يدوي لطيف، كي على حرارة منخفضة",
      en: "Gentle hand wash, low iron",
    },
  ),
  woven(
    { id: "satin", nameAr: "ستان", nameEn: "Satin" },
    { drape: high, weight: mid, body: low, sheen: max },
    {
      ar: "غسيل لطيف، كي من الخلف على حرارة منخفضة",
      en: "Gentle wash, iron on the back at low heat",
    },
  ),
  woven(
    { id: "linen", nameAr: "كتان", nameEn: "Linen" },
    { drape: low, weight: mid, body: high, sheen: none },
    {
      ar: "غسيل على 40 درجة، يكوى وهو مبلل",
      en: "Wash at 40 degrees, iron while damp",
    },
  ),
  woven(
    { id: "cotton-poplin", nameAr: "قطن بوبلين", nameEn: "Cotton poplin" },
    { drape: low, weight: mid, body: high, sheen: low },
    {
      ar: "غسيل على 40 درجة، كي على حرارة عالية",
      en: "Wash at 40 degrees, hot iron",
    },
  ),
  woven(
    { id: "viscose", nameAr: "فسكوز", nameEn: "Viscose" },
    { drape: max, weight: low, body: none, sheen: low },
    {
      ar: "غسيل لطيف وقد ينكمش، كي على حرارة متوسطة",
      en: "Gentle wash, may shrink, medium iron",
    },
  ),
  woven(
    { id: "taffeta", nameAr: "تافتا", nameEn: "Taffeta" },
    { drape: none, weight: mid, body: max, sheen: high },
    {
      ar: "تنظيف جاف أو غسيل يدوي، كي على حرارة منخفضة",
      en: "Dry clean or hand wash, low iron",
    },
  ),
  woven(
    { id: "lace", nameAr: "دانتيل", nameEn: "Lace" },
    { drape: mid, weight: low, body: mid, sheen: low },
    {
      ar: "غسيل يدوي، بدون عصر، يفرد ليجف",
      en: "Hand wash, do not wring, dry flat",
    },
  ),
  woven(
    { id: "velvet", nameAr: "مخمل", nameEn: "Velvet" },
    { drape: high, weight: high, body: mid, sheen: high },
    {
      ar: "تنظيف جاف، لا يكوى على الوجه",
      en: "Dry clean, never iron the pile side",
    },
  ),
  woven(
    { id: "jacquard", nameAr: "جاكار", nameEn: "Jacquard" },
    { drape: low, weight: high, body: max, sheen: mid },
    {
      ar: "تنظيف جاف أو غسيل يدوي",
      en: "Dry clean or hand wash",
    },
  ),
  woven(
    { id: "tulle", nameAr: "تل", nameEn: "Tulle" },
    { drape: low, weight: none, body: mid, sheen: low },
    {
      ar: "غسيل يدوي، يحتاج حرصا عند الكي",
      en: "Hand wash, iron with great care",
    },
  ),
  woven(
    { id: "printed-cotton", nameAr: "قطن مطبوع", nameEn: "Printed cotton" },
    { drape: low, weight: low, body: mid, sheen: none },
    {
      ar: "غسيل على 40 درجة، كي على حرارة عالية",
      en: "Wash at 40 degrees, hot iron",
    },
  ),
  woven(
    { id: "crepe-satin", nameAr: "كريب ساتان", nameEn: "Crepe satin" },
    { drape: high, weight: mid, body: low, sheen: high },
    {
      ar: "غسيل لطيف، كي من الخلف على حرارة منخفضة",
      en: "Gentle wash, iron on the back at low heat",
    },
  ),
  woven(
    { id: "linen-blend", nameAr: "لينن مخلوط", nameEn: "Linen blend" },
    { drape: mid, weight: mid, body: mid, sheen: none },
    {
      ar: "غسيل على 30 درجة، كي على حرارة متوسطة",
      en: "Wash at 30 degrees, medium iron",
    },
  ),
  woven(
    { id: "heavy-polyester", nameAr: "بوليستر ثقيل", nameEn: "Heavy polyester" },
    { drape: mid, weight: high, body: high, sheen: mid },
    {
      ar: "غسيل على 30 درجة، كي على حرارة منخفضة",
      en: "Wash at 30 degrees, low iron",
    },
  ),
];
