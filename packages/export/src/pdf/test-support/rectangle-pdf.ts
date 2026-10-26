/** Test support: a one-rectangle pattern and its scene, so the sheet size follows the given size (tests only). */
import type { PatternScene } from "@tafsila/engine";
import type { PatternResult } from "@tafsila/schemas";
import { seedResult, seedScene } from "./seed-pdf";

/** Empty border around the piece on the sheet, in mm. */
const EDGE_MM = 20;

/**
 * A pattern with one rectangular piece of the given size, so the sheet (and the tile count) follows it.
 *
 * @param w - Piece width in mm.
 * @param h - Piece height in mm.
 * @returns The result and its scene.
 */
export function rectangle(w: number, h: number): { result: PatternResult; scene: PatternScene } {
  const base = seedResult.pieces[0]!;
  const corners = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const path = corners.map((from, i) => ({
    kind: "line" as const,
    from,
    to: corners[(i + 1) % corners.length]!,
  }));
  const piece = { ...base, cutPath: path, stitchPath: path, labels: [], notches: [], darts: [], edges: [] };
  const d = `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  const scenePiece = {
    ...seedScene.pieces[0]!,
    cutD: d,
    stitchD: d,
    grainD: "",
    notches: [],
    darts: [],
    labels: [],
  };
  return {
    result: { ...seedResult, pieces: [piece] },
    scene: {
      widthMm: w + 2 * EDGE_MM,
      heightMm: h + 2 * EDGE_MM,
      pieces: [{ ...scenePiece, cell: { x: EDGE_MM, y: EDGE_MM }, bboxMm: { widthMm: w, heightMm: h } }],
    },
  };
}
