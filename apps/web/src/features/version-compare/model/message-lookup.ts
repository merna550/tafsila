/** Reads a text from the loaded messages by a path built at run time, so a value without a message falls back instead of throwing (issue #345). */

/**
 * Walks the messages along `path`.
 *
 * @param messages - The loaded messages of the page language.
 * @param path - Keys from the root, such as `["designPicker", "options", "sleeve_length", "long"]`.
 * @returns The text, or undefined when any step is missing or the end is not a text.
 */
export function lookupMessage(messages: unknown, path: readonly string[]): string | undefined {
  let node: unknown = messages;
  for (const key of path) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "string" ? node : undefined;
}
