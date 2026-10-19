/**
 * The lining feature module (issue #145, FR-PAT-07, decision 145): a copy of every main-fabric shell piece, cut in lining
 * fabric with its hem raised. It runs after the closure (50) so it copies the final openings. Sleeves, collars, cuffs,
 * bands, facings, pockets and the belt are not lined; an edge that pairs with an unlined piece pairs with its own shell
 * twin instead (the lining is basted to the shell there). Trimming the lining at the facings and the zip opening are
 * follow-ups (decision 145, 5 and 7 as built).
 */
import type { Edge } from "@tafsila/schemas";
import { LINING_HEM_ALLOWANCE_MM } from "../../constants/lining";
import { withEdgeAllowance } from "../../pieces/edge-allowance";
import { type DraftContext, type PieceDraft, withPieces } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { HEM_EDGE_ID, raiseHem } from "./hem";
import { LINING_HEM_RULE } from "./rules";

/** After the closure (50), before finishing. */
export const LINING_ORDER = 60;

/** Prefix of a lining piece id. */
export const LINING_PREFIX = "lining-";

/** The shell pieces that get a lining: bodice, skirt and tier pieces (not their facings, which have other prefixes). */
const LINED_ID = /^(bodice|skirt|tier)-/;

/**
 * Whether a piece is lined.
 *
 * @param piece - A piece.
 * @returns True for a main-fabric bodice, skirt or tier piece.
 */
export function isLined(piece: PieceDraft): boolean {
  return piece.cut.fabric === "main" && LINED_ID.test(piece.id);
}

/**
 * Points an edge at the lining twin of its pair, or at the pair itself when the pair is not lined.
 *
 * @param edge - A shell edge.
 * @param pieceId - The shell piece that owns it.
 * @param lined - Ids of the lined pieces.
 * @returns The edge for the lining piece.
 */
function remapEdge(edge: Edge, pieceId: string, lined: ReadonlySet<string>): Edge {
  if (!edge.pairsWith) return edge;
  const { pieceId: otherId } = edge.pairsWith;
  const pairsWith = lined.has(otherId)
    ? { ...edge.pairsWith, pieceId: `${LINING_PREFIX}${otherId}` }
    : { ...edge.pairsWith, pieceId: `${LINING_PREFIX}${pieceId}`, edgeId: edge.id, intendedEaseMm: 0 };
  return { ...edge, pairsWith };
}

/**
 * The lining copy of one shell piece (before finishing, so no cut path yet): same cut, darts and marks; no notches and no body lines (the shell's count).
 *
 * @param piece - The shell piece.
 * @param lined - Ids of the lined pieces.
 * @returns The lining piece with its hem raised.
 */
function liningPiece(piece: PieceDraft, lined: ReadonlySet<string>): PieceDraft {
  return raiseHem({
    ...piece,
    id: `${LINING_PREFIX}${piece.id}`,
    name: { ar: `بطانة ${piece.name.ar}`, en: `Lining, ${piece.name.en}` },
    cut: { ...piece.cut, fabric: "lining" },
    edges: piece.edges.map((edge) => remapEdge(edge, piece.id, lined)),
    notches: [],
    bodyLines: [],
  });
}

/**
 * Drafts the lining.
 *
 * @param ctx - Context after the closure.
 * @returns The context with a lining piece per lined shell piece.
 * @throws {DraftingError} LINING_TARGET_MISSING when a hem cannot be raised.
 */
export function draftLining(ctx: DraftContext): DraftContext {
  const shell = ctx.pieces.filter(isLined);
  const lined = new Set(shell.map((p) => p.id));
  const copies = shell.map((p) => liningPiece(p, lined));
  const hemRefs = copies
    .filter((p) => p.edges.some((e) => e.id === HEM_EDGE_ID))
    .map((p) => `${p.id}/${HEM_EDGE_ID}`);
  const carried = shell.flatMap((p) =>
    Object.keys(ctx.options.seamAllowance.perEdgeMm)
      .filter((key) => key.startsWith(`${p.id}/`))
      .map((key) => [`${LINING_PREFIX}${key}`, ctx.options.seamAllowance.perEdgeMm[key]!] as const),
  );
  const options = {
    ...ctx.options,
    seamAllowance: {
      ...ctx.options.seamAllowance,
      perEdgeMm: { ...Object.fromEntries(carried), ...ctx.options.seamAllowance.perEdgeMm },
    },
  };
  const next = withEdgeAllowance({ ...ctx, options }, hemRefs, LINING_HEM_ALLOWANCE_MM);
  return withPieces(next, [...next.pieces, ...copies]);
}

/** The lining. */
export const liningModule: FeatureModule = {
  id: "lining",
  order: LINING_ORDER,
  appliesTo: (spec) => spec.lining,
  draft: draftLining,
  validations: [LINING_HEM_RULE],
};
