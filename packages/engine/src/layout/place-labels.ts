/**
 * Layout sub-step: the name, cut and size labels of each piece, placed inside its outline without touching a line
 * (FR-PAT-02, issue #131, decision 131). The position is a deterministic "pole of inaccessibility" search.
 */
import type { Label, Point } from "@tafsila/schemas";
import {
  LABEL_CLEARANCE_MM,
  LABEL_DESCENT_RATIO,
  LABEL_GRID_MM,
  LABEL_LINE_PITCH_RATIO,
  LABEL_MIN_SIZE_MM,
  LABEL_REFINE_ROUNDS,
  LABEL_SIZE_MM,
  LABEL_SIZE_STEP_MM,
} from "../constants/labels";
import { bbox, distancePointToPolyline, samplePath, type Rect } from "../geometry";
import { cutInfoText, pieceNameText, sizeLabelText, type Bilingual } from "../i18n/pieces";
import { type DraftContext, type PieceDraft, type Step, withPieces } from "../pipeline/draft-context";
import { isClear, obstaclesOf, textWidthMm, type PieceObstacles } from "./obstacles";

/** One line of the label block. */
interface BlockLine {
  /** Label kind of this line. */
  readonly kind: "name" | "cut" | "size";
  /** Its text. */
  readonly text: Bilingual;
}

/** Label kinds this step owns: it rewrites them on every run and keeps any other label. */
const OWNED_KINDS: readonly Label["kind"][] = ["name", "cut", "size"];

/**
 * The lines of a piece's label block, in print order.
 *
 * @param piece - The piece.
 * @param ctx - Context, for the size and client labels.
 * @returns Name, cut info, then size line.
 */
function blockLines(piece: PieceDraft, ctx: DraftContext): BlockLine[] {
  return [
    { kind: "name", text: pieceNameText(piece) },
    { kind: "cut", text: cutInfoText(piece.cut) },
    { kind: "size", text: sizeLabelText(ctx.options.sizeLabel, ctx.options.clientLabel) },
  ];
}

/** Size of the block at one text height. */
interface BlockSize {
  /** Text height in mm. */
  readonly sizeMm: number;
  /** Width of the widest line. */
  readonly widthMm: number;
  /** Total height, first line top to last descent. */
  readonly heightMm: number;
}

/**
 * Width and height of the block at a text height.
 *
 * @param lines - The block lines.
 * @param sizeMm - Text height.
 * @returns The block size.
 */
function blockSize(lines: readonly BlockLine[], sizeMm: number): BlockSize {
  const pitch = sizeMm * LABEL_LINE_PITCH_RATIO;
  return {
    sizeMm,
    widthMm: Math.max(...lines.map((l) => textWidthMm(l.text, sizeMm))),
    heightMm: sizeMm * (1 + LABEL_DESCENT_RATIO) + (lines.length - 1) * pitch,
  };
}

/**
 * The block box when centred on a point.
 *
 * @param centre - Box centre.
 * @param size - Block size.
 * @returns The box.
 */
function rectAround(centre: Point, size: BlockSize): Rect {
  return {
    minX: centre.x - size.widthMm / 2,
    minY: centre.y - size.heightMm / 2,
    maxX: centre.x + size.widthMm / 2,
    maxY: centre.y + size.heightMm / 2,
  };
}

/**
 * Candidate centres on a grid over a box, in a fixed order (rows top to bottom, then left to right).
 *
 * @param box - Area to cover.
 * @param stepMm - Grid step.
 * @returns Points.
 */
function gridPoints(box: Rect, stepMm: number): Point[] {
  const points: Point[] = [];
  for (let y = box.minY; y <= box.maxY; y += stepMm) {
    for (let x = box.minX; x <= box.maxX; x += stepMm) points.push({ x, y });
  }
  return points;
}

/**
 * The fitting centre farthest from the outline (the best pole of inaccessibility that holds the whole block).
 *
 * @param candidates - Centres to try, in order; the first of equal scores wins.
 * @param size - Block size.
 * @param obstacles - The piece.
 * @returns The best centre and its distance to the outline, or undefined when none fits.
 */
function bestFit(
  candidates: readonly Point[],
  size: BlockSize,
  obstacles: PieceObstacles,
): { centre: Point; score: number } | undefined {
  let best: { centre: Point; score: number } | undefined;
  for (const centre of candidates) {
    if (!isClear(rectAround(centre, size), obstacles, LABEL_CLEARANCE_MM)) continue;
    const score = distancePointToPolyline(centre, obstacles.outline);
    if (!best || score > best.score) best = { centre, score };
  }
  return best;
}

/**
 * Searches a grid, then refines around the best point with half steps.
 *
 * @param size - Block size.
 * @param obstacles - The piece.
 * @returns The block centre, or undefined when the block does not fit at this size.
 */
function findCentre(size: BlockSize, obstacles: PieceObstacles): Point | undefined {
  const box = bbox(obstacles.outline);
  let best = bestFit(gridPoints(box, LABEL_GRID_MM), size, obstacles);
  let step = LABEL_GRID_MM;
  for (let round = 0; best && round < LABEL_REFINE_ROUNDS; round += 1) {
    step /= 2;
    const around = gridPoints(
      {
        minX: best.centre.x - step,
        minY: best.centre.y - step,
        maxX: best.centre.x + step,
        maxY: best.centre.y + step,
      },
      step,
    );
    best = bestFit(around, size, obstacles) ?? best;
  }
  return best?.centre;
}

/**
 * Labels for a block whose box has its top-left at a given point.
 *
 * @param lines - Block lines.
 * @param size - Block size.
 * @param centreX - Horizontal centre of every line.
 * @param top - Top of the block.
 * @returns One label per line.
 */
function labelsFor(lines: readonly BlockLine[], size: BlockSize, centreX: number, top: number): Label[] {
  const pitch = size.sizeMm * LABEL_LINE_PITCH_RATIO;
  return lines.map((line, i) => ({
    id: line.kind,
    kind: line.kind,
    text: line.text,
    at: { x: centreX, y: top + size.sizeMm + i * pitch },
    rotationDeg: 0,
    sizeMm: size.sizeMm,
  }));
}

/**
 * Places the label block of one piece: inside at the largest text height that fits, else just below the piece.
 *
 * @param piece - The piece (needs its cut path for the fallback).
 * @param lines - Block lines.
 * @returns The three labels.
 */
export function placeBlock(piece: PieceDraft, lines: readonly BlockLine[]): Label[] {
  const obstacles = obstaclesOf(piece);
  for (let s = LABEL_SIZE_MM; s >= LABEL_MIN_SIZE_MM; s -= LABEL_SIZE_STEP_MM) {
    const size = blockSize(lines, s);
    const centre = findCentre(size, obstacles);
    if (centre) return labelsFor(lines, size, centre.x, centre.y - size.heightMm / 2);
  }
  const size = blockSize(lines, LABEL_MIN_SIZE_MM);
  const box = bbox(samplePath(piece.cutPath ?? piece.stitchPath));
  return labelsFor(lines, size, (box.minX + box.maxX) / 2, box.maxY + LABEL_CLEARANCE_MM);
}

/**
 * The label step: name, cut and size labels on every piece.
 *
 * @param ctx - Current context.
 * @returns The new context.
 */
export const placeLabelsStep: Step = (ctx) =>
  withPieces(
    ctx,
    ctx.pieces.map((piece) => ({
      ...piece,
      labels: [
        ...(piece.labels ?? []).filter((l) => !OWNED_KINDS.includes(l.kind)),
        ...placeBlock(piece, blockLines(piece, ctx)),
      ],
    })),
  );
