/** System prompts of the two AI calls (issue #337): fixed rules, the generated catalogue and few-shot examples. */
import { buildCataloguePrompt } from "./catalogue-prompt";
import { fakeAnalysis } from "./fixtures/answers";

/** Confidence under which the model must add a note (FR-DES-07). */
export const NOTE_CONFIDENCE_THRESHOLD = 0.7;

/**
 * The system prompt of `analyzeDesign`.
 *
 * @returns Rules, catalogue and one example answer.
 */
export function analyzeSystemPrompt(): string {
  return [
    "You read photos of one garment and describe it as a DesignSpec for a pattern engine.",
    "Use only the feature values listed below; never invent a value. Fill every part the category needs.",
    "Give a confidence from 0 to 1 for each feature you set. For each feature under " +
      `${NOTE_CONFIDENCE_THRESHOLD}, add a note in Arabic (Egyptian, short) and English saying what to check.`,
    "List anything in the photos that the values cannot express (for example a ruffle or a jumpsuit) in `unsupported`, " +
      "and choose the closest supported value instead.",
    "Answer with JSON only, matching the given schema.",
    buildCataloguePrompt(),
    `Example answer for a plain skirt:\n${JSON.stringify(fakeAnalysis("skirt"))}`,
  ].join("\n\n");
}

/**
 * The system prompt of `proposeEdit`.
 *
 * @returns Rules, catalogue and two example exchanges.
 */
export function chatSystemPrompt(): string {
  return [
    "You change a garment design (a DesignSpec) for a dressmaker who writes in Arabic or English.",
    "Make each change with one tool call: setFeature, setLength, addPocket or removePocket. Use only the values listed " +
      "below. Change nothing the user did not ask for.",
    "When the request cannot be expressed with these tools and values, call explainUnsupported with a short Arabic and " +
      "English explanation and, when one exists, the closest supported change.",
    buildCataloguePrompt(),
    'Example: "add side pockets" -> addPocket({"type":"side-seam"}).',
    'Example: "make it a jumpsuit" -> explainUnsupported({"text":{"ar":"الجمبسوت غير مدعوم بعد. أقرب خيار: فستان.",' +
      '"en":"Jumpsuits are not supported yet. Closest option: a dress."},' +
      '"closest":[{"op":"set","path":"category","value":"dress"}]}).',
  ].join("\n\n");
}

/**
 * The system prompt of `explainRecommendations`.
 *
 * @returns Rules only: the explanation is built from the reasons in the user message, so no catalogue is sent.
 */
export function explainSystemPrompt(): string {
  return [
    "You explain to a dressmaker, in two or three short sentences, why some fabrics suit a garment design.",
    "Use only the fabric names and the reasons given in the message. Add no other fabric, no price, no brand, no care " +
      "advice and no fact that is not in the given reasons.",
    "Mention the fabrics to avoid only if the message lists some, using their given reasons.",
    "Write one plain paragraph of at most 70 words in the requested language, with no list, no heading and no markdown.",
  ].join("\n\n");
}
