/** Turns one difference into the words the panel shows, from the loaded messages (issue #345). */
import type { VersionDifference, DiffValue } from "./diff-versions";
import { lookupMessage } from "./message-lookup";

/** Millimetres in a centimetre. */
const MM_PER_CM = 10;

/** The fixed words the description needs; the screen passes them translated. */
export interface DescribeWords {
  /** Shown for a part a version does not have. */
  readonly absent: string;
  /** Boolean true. */
  readonly yes: string;
  /** Boolean false. */
  readonly no: string;
  /** Formats a length in cm. */
  readonly cm: (value: string) => string;
}

/** A difference as text. */
export interface DifferenceText {
  /** The feature, measurement or "Ease". */
  readonly label: string;
  /** The first version's value. */
  readonly from: string;
  /** The second version's value. */
  readonly to: string;
}

/**
 * Words one stored value: the picker's option name when it has one, then yes or no, centimetres, or the raw value.
 *
 * @param d - The difference the value belongs to.
 * @param value - The stored value.
 * @param messages - The loaded messages.
 * @param words - The fixed words.
 * @returns The text.
 */
function wordsOf(d: VersionDifference, value: DiffValue, messages: unknown, words: DescribeWords): string {
  if (value === undefined || value === "") return words.absent;
  const text = String(value);
  if (d.group === "measurement") return words.cm((Number(value) / MM_PER_CM).toFixed(1));
  if (d.group === "ease")
    return lookupMessage(messages, ["patternOptions", "ease", "profiles", text]) ?? text;
  if (d.key === "pockets") {
    return text
      .split(",")
      .map((p) => lookupMessage(messages, ["designPicker", "options", "pockets", p]) ?? p)
      .join(", ");
  }
  const option = lookupMessage(messages, ["designPicker", "options", d.key, text]);
  if (option !== undefined) return option;
  if (typeof value === "boolean") return value ? words.yes : words.no;
  return text;
}

/**
 * Finds the label of a difference.
 *
 * @param d - The difference.
 * @param messages - The loaded messages.
 * @returns The label; the raw key when no message exists.
 */
function labelOf(d: VersionDifference, messages: unknown): string {
  const path: Record<VersionDifference["group"], string[]> = {
    measurement: ["measurements", "labels", d.key],
    ease: ["patternOptions", "ease", "title"],
    feature: ["designPicker", "paths", d.key],
  };
  return lookupMessage(messages, path[d.group]) ?? d.key;
}

/**
 * Describes a difference in words.
 *
 * @param d - The difference.
 * @param messages - The loaded messages of the page language.
 * @param words - The fixed words.
 * @returns Label and both values as text.
 */
export function describeDifference(
  d: VersionDifference,
  messages: unknown,
  words: DescribeWords,
): DifferenceText {
  return {
    label: labelOf(d, messages),
    from: wordsOf(d, d.from, messages, words),
    to: wordsOf(d, d.to, messages, words),
  };
}
