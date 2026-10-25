/**
 * Texts of the direct-cut marking steps (issue #284), in Arabic and English. Steps carry a key and parameters; this
 * file turns them into text. Arabic follows docs/design/copy.md and the approved DirectCut screen; distances are shown
 * in cm with one decimal and Western digits (NFR-06). No geometry here, so the checklist can import it on the main
 * thread (`@tafsila/engine/cut-text`).
 */
import type { Piece } from "@tafsila/schemas";
import type { CutStep, CutStepKey } from "../cut/types";
import { type Bilingual, cutInfoText } from "./pieces";

/** A display language. */
export type CutTextLanguage = keyof Bilingual;

/** Millimetres in a centimetre. */
const MM_PER_CM = 10;

/** Decimals shown for a distance in cm (1 mm). */
const CM_DECIMALS = 1;

/** Placeholders a template may use that are worked out from the parameters, not taken from them. */
export const DERIVED_PLACEHOLDERS: readonly string[] = ["cutInfo"];

/**
 * Text template of each step key; `{name}` is filled from the step parameters (`…Mm` values turn into cm).
 */
export const CUT_STEP_TEXTS: Readonly<Record<CutStepKey, Bilingual>> = {
  "cut.reference.fold": {
    ar: "الخط المرجعي هو الطيّة. قيسي كل المسافات منها.",
    en: "The fold is the reference line. Measure every distance from it.",
  },
  "cut.reference.grain": {
    ar: "ارسمي خطاً مرجعياً موازياً لحافة القماش. قيسي كل المسافات منه.",
    en: "Draw a reference line parallel to the selvedge. Measure every distance from it.",
  },
  "cut.reference.top": {
    ar: "ارسمي خطاً عمودياً على الخط المرجعي عند أعلى القطعة: هذا هو الخط العلوي.",
    en: "Draw a line square to the reference line at the top of the piece: this is the top line.",
  },
  "cut.mark.corner": {
    ar: "انزلي {alongMm} سم من الخط العلوي و {acrossMm} سم من الخط المرجعي، وضعي النقطة {point}.",
    en: "Measure {alongMm} cm down from the top line and {acrossMm} cm from the reference line. Mark point {point}.",
  },
  "cut.mark.curve": {
    ar: "على المنحنى: انزلي {alongMm} سم من الخط العلوي و {acrossMm} سم من الخط المرجعي، وضعي النقطة {point}.",
    en: "On the curve: measure {alongMm} cm down and {acrossMm} cm from the reference line. Mark point {point}.",
  },
  "cut.mark.notch": {
    ar: "علامة المطابقة: انزلي {alongMm} سم من الخط العلوي و {acrossMm} سم من الخط المرجعي، وضعي النقطة {point}.",
    en: "Notch: measure {alongMm} cm down and {acrossMm} cm from the reference line. Mark point {point}.",
  },
  "cut.mark.dart": {
    ar: "للدارت: انزلي {alongMm} سم من الخط العلوي و {acrossMm} سم من الخط المرجعي، وضعي النقطة {point}.",
    en: "Dart: measure {alongMm} cm down and {acrossMm} cm from the reference line. Mark point {point}.",
  },
  "cut.mark.grain": {
    ar: "لخط النسيج: انزلي {alongMm} سم من الخط العلوي و {acrossMm} سم من الخط المرجعي، وضعي النقطة {point}.",
    en: "Grain line: measure {alongMm} cm down and {acrossMm} cm from the reference line. Mark point {point}.",
  },
  "cut.connect.straight": {
    ar: "صلي النقطة {from} بالنقطة {to} بخط مستقيم.",
    en: "Join point {from} to point {to} with a straight line.",
  },
  "cut.connect.curve": {
    ar: "صلي النقاط من {from} إلى {to} بخط منحنٍ ناعم.",
    en: "Join the points from {from} to {to} with a smooth curve.",
  },
  "cut.connect.dart": {
    ar: "ارسمي الدارت: من {legA} إلى رأسه {apex} ثم إلى {legB}.",
    en: "Draw the dart: from {legA} to its point {apex}, then to {legB}.",
  },
  "cut.connect.grain": {
    ar: "ارسمي خط النسيج من {from} إلى {to}.",
    en: "Draw the grain line from {from} to {to}.",
  },
  "cut.cut": {
    ar: "على الخط المرسوم: {cutInfo}.",
    en: "{cutInfo}, along the drawn line.",
  },
};

/**
 * A distance in mm as cm with one decimal and Western digits.
 *
 * @param mm - The distance, mm.
 * @returns The text, e.g. "12.5".
 * @example
 * formatCm(125) // "12.5"
 */
export function formatCm(mm: number): string {
  return (mm / MM_PER_CM).toFixed(CM_DECIMALS);
}

/**
 * The cut details of a `cut.cut` step back as the piece's cut, to reuse the label wording.
 *
 * @param params - The step parameters.
 * @returns The cut.
 */
function cutFromParams(params: CutStep["params"]): Piece["cut"] {
  return {
    quantity: Number(params["quantity"]),
    onFold: params["onFold"] === 1,
    mirror: params["mirror"] === 1,
    fabric: params["fabric"] as Piece["cut"]["fabric"],
  };
}

/**
 * The value that fills one placeholder.
 *
 * @param step - The step.
 * @param name - The placeholder name.
 * @param lang - The language.
 * @returns The text to put in its place.
 */
function placeholderValue(step: Pick<CutStep, "params">, name: string, lang: CutTextLanguage): string {
  if (name === "cutInfo") return cutInfoText(cutFromParams(step.params))[lang];
  const value = step.params[name];
  if (value === undefined) return `{${name}}`;
  return name.endsWith("Mm") && typeof value === "number" ? formatCm(value) : String(value);
}

/**
 * The text of one marking step in one language.
 *
 * @param step - The step (its key and parameters).
 * @param lang - `ar` or `en`.
 * @returns The filled text.
 * @example
 * cutStepText({ key: "cut.connect.straight", params: { from: "A", to: "B" } }, "en") // "Join point A to point B with a straight line."
 */
export function cutStepText(step: Pick<CutStep, "key" | "params">, lang: CutTextLanguage): string {
  return CUT_STEP_TEXTS[step.key][lang].replace(/\{(\w+)\}/g, (_, name: string) =>
    placeholderValue(step, name, lang),
  );
}
