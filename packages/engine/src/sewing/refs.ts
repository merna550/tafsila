import type { PieceDraft } from "../pipeline/draft-context";

/** The prefix of a dart reference after the piece id. */
const DART_PREFIX = "dart:";

/** A parsed step reference. */
export interface ParsedRef {
  /** The piece id. */
  readonly pieceId: string;
  /** The edge id, or undefined for a bare piece or a dart. */
  readonly edgeId?: string;
  /** The dart id, or undefined for a piece or an edge. */
  readonly dartId?: string;
}

/**
 * Parses a step reference: `piece/edge`, `piece/dart:<id>` or a bare `piece`.
 *
 * @param ref - The reference.
 * @returns The parts.
 */
export function parseRef(ref: string): ParsedRef {
  const slash = ref.indexOf("/");
  if (slash < 0) return { pieceId: ref };
  const pieceId = ref.slice(0, slash);
  const rest = ref.slice(slash + 1);
  return rest.startsWith(DART_PREFIX)
    ? { pieceId, dartId: rest.slice(DART_PREFIX.length) }
    : { pieceId, edgeId: rest };
}

/**
 * Tells whether a reference names something that exists in the pieces.
 *
 * @param pieces - The pieces.
 * @param ref - The reference.
 * @returns True when the piece, edge or dart exists.
 */
export function refExists(
  pieces: readonly Pick<PieceDraft, "id" | "edges" | "darts">[],
  ref: string,
): boolean {
  const { pieceId, edgeId, dartId } = parseRef(ref);
  const piece = pieces.find((candidate) => candidate.id === pieceId);
  if (!piece) return false;
  if (edgeId !== undefined) return piece.edges.some((edge) => edge.id === edgeId);
  if (dartId !== undefined) return piece.darts.some((dart) => dart.id === dartId);
  return true;
}
