/** Orders size labels the way a person reads them (S, M, L, XL), not the way the database stores JSON keys. */

/** Known labels from smallest to largest. */
const KNOWN_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"] as const;

/**
 * Sorts size labels: known labels in garment order first, then the others in their given order.
 *
 * @param labels - Size labels in any order.
 * @returns A new array in reading order.
 * @example
 * sortSizes(["L", "M", "S", "XL", "XXL"]); // ["S", "M", "L", "XL", "XXL"]
 */
export function sortSizes(labels: readonly string[]): string[] {
  /**
   * Position of a label in the known order.
   *
   * @param label - Size label.
   * @returns Its index, or the number of known labels when unknown.
   */
  const rank = (label: string): number => {
    const index = (KNOWN_ORDER as readonly string[]).indexOf(label.toUpperCase());
    return index === -1 ? KNOWN_ORDER.length : index;
  };
  return labels
    .map((label, position) => ({ label, position }))
    .sort((a, b) => rank(a.label) - rank(b.label) || a.position - b.position)
    .map((entry) => entry.label);
}
