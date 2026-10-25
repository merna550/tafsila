/** Scene types and the two small queries the pattern viewer runs on the main thread (issue #243). No drafting code here. */
import type { Piece, Point } from "@tafsila/schemas";

/** A text in both languages. */
type LocalizedText = Piece["name"];

/** One named edge of a piece, drawn on the sheet. */
export interface SceneEdge {
  /** Edge id, unique inside its piece. */
  readonly id: string;
  /** Path data on the sheet, in mm. */
  readonly d: string;
  /** What the edge is for, when the engine says. */
  readonly kind?: Piece["edges"][number]["kind"];
  /** Length along the stitch line, in mm. */
  readonly lengthMm: number;
  /** Seam allowance of the edge, in mm. */
  readonly seamAllowanceMm: number;
}

/** A point the measure tool can snap to, in sheet mm. */
export interface SnapPoint {
  /** Id, unique inside the scene. */
  readonly id: string;
  /** The piece it belongs to. */
  readonly pieceId: string;
  /** Position on the sheet. */
  readonly at: Point;
  /** A corner of the stitch line, or a notch. */
  readonly kind: "vertex" | "notch";
}

/** One piece ready to draw: every line is path data in sheet mm. */
export interface ScenePiece {
  /** Piece id. */
  readonly id: string;
  /** Piece name. */
  readonly name: LocalizedText;
  /** How many to cut, on what fabric. */
  readonly cut: Piece["cut"];
  /** Cut-line bounding box size, in mm. */
  readonly bboxMm: { readonly widthMm: number; readonly heightMm: number };
  /** Top-left of the cut-line box on the sheet, in mm. */
  readonly cell: Point;
  /** Move that put the piece on the sheet. */
  readonly offset: Point;
  /** Cut line, closed. */
  readonly cutD: string;
  /** Stitch line, closed. */
  readonly stitchD: string;
  /** Grain line with arrowheads. */
  readonly grainD: string;
  /** Named edges. */
  readonly edges: readonly SceneEdge[];
  /** Notches: ticks path, the edge, and the point on the stitch line. */
  readonly notches: readonly {
    readonly id: string;
    readonly edgeId: string;
    readonly d: string;
    readonly at: Point;
  }[];
  /** Darts as leg, apex, leg. */
  readonly darts: readonly { readonly id: string; readonly d: string }[];
  /** Labels with their words, position, turn and text height. */
  readonly labels: readonly {
    readonly id: string;
    readonly text: LocalizedText;
    readonly at: Point;
    readonly rotationDeg: number;
    readonly sizeMm: number;
  }[];
  /** Points the measure tool snaps to. */
  readonly snapPoints: readonly SnapPoint[];
}

/** Everything the viewer draws: the sheet size and its pieces. JSON-serialisable, so it crosses the worker boundary. */
export interface PatternScene {
  /** Sheet width in mm. */
  readonly widthMm: number;
  /** Sheet height in mm. */
  readonly heightMm: number;
  /** One entry per piece, in piece order. */
  readonly pieces: readonly ScenePiece[];
}

/** A piece, or one edge or dart of it, the viewer can select, highlight or zoom to. */
export interface ViewerTarget {
  /** The piece. */
  readonly pieceId: string;
  /** An edge of the piece. */
  readonly edgeId?: string;
  /** A dart of the piece. */
  readonly dartId?: string;
}

/**
 * Turns a validation `refs` string (`pieceId`, `pieceId/edgeId`, `pieceId/dartId` or `pieceId/edgeId#part`, which names the edge, or `pieceId/body-line:id`, which marks the piece) into a target.
 *
 * @param scene - The scene to look the ids up in.
 * @param ref - The reference text.
 * @returns The target, or null when the reference names nothing in the scene (for example a body line).
 */
export function resolveRef(scene: PatternScene, ref: string): ViewerTarget | null {
  const [pieceId, rawPart, ...rest] = ref.split("/");
  const part = rawPart?.split("#")[0];
  const piece = scene.pieces.find((p) => p.id === pieceId);
  if (!piece || rest.length > 0) return null;
  if (part === undefined || part.startsWith("body-line:")) return { pieceId: piece.id };
  if (piece.edges.some((e) => e.id === part)) return { pieceId: piece.id, edgeId: part };
  if (piece.darts.some((d) => d.id === part)) return { pieceId: piece.id, dartId: part };
  return null;
}

/**
 * Straight distance between two points on the sheet.
 *
 * @param a - First point, in mm.
 * @param b - Second point, in mm.
 * @returns The distance in mm.
 */
export function measureBetween(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
