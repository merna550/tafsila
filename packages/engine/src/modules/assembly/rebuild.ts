/**
 * Rebuilds a bodice piece around a new outline (issue #144): edges are regrouped from labelled segments, keeping the
 * bodice's edge kinds and pairings, and the notches that still sit on a kept edge move with its start.
 */
import type { Edge, Notch, Segment } from "@tafsila/schemas";
import { DraftingError } from "../../errors/drafting-error";
import { pathLength } from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";
import { HEM_EDGE_ID, type LabeledSegment } from "./lower-half";

/** What {@link rebuildOutline} needs. */
export interface RebuildArgs {
  /** The bodice piece as drafted. */
  readonly piece: PieceDraft;
  /** The new closed outline, each stretch with its edge id. */
  readonly segments: readonly LabeledSegment[];
  /** Edges of the skirt the lower stretches came from, with their pairings already moved to bodice pieces. */
  readonly lowerEdges: readonly Edge[];
}

/**
 * The stretches of a piece's outline from one segment index to another, labelled with their edge ids.
 *
 * @param piece - The piece.
 * @param from - First segment index.
 * @param to - Last segment index (inclusive).
 * @returns The labelled stretches.
 */
export function labelled(piece: PieceDraft, from: number, to: number): LabeledSegment[] {
  return piece.stitchPath.slice(from, to + 1).map((seg, i) => {
    const index = from + i;
    const edge = piece.edges.find((e) => e.fromSegment <= index && index <= e.toSegment);
    if (!edge) throw new DraftingError("ASSEMBLY_EDGE_MISSING", `${piece.id} segment ${index} has no edge`);
    return { seg, edgeId: edge.id };
  });
}

/**
 * Groups labelled stretches into runs of the same edge id.
 *
 * @param segments - The stretches, in path order.
 * @returns One `[id, first, last]` per run.
 * @throws {DraftingError} ASSEMBLY_EDGE_SPLIT when an edge id appears in two separate runs.
 */
function runs(segments: readonly LabeledSegment[]): [string, number, number][] {
  const out: [string, number, number][] = [];
  segments.forEach(({ edgeId }, i) => {
    const last = out.at(-1);
    if (last && last[0] === edgeId) last[2] = i;
    else if (out.some(([id]) => id === edgeId)) {
      throw new DraftingError("ASSEMBLY_EDGE_SPLIT", `Edge ${edgeId} is split in two runs`);
    } else out.push([edgeId, i, i]);
  });
  return out;
}

/**
 * The edge template of an id: the bodice's own edge, else the skirt's, else a plain hem or seam.
 *
 * @param args - Rebuild inputs.
 * @param id - Edge id.
 * @returns The template (segment range replaced by the caller).
 */
function templateFor(args: RebuildArgs, id: string): Edge {
  const own = args.piece.edges.find((e) => e.id === id) ?? args.lowerEdges.find((e) => e.id === id);
  if (own) return own;
  return { id, fromSegment: 0, toSegment: 0, kind: id === HEM_EDGE_ID ? "hem" : "other", seamAllowanceMm: 0 };
}

/**
 * A notch moved onto the rebuilt edge: its distance grows by what was added before the edge's first old stretch.
 * A notch whose edge lost its first stretch is dropped (the waist).
 *
 * @param args - Rebuild inputs.
 * @param edges - The rebuilt edges.
 * @param notch - The notch.
 * @returns The moved notch, or undefined.
 */
function movedNotch(args: RebuildArgs, edges: readonly Edge[], notch: Notch): Notch | undefined {
  const old = args.piece.edges.find((e) => e.id === notch.edgeId);
  const edge = edges.find((e) => e.id === notch.edgeId);
  if (!old || !edge) return undefined;
  const first = args.piece.stitchPath[old.fromSegment];
  const at = args.segments.findIndex((s) => s.seg === first);
  if (at < edge.fromSegment || at > edge.toSegment) return undefined;
  const addedMm = pathLength(args.segments.slice(edge.fromSegment, at).map((s) => s.seg));
  return { ...notch, atMm: notch.atMm + addedMm };
}

/**
 * The new outline, edges and notches of a piece.
 *
 * @param args - The piece, its new labelled outline and the skirt edges.
 * @returns Stitch path, edges and notches.
 */
export function rebuildOutline(args: RebuildArgs): Pick<PieceDraft, "stitchPath" | "edges" | "notches"> {
  const stitchPath: Segment[] = args.segments.map((s) => s.seg);
  const edges = runs(args.segments).map(([id, fromSegment, toSegment]) => ({
    ...templateFor(args, id),
    fromSegment,
    toSegment,
  }));
  const notches = args.piece.notches
    .map((n) => movedNotch(args, edges, n))
    .filter((n): n is Notch => n !== undefined);
  return { stitchPath, edges, notches };
}
