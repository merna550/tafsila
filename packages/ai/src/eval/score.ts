/**
 * Scoring rules of the AI evaluation (issue #338, decision 338): pure functions that compare an analysed design with
 * its label, feature by feature. The provider choice (#347) and the M6 exit rest on these numbers, so every rule is
 * written down here and in `docs/decisions/338-ai-eval-harness.md` before any real run.
 */
import { featureApplies } from "@tafsila/engine/spec-rules";
import {
  DESIGN_FEATURE_PATHS,
  LOW_CONFIDENCE,
  type DesignAnalysisResult,
  type DesignFeaturePath,
  type DesignSpec,
} from "@tafsila/schemas";
import type { EvalLabel } from "./labels";

/** Features that may be missing from a design; `"none"` (and no pockets) means the feature is absent. */
const OPTIONAL_FEATURES: ReadonlySet<DesignFeaturePath> = new Set([
  "skirt.slit",
  "waistband",
  "pockets",
  "belt",
]);

/** How an absent feature is written in the confusion list. */
export const ABSENT = "(absent)";

/** How many of the most common wrong answers the report lists. */
export const CONFUSION_LIMIT = 15;

/** One compared feature of one photo. */
export interface FeatureScore {
  /** The feature. */
  readonly path: DesignFeaturePath;
  /** The labelled value, or undefined when the label has no such feature. */
  readonly expected: string | undefined;
  /** The analysed value, or undefined when the model gave none (or the call failed). */
  readonly predicted: string | undefined;
  /** True when both values are equal. */
  readonly correct: boolean;
  /** The model's confidence in the feature; undefined when the call failed. */
  readonly confidence: number | undefined;
}

/** A design seen as plain keys, for reading a feature by path. */
type Loose = Record<string, unknown>;

/**
 * The value of one feature as text, so every feature compares the same way.
 *
 * @param spec - The design.
 * @param path - The feature.
 * @returns The value; pockets as a sorted set (`"patch+side-seam"`); undefined when the feature is absent.
 */
export function featureValue(spec: DesignSpec, path: DesignFeaturePath): string | undefined {
  if (path === "pockets") return pocketSet(spec.pockets);
  if (path === "skirt.slit") return spec.skirt?.slit?.position;
  const raw = rawValue(spec, path);
  if (raw === undefined) return undefined;
  return OPTIONAL_FEATURES.has(path) && raw === "none" ? undefined : raw;
}

/**
 * The pockets as one value, order and repeats ignored.
 *
 * @param pockets - The pocket styles.
 * @returns The sorted styles joined by `+`, or undefined for no pockets.
 */
function pocketSet(pockets: DesignSpec["pockets"]): string | undefined {
  const styles = [...new Set(pockets)].sort((a, b) => a.localeCompare(b, "en"));
  return styles.length === 0 ? undefined : styles.join("+");
}

/**
 * Reads an enum or boolean feature by its path.
 *
 * @param spec - The design.
 * @param path - A feature other than pockets and slit.
 * @returns The value as text, or undefined when it (or its part) is missing.
 */
function rawValue(spec: DesignSpec, path: DesignFeaturePath): string | undefined {
  const [group, field] = path.split(".") as [string, string | undefined];
  const top = (spec as unknown as Loose)[group];
  const raw = field === undefined ? top : (top as Loose | undefined)?.[field];
  return typeof raw === "string" || typeof raw === "boolean" ? String(raw) : undefined;
}

/**
 * The model's confidence in one feature. A feature the model gave no confidence for counts as sure (1).
 *
 * @param result - The analysis.
 * @param path - The feature.
 * @returns The confidence, 0 to 1.
 */
function confidenceOf(result: DesignAnalysisResult, path: DesignFeaturePath): number {
  if (path === "category") return result.confidence.category ?? result.category.confidence;
  return result.confidence[path] ?? 1;
}

/**
 * Compares one analysed photo with its label. Features that do not apply to the label's category are skipped, and so
 * is an optional feature absent in both (decision 338, 2). A failed call (no result) makes every labelled feature wrong.
 *
 * @param label - The label.
 * @param result - The analysis, or undefined when the call failed.
 * @returns One score per compared feature, in `DESIGN_FEATURE_PATHS` order.
 */
export function scorePhoto(label: EvalLabel, result: DesignAnalysisResult | undefined): FeatureScore[] {
  return DESIGN_FEATURE_PATHS.filter((path) => featureApplies(label.category, path)).flatMap((path) => {
    const expected = featureValue(label.spec, path);
    const predicted = result === undefined ? undefined : featureValue(result.spec, path);
    if (expected === undefined && predicted === undefined) return [];
    const confidence = result === undefined ? undefined : confidenceOf(result, path);
    return [{ path, expected, predicted, correct: expected === predicted, confidence }];
  });
}

/** Correct out of compared, and the share. */
export interface Tally {
  /** Features compared. */
  readonly compared: number;
  /** Features correct. */
  readonly correct: number;
  /** correct / compared, or null when nothing was compared. */
  readonly accuracy: number | null;
}

/**
 * Counts the correct scores.
 *
 * @param scores - The scores.
 * @returns The tally.
 */
export function tally(scores: readonly FeatureScore[]): Tally {
  const correct = scores.filter((score) => score.correct).length;
  return { compared: scores.length, correct, accuracy: ratio(correct, scores.length) };
}

