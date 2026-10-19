/** Shared LIKE helper for the Drizzle repositories. */

/**
 * Escapes `%`, `_` and `\` so a search term is matched literally by LIKE.
 *
 * @param term - Raw search text.
 * @returns Text safe to wrap in `%...%`.
 */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
