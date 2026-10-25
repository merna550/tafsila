/** Builds the viewer's scene from a pattern: the same layout and path data as `renderSvg`, but as data (issue #243). */
import type { Piece, PatternResult, Point } from "@tafsila/schemas";
import { pointAtLength, translate } from "../geometry";
import { edgeLengthMm, edgeSegments } from "../pieces/measure";
import { pathData } from "./format";
import { DEFAULT_LABEL_SIZE_MM, dartData, grainData, notchData, onSheet } from "./layers";
import type { PatternScene, ScenePiece, SnapPoint } from "./scene-queries";
import { layoutSheet, type PiecePlacement } from "./sheet-layout";

/**
 * Corners of the stitch line and notch positions of one piece, on the sheet.
 *
 * @param pl - Where the piece sits.
 * @param notches - The notches with their point on the stitch line.
 * @returns The snap points.
 */
function snapPointsOf(pl: PiecePlacement, notches: readonly { id: string; at: Point }[]): SnapPoint[] {
  const pieceId = pl.piece.id;
  const vertices = pl.piece.stitchPath.map((segment, i) => ({
    id: `${pieceId}/v${i}`,
    pieceId,
    at: onSheet(segment.from, pl),
    kind: "vertex" as const,
  }));
  const marks = notches.map((n) => ({
    id: `${pieceId}/notch:${n.id}`,
    pieceId,
    at: n.at,
    kind: "notch" as const,
  }));
  return [...vertices, ...marks];
}

/**
 * One notch with its drawn ticks and its point on the stitch line.
 *
 * @param pl - Where the notch's piece sits.
 * @param notch - The notch.
 * @returns The scene notch.
 */
function sceneNotch(pl: PiecePlacement, notch: Piece["notches"][number]): ScenePiece["notches"][number] {
  const edge = edgeSegments(pl.piece, notch.edgeId);
  return {
    id: notch.id,
    edgeId: notch.edgeId,
    d: notchData(pl, notch),
    at: onSheet(pointAtLength(edge, notch.atMm), pl),
  };
}

/**
 * One piece as scene data.
 *
 * @param pl - Where the piece sits.
 * @returns The scene piece.
 */
function scenePiece(pl: PiecePlacement): ScenePiece {
  const piece = pl.piece;
  const [from, to] = piece.grainLine.map((p) => onSheet(p, pl));
  const notches = piece.notches.map((n) => sceneNotch(pl, n));
  return {
    id: piece.id,
    name: piece.name,
    cut: piece.cut,
    bboxMm: pl.size,
    cell: pl.cell,
    offset: pl.offset,
    cutD: pathData(translate(piece.cutPath, pl.offset), true),
    stitchD: pathData(translate(piece.stitchPath, pl.offset), true),
    grainD: grainData(from!, to!),
    edges: piece.edges.map((edge) => ({
      id: edge.id,
      d: pathData(translate(edgeSegments(piece, edge.id), pl.offset), false),
      ...(edge.kind === undefined ? {} : { kind: edge.kind }),
      lengthMm: edgeLengthMm(piece, edge.id),
      seamAllowanceMm: edge.seamAllowanceMm,
    })),
    notches,
    darts: piece.darts.map((dart) => ({ id: dart.id, d: dartData(pl, dart) })),
    labels: piece.labels
      .filter((label) => label.kind !== "scale-square")
      .map((label) => ({
        id: label.id,
        text: label.text,
        at: onSheet(label.at, pl),
        rotationDeg: label.rotationDeg,
        sizeMm: label.sizeMm ?? DEFAULT_LABEL_SIZE_MM,
      })),
    snapPoints: snapPointsOf(pl, notches),
  };
}

/**
 * Lays the pieces out as `renderSvg` does and returns everything the viewer draws.
 *
 * @param result - The pattern.
 * @returns A pure, JSON-serialisable scene.
 */
export function buildPatternScene(result: PatternResult): PatternScene {
  const layout = layoutSheet(result.pieces);
  return { widthMm: layout.widthMm, heightMm: layout.heightMm, pieces: layout.placements.map(scenePiece) };
}