/**
 * A share, or null when the whole is 0.
 *
 * @param part - The part.
 * @param whole - The whole.
 * @returns part / whole, or null.
 */
export function ratio(part: number, whole: number): number | null {
  return whole === 0 ? null : part / whole;
}

/**
 * The mean of each photo's accuracy (macro); photos with nothing compared are left out.
 *
 * @param photos - The scores of each photo.
 * @returns The mean, or null when no photo was compared.
 */
export function macroAccuracy(photos: readonly (readonly FeatureScore[])[]): number | null {
  const shares = photos.map((scores) => tally(scores).accuracy).filter((share) => share !== null);
  return shares.length === 0 ? null : shares.reduce((sum, share) => sum + share, 0) / shares.length;
}

/** One common wrong answer. */
export interface Confusion {
  /** The feature. */
  readonly path: DesignFeaturePath;
  /** The labelled value, or `ABSENT`. */
  readonly expected: string;
  /** The analysed value, or `ABSENT`. */
  readonly predicted: string;
  /** How many times it happened. */
  readonly count: number;
}

/**
 * The most common wrong answers, most frequent first (ties by feature order, then by text).
 *
 * @param scores - Every score of the run.
 * @param limit - How many to keep.
 * @returns The confusion list.
 */
export function confusions(scores: readonly FeatureScore[], limit = CONFUSION_LIMIT): Confusion[] {
  const counts = new Map<string, Confusion>();
  for (const score of scores.filter((item) => !item.correct)) {
    const expected = score.expected ?? ABSENT;
    const predicted = score.predicted ?? ABSENT;
    const key = `${score.path}\u0000${expected}\u0000${predicted}`;
    const count = (counts.get(key)?.count ?? 0) + 1;
    counts.set(key, { path: score.path, expected, predicted, count });
  }
  return [...counts.values()].sort(byFrequency).slice(0, limit);
}

/**
 * Orders confusions: most frequent first, then by feature order, then by text.
 *
 * @param a - One confusion.
 * @param b - The other.
 * @returns A sort comparison.
 */
function byFrequency(a: Confusion, b: Confusion): number {
  const order = DESIGN_FEATURE_PATHS.indexOf(a.path) - DESIGN_FEATURE_PATHS.indexOf(b.path);
  return (
    b.count - a.count ||
    order ||
    `${a.expected} ${a.predicted}`.localeCompare(`${b.expected} ${b.predicted}`, "en")
  );
}

/** How well the low-confidence flag (below `LOW_CONFIDENCE`) points at the wrong features. */
export interface ConfidenceCheck {
  /** Features the model flagged as unsure. */
  readonly low: Tally;
  /** Features the model was sure of. */
  readonly high: Tally;
  /** Wrong features with a confidence. */
  readonly wrong: number;
  /** Of those, how many were flagged. */
  readonly wrongFlagged: number;
  /** wrongFlagged / wrong: the share of mistakes the confirmation screen would ask about. */
  readonly flagRecall: number | null;
}

/**
 * Checks the confidence flag against the truth. Failed calls (no confidence) are left out.
 *
 * @param scores - Every score of the run.
 * @returns Accuracy per band and the flag's recall.
 */
export function confidenceCheck(scores: readonly FeatureScore[]): ConfidenceCheck {
  const rated = scores.filter((score) => score.confidence !== undefined);
  const wrong = rated.filter((score) => !score.correct);
  const wrongFlagged = wrong.filter(isLow).length;
  return {
    low: tally(rated.filter(isLow)),
    high: tally(rated.filter((score) => !isLow(score))),
    wrong: wrong.length,
    wrongFlagged,
    flagRecall: ratio(wrongFlagged, wrong.length),
  };
}

/**
 * Whether the model flagged a feature as unsure.
 *
 * @param score - A rated score.
 * @returns True below `LOW_CONFIDENCE`.
 */
function isLow(score: FeatureScore): boolean {
  return (score.confidence ?? 1) < LOW_CONFIDENCE;
}

/** Words too common to count in an unsupported-feature match. */
const STOP_WORDS: ReadonlySet<string> = new Set(["the", "and", "with", "for", "not", "yet", "are", "has"]);

/**
 * Cuts a word to a rough stem, so "puffed sleeves" and "puff sleeve" share their words.
 *
 * @param word - A lower-case word.
 * @returns The stem.
 */
function stem(word: string): string {
  const single = word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
  return single.replace(/(ed|ing)$/, "");
}

/**
 * The content words of a text, stemmed.
 *
 * @param text - English text.
 * @returns The set of stems.
 */
export function contentWords(text: string): Set<string> {
  const words = text.toLowerCase().split(/[^a-z0-9]+/);
  return new Set(words.filter((word) => word.length > 2 && !STOP_WORDS.has(word)).map(stem));
}

/**
 * Whether the model reported a labelled unsupported item: at least half of the label's content words appear in one
 * reported item (decision 338, 3).
 *
 * @param labelled - The label's text.
 * @param reported - The model's unsupported texts (English).
 * @returns True on a match.
 */
export function unsupportedMatched(labelled: string, reported: readonly string[]): boolean {
  const wanted = [...contentWords(labelled)];
  if (wanted.length === 0) return false;
  return reported.some((text) => {
    const words = contentWords(text);
    return wanted.filter((word) => words.has(word)).length * 2 >= wanted.length;
  });
}
