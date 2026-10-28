/** Turns a form field error into the text to show: a schema key is translated, text that came from the API is shown as it is. */

/**
 * Picks the text of a field error.
 *
 * @param text - The error message of the field (a schema key or API text), if any.
 * @param keys - The schema keys that exist in the messages.
 * @param translate - Translates a schema key.
 * @returns The text to show, or undefined when there is no error.
 */
export function fieldMessage(
  text: string | undefined,
  keys: readonly string[],
  translate: (key: string) => string,
): string | undefined {
  if (text === undefined) return undefined;
  return keys.includes(text) ? translate(text) : text;
}
