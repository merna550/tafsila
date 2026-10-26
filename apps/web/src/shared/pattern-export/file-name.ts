/** The name of a downloaded export file (ADR-289 item 5): Arabic kept, unsafe characters dropped. */
import type { ExportKind } from "./protocol";

/** Longest title part, in code points. */
const MAX_TITLE_CODE_POINTS = 60;

/** Characters no file system accepts in a name, and control characters. */
// eslint-disable-next-line no-control-regex -- control characters are exactly what is removed
const UNSAFE = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;

/** The suffix and extension of each kind. */
const SUFFIX: Record<ExportKind, string> = { a4: "-A4.pdf", svg: ".svg" };

/**
 * Removes dashes from both ends (a loop, not a regex, so the cost stays linear).
 *
 * @param text - Text that may start or end with dashes.
 * @returns The text without them.
 */
function trimDashes(text: string): string {
  let start = 0;
  let end = text.length;
  while (start < end && text[start] === "-") start += 1;
  while (end > start && text[end - 1] === "-") end -= 1;
  return text.slice(start, end);
}

/**
 * Makes the title safe for a file name: unsafe characters removed, spaces joined by dashes, cut at 60 characters.
 *
 * @param title - The design title.
 * @returns The cleaned title, or `pattern` when nothing is left.
 */
function cleanTitle(title: string): string {
  const words = title.replace(UNSAFE, "").split(/\s+/).filter(Boolean);
  const cut = [...words.join("-")].slice(0, MAX_TITLE_CODE_POINTS).join("");
  const cleaned = trimDashes(cut);
  return cleaned === "" ? "pattern" : cleaned;
}

/**
 * Builds `<title>-v<N>-A4.pdf` or `<title>-v<N>.svg`.
 *
 * @param input - Design title, version number and file kind.
 * @returns The file name.
 */
export function exportFileName(input: {
  readonly title: string;
  readonly versionNo: number;
  readonly kind: ExportKind;
}): string {
  return `${cleanTitle(input.title)}-v${input.versionNo}${SUFFIX[input.kind]}`;
}
