/**
 * The guard of the fabric explanation (issue #346, FR-REC-04, decision 346, 2): a text may name only the fabrics it was
 * given and stay short. The model is told this too; the check is what makes it true.
 */
import { MAX_EXPLANATION_CHARS } from "@tafsila/schemas";

/** Most words an explanation may have. */
export const MAX_EXPLANATION_WORDS = 70;

/** A fabric as the check needs it: its two names. */
export interface NamedFabric {
  /** Catalogue id. */
  readonly id: string;
  /** Arabic name. */
  readonly nameAr: string;
  /** English name. */
  readonly nameEn: string;
}

/** Arabic combining marks (tashkeel and the tatweel). */
const ARABIC_MARKS = /[ً-ْـ]/g;

/** Arabic letter variants that are the same letter to a reader. */
const ARABIC_VARIANTS: readonly (readonly [RegExp, string])[] = [
  [/[أإآ]/g, "ا"],
  [/ى/g, "ي"],
  [/ة/g, "ه"],
];

/** Letters and digits; a name only counts when it is not inside a longer word. */
const WORD_CHAR = "\\p{L}\\p{N}";

/** Arabic prefixes that attach to a noun (and, for, with, as, "the"). */
const ARABIC_PREFIX = "(?:[وبلفك]?(?:ال)?)";

/**
 * Lower-cases and unifies Arabic letter variants, so "كريب" and "كريبـ" and "Crepe" and "crepe" compare equal.
 *
 * @param text - Any text.
 * @returns The normalised text.
 */
export function normalizeText(text: string): string {
  const plain = text.replace(ARABIC_MARKS, "").toLowerCase();
  return ARABIC_VARIANTS.reduce((acc, [pattern, to]) => acc.replace(pattern, to), plain);
}

/**
 * Escapes text for use inside a regular expression.
 *
 * @param text - Literal text.
 * @returns The escaped text.
 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds the pattern that finds a name as a whole word (an Arabic name may carry one prefix).
 *
 * @param name - A fabric name.
 * @returns The pattern.
 */
function namePattern(name: string): RegExp {
  const arabic = /\p{Script=Arabic}/u.test(name);
  const prefix = arabic ? ARABIC_PREFIX : "";
  return new RegExp(
    `(?<![${WORD_CHAR}])${prefix}${escapeRegExp(normalizeText(name))}(?![${WORD_CHAR}])`,
    "u",
  );
}

/**
 * Removes every mention of the given names, longest first, so a longer name ("cotton poplin") hides the shorter one
 * inside it ("cotton").
 *
 * @param text - Normalised text.
 * @param names - Names to remove.
 * @returns The text without them.
 */
function withoutNames(text: string, names: readonly string[]): string {
  return [...names]
    .sort((a, b) => b.length - a.length)
    .reduce((acc, name) => acc.replace(new RegExp(namePattern(name), "gu"), " "), text);
}

/**
 * Finds the catalogue fabrics that a text names although they are not in the allowed list.
 *
 * @param text - The model's text.
 * @param allowed - The fabrics the explanation may name.
 * @param catalogue - Every catalogue fabric.
 * @returns The ids of the fabrics named outside the allowed list (empty when the text is clean).
 */
export function fabricsNamedOutside(
  text: string,
  allowed: readonly NamedFabric[],
  catalogue: readonly NamedFabric[],
): string[] {
  const allowedIds = new Set(allowed.map((fabric) => fabric.id));
  const allowedNames = allowed.flatMap((fabric) => [fabric.nameAr, fabric.nameEn]).map(normalizeText);
  const rest = withoutNames(normalizeText(text), allowedNames);
  return catalogue
    .filter((fabric) => !allowedIds.has(fabric.id))
    .filter((fabric) => [fabric.nameAr, fabric.nameEn].some((name) => namePattern(name).test(rest)))
    .map((fabric) => fabric.id);
}

/**
 * Counts the words of a text.
 *
 * @param text - Any text.
 * @returns The number of space-separated words.
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Checks an explanation and says what is wrong with it, in words the model can act on.
 *
 * @param text - The model's text.
 * @param allowed - The fabrics the explanation may name.
 * @param catalogue - Every catalogue fabric.
 * @returns The problems (empty when the text is good).
 */
export function explanationProblems(
  text: string,
  allowed: readonly NamedFabric[],
  catalogue: readonly NamedFabric[],
): string[] {
  const problems: string[] = [];
  if (text.trim().length === 0) problems.push("the text is empty");
  const words = countWords(text);
  if (words > MAX_EXPLANATION_WORDS) {
    problems.push(`the text has ${words} words; the limit is ${MAX_EXPLANATION_WORDS}`);
  }
  if (text.length > MAX_EXPLANATION_CHARS) {
    problems.push(`the text has ${text.length} characters; the limit is ${MAX_EXPLANATION_CHARS}`);
  }
  const outside = fabricsNamedOutside(text, allowed, catalogue);
  if (outside.length > 0) problems.push(`it names fabrics that are not in the list: ${outside.join(", ")}`);
  return problems;
}
