/** Reads from a scene without drawing it: boxes around targets and the grid lines (issue #243). */
import type { PatternScene, ScenePiece, ViewerTarget } from "@tafsila/engine/viewer";
import type { MmBox } from "./types";

/** Spacing of the minor grid lines, in mm. */
const GRID_MINOR_MM = 10;
/** Spacing of the major grid lines, in mm. */
const GRID_MAJOR_MM = 100;

/**
 * Box around all the numbers of a path's data (control points included, which is close enough for framing).
 *
 * @param d - Path data in absolute sheet mm.
 * @returns The box, or null for empty data.
 */
function pathBox(d: string): MmBox | null {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  if (xs.length === 0 || ys.length === 0) return null;
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, widthMm: Math.max(...xs) - x, heightMm: Math.max(...ys) - y };
}

/**
 * Box of one piece's cut line on the sheet.
 *
 * @param piece - The piece.
 * @returns Its box.
 */
function pieceBox(piece: ScenePiece): MmBox {
  return { x: piece.cell.x, y: piece.cell.y, ...piece.bboxMm };
}

/**
 * Box of one target: the piece, its edge or its dart.
 *
 * @param scene - The scene.
 * @param target - What to frame.
 * @returns The box, or null when the target is not in the scene.
 */
function oneBox(scene: PatternScene, target: ViewerTarget): MmBox | null {
  const piece = scene.pieces.find((p) => p.id === target.pieceId);
  if (!piece) return null;
  const d =
    (target.edgeId !== undefined && piece.edges.find((e) => e.id === target.edgeId)?.d) ||
    (target.dartId !== undefined && piece.darts.find((x) => x.id === target.dartId)?.d) ||
    null;
  return d ? pathBox(d) : pieceBox(piece);
}

/**
 * Box around several targets.
 *
 * @param scene - The scene.
 * @param targets - What to frame.
 * @returns The union box, or null when none of the targets is in the scene.
 */
export function targetBox(scene: PatternScene, targets: readonly ViewerTarget[]): MmBox | null {
  const boxes = targets.map((t) => oneBox(scene, t)).filter((b): b is MmBox => b !== null);
  if (boxes.length === 0) return null;
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    widthMm: Math.max(...boxes.map((b) => b.x + b.widthMm)) - x,
    heightMm: Math.max(...boxes.map((b) => b.y + b.heightMm)) - y,
  };
}

/**
 * Whether the whole piece is in a list of targets.
 *
 * @param list - The targets.
 * @param pieceId - Piece to test.
 * @returns True when a target names the piece alone.
 */
export function isPieceTargeted(list: readonly ViewerTarget[], pieceId: string): boolean {
  return list.some((t) => t.pieceId === pieceId && t.edgeId === undefined && t.dartId === undefined);
}

/**
 * Whether one edge or dart is in a list of targets.
 *
 * @param list - The targets.
 * @param pieceId - Its piece.
 * @param part - The edge or dart id to test.
 * @returns True when a target names exactly this edge or dart.
 */
export function isPartTargeted(
  list: readonly ViewerTarget[],
  pieceId: string,
  part: { readonly edgeId: string } | { readonly dartId: string },
): boolean {
  return list.some(
    (t) => t.pieceId === pieceId && ("edgeId" in part ? t.edgeId === part.edgeId : t.dartId === part.dartId),
  );
}

/**
 * Grid lines of the sheet: thin every 10 mm, strong every 100 mm.
 *
 * @param scene - The scene.
 * @returns Path data of the two sets.
 */
export function gridPaths(scene: Pick<PatternScene, "widthMm" | "heightMm">): {
  minor: string;
  major: string;
} {
  const minor: string[] = [];
  const major: string[] = [];
  for (let x = 0; x <= scene.widthMm; x += GRID_MINOR_MM) {
    (x % GRID_MAJOR_MM === 0 ? major : minor).push(`M ${x} 0 V ${scene.heightMm}`);
  }
  for (let y = 0; y <= scene.heightMm; y += GRID_MINOR_MM) {
    (y % GRID_MAJOR_MM === 0 ? major : minor).push(`M 0 ${y} H ${scene.widthMm}`);
  }
  return { minor: minor.join(" "), major: major.join(" ") };
}
