/**
 * The one catalogue of piece names and label texts, in Arabic and English (issue #131, decision 131).
 * Geometry code never holds a string: it asks this file. Arabic follows docs/design/copy.md; digits are Western (NFR-06).
 */
import type { Piece } from "@tafsila/schemas";
import { ENGINE_VERSION } from "../version";

/** A text in both languages. */
export interface Bilingual {
  /** Arabic text. */
  readonly ar: string;
  /** English text. */
  readonly en: string;
}

/** Piece names by piece id. Every id a block or module uses must appear here (a test checks the list). */
export const PIECE_NAMES: Readonly<Record<string, Bilingual>> = {
  "front-panel": { ar: "الأمام", en: "Front" },
  "back-panel": { ar: "الخلف", en: "Back" },
  "bodice-front": { ar: "أمام الصدر", en: "Bodice front" },
  "bodice-back": { ar: "خلف الصدر", en: "Bodice back" },
  "bodice-front-centre": { ar: "وسط أمام الصدر", en: "Centre front bodice" },
  "bodice-front-side": { ar: "جنب أمام الصدر", en: "Side front bodice" },
  "bodice-back-centre": { ar: "وسط خلف الصدر", en: "Centre back bodice" },
  "bodice-back-side": { ar: "جنب خلف الصدر", en: "Side back bodice" },
  "skirt-front": { ar: "أمام التنورة", en: "Skirt front" },
  "skirt-back": { ar: "خلف التنورة", en: "Skirt back" },
  sleeve: { ar: "الكم", en: "Sleeve" },
  "cap-sleeve": { ar: "كم كاب", en: "Cap sleeve" },
  "flutter-sleeve": { ar: "كم فراشة", en: "Flutter sleeve" },
  cuff: { ar: "أسورة الكم", en: "Cuff" },
  "cuff-interfacing": { ar: "حشوة أسورة الكم", en: "Cuff interfacing" },
  "cuff-placket": { ar: "شريط فتحة الكم", en: "Cuff placket" },
  "sleeve-casing": { ar: "مجرى أستك الكم", en: "Sleeve elastic casing" },
  "neck-facing": { ar: "بطانة الياقة", en: "Neck facing" },
  "neck-facing-front": { ar: "تلبيس رقبة أمامي", en: "Front neck facing" },
  "neck-facing-back": { ar: "تلبيس رقبة خلفي", en: "Back neck facing" },
  "neck-facing-front-interfacing": { ar: "حشوة تلبيس الرقبة الأمامي", en: "Front neck facing interfacing" },
  "neck-facing-back-interfacing": { ar: "حشوة تلبيس الرقبة الخلفي", en: "Back neck facing interfacing" },
  "collar-upper": { ar: "ياقة علوية", en: "Upper collar" },
  "collar-under": { ar: "ياقة سفلية", en: "Under collar" },
  "collar-interfacing": { ar: "حشوة الياقة", en: "Collar interfacing" },
  "collar-stand": { ar: "رجل الياقة", en: "Collar stand" },
  "collar-stand-interfacing": { ar: "حشوة رجل الياقة", en: "Collar stand interfacing" },
  waistband: { ar: "حزام الوسط", en: "Waistband" },
  "waistband-interfacing": { ar: "حشوة حزام الوسط", en: "Waistband interfacing" },
  "waistband-casing": { ar: "مجرى الأستك", en: "Elastic casing" },
  "waistband-front": { ar: "حزام الوسط الأمامي", en: "Front waistband" },
  "waistband-back": { ar: "حزام الوسط الخلفي", en: "Back waistband" },
  "waistband-facing-front": { ar: "تلبيس حزام الوسط الأمامي", en: "Front waistband facing" },
  "waistband-facing-back": { ar: "تلبيس حزام الوسط الخلفي", en: "Back waistband facing" },
  "waistband-interfacing-front": { ar: "حشوة حزام الوسط الأمامي", en: "Front waistband interfacing" },
  "waistband-interfacing-back": { ar: "حشوة حزام الوسط الخلفي", en: "Back waistband interfacing" },
  "waist-facing": { ar: "تلبيس الوسط", en: "Waist facing" },
  "waist-facing-interfacing": { ar: "حشوة تلبيس الوسط", en: "Waist facing interfacing" },
  "waist-facing-front": { ar: "تلبيس الوسط الأمامي", en: "Front waist facing" },
  "waist-facing-back": { ar: "تلبيس الوسط الخلفي", en: "Back waist facing" },
  "waist-facing-interfacing-front": { ar: "حشوة تلبيس الوسط الأمامي", en: "Front waist facing interfacing" },
  "waist-facing-interfacing-back": { ar: "حشوة تلبيس الوسط الخلفي", en: "Back waist facing interfacing" },
};

/** The engine version as printed on a piece. */
export const ENGINE_STAMP = `v${ENGINE_VERSION}`;

/** Wording of the fabric part of the cut text. */
const FABRIC_TEXT: Readonly<Record<Piece["cut"]["fabric"], Bilingual | null>> = {
  main: null,
  lining: { ar: "بطانة", en: "lining" },
  interfacing: { ar: "حشوة لاصقة", en: "interfacing" },
};

/**
 * The name of a piece: the catalogue entry for its id, else the name the piece already carries.
 *
 * @param piece - The piece (only `id` and `name` are read).
 * @returns The bilingual name.
 */
export function pieceNameText(piece: Pick<Piece, "id" | "name">): Bilingual {
  return PIECE_NAMES[piece.id] ?? piece.name;
}

/**
 * The cut instruction of a piece, such as "Cut 2" or "Cut 1 on fold".
 *
 * @param cut - How many to cut and how.
 * @returns The bilingual text.
 * @example
 * cutInfoText({ quantity: 1, onFold: true, mirror: false, fabric: "main" }) // { ar: "اقصّي 1 على الثنية", en: "Cut 1 on fold" }
 */
export function cutInfoText(cut: Piece["cut"]): Bilingual {
  const fold = cut.onFold ? { ar: " على الثنية", en: " on fold" } : { ar: "", en: "" };
  const mirror = cut.mirror ? { ar: " (مع مقلوبها)", en: " (and mirrored)" } : { ar: "", en: "" };
  const fabric = FABRIC_TEXT[cut.fabric] ?? { ar: "", en: "" };
  const fabricAr = fabric.ar && ` - ${fabric.ar}`;
  const fabricEn = fabric.en && ` - ${fabric.en}`;
  return {
    ar: `اقصّي ${cut.quantity}${fold.ar}${mirror.ar}${fabricAr}`,
    en: `Cut ${cut.quantity}${fold.en}${mirror.en}${fabricEn}`,
  };
}

/**
 * The size line of a piece: size label, optional client label and the engine version.
 *
 * @param sizeLabel - Size label such as "M" or "custom".
 * @param clientLabel - Client name or code, when the caller gave one.
 * @returns The bilingual text.
 */
export function sizeLabelText(sizeLabel: string, clientLabel?: string): Bilingual {
  const client = clientLabel ? ` - ${clientLabel}` : "";
  return {
    ar: `المقاس ${sizeLabel}${client} - ${ENGINE_STAMP}`,
    en: `Size ${sizeLabel}${client} - ${ENGINE_STAMP}`,
  };
}

/** Text of the scale check square. */
export const SCALE_SQUARE_TEXT: Bilingual = { ar: "10 سم", en: "10 cm" };
