/** Test helper (issue #139): piece id lists that include the neckline facings every bodice with a neckline gets. */
import { NECKLINE_PIECE_IDS } from "../modules/neckline/facing";

/**
 * Piece ids sorted by id.
 *
 * @param pieces - Pieces with an id.
 * @returns Their ids, sorted.
 */
export function sortedIds(pieces: readonly { readonly id: string }[]): string[] {
  return pieces.map((p) => p.id).sort((a, b) => a.localeCompare(b, "en"));
}

/**
 * The given piece ids plus the neckline facings and interfacings, sorted by id.
 *
 * @param ids - Ids of the other pieces.
 * @returns All ids, sorted.
 */
export function withFacings(ids: readonly string[]): string[] {
  return [...ids, ...NECKLINE_PIECE_IDS].sort((a, b) => a.localeCompare(b, "en"));
}
