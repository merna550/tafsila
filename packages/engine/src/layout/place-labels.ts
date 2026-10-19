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
  LABEL_MAX_GRID_CELLS,
  LABEL_REFINE_ROUNDS,
  LABEL_SIZE_MM,
  LABEL_SIZE_STEP_MM,
} from "../constants/labels";
import { bbox, distancePointToSegment, samplePath, type Rect } from "../geometry";
import {
  type AssembledGarment,
  cutInfoText,
  pieceNameText,
  sizeLabelText,
  type Bilingual,
} from "../i18n/pieces";
import { isOnePieceDress } from "../pipeline/category-rules";
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
 * Which garment the bodice pieces make once they run below the waist (#144): a blouse or a one-piece dress.
 *
 * @param spec - The design.
 * @returns The garment, or undefined when the bodice stops at the waist.
 */
function assembledGarment(spec: DraftContext["spec"]): AssembledGarment | undefined {
  if (spec.category === "blouse") return "blouse";
  return isOnePieceDress(spec) ? "dress" : undefined;
}

/**
 * The lines of a piece's label block, in print order.
 *
 * @param piece - The piece.
 * @param ctx - Context, for the size and client labels.
 * @returns Name, cut info, then size line.
 */
function blockLines(piece: PieceDraft, ctx: DraftContext): BlockLine[] {
  return [
    { kind: "name", text: pieceNameText(piece, assembledGarment(ctx.spec)) },
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
 * @param insetX - Horizontal inset; used to skip centres whose rectangle cannot fit in the outline bounds.
 * @param insetY - Vertical inset; used to skip centres whose rectangle cannot fit in the outline bounds.
 * @returns Points.
 */
function gridPoints(box: Rect, stepMm: number, insetX: number = 0, insetY: number = 0): Point[] {
  const points: Point[] = [];
  const firstX = box.minX + Math.ceil(insetX / stepMm) * stepMm;
  const firstY = box.minY + Math.ceil(insetY / stepMm) * stepMm;
  const lastX = box.maxX - insetX;
  const lastY = box.maxY - insetY;
  for (let y = firstY; y <= lastY; y += stepMm) {
    for (let x = firstX; x <= lastX; x += stepMm) points.push({ x, y });
  }
  return points;
}

/**
 * Distance from a point to the outline, or undefined as soon as it is found not to exceed a bound.
 *
 * @param p - The point.
 * @param outline - The sampled outline.
 * @param bound - The distance must be above this (or equal to it when `strict` is false).
 * @param strict - True when equal to the bound is not enough.
 * @returns The distance, or undefined when it does not pass the bound.
 */
function outlineDistanceAbove(
  p: Point,
  outline: readonly Point[],
  bound: number,
  strict: boolean,
): number | undefined {
  let nearest = Number.POSITIVE_INFINITY;
  for (let i = 1; i < outline.length; i += 1) {
    nearest = Math.min(nearest, distancePointToSegment(p, outline[i - 1]!, outline[i]!));
    if (strict ? nearest <= bound : nearest < bound) return undefined;
  }
  return nearest;
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
  // The box holds the disc of its half-shorter side around the centre, and the outline must stay a clearance
  // away from the box, so a centre nearer to the outline than that cannot fit (the same verdict as isClear).
  const least = Math.min(size.widthMm, size.heightMm) / 2 + LABEL_CLEARANCE_MM;
  for (const centre of candidates) {
    // A candidate no farther from the outline cannot replace the current best (equal scores keep the first), so
    // the outline scan stops as soon as it finds a segment that close.
    const score = outlineDistanceAbove(
      centre,
      obstacles.outline,
      best ? Math.max(best.score, least) : least,
      best !== undefined,
    );
    if (score === undefined) continue;
    if (!isClear(rectAround(centre, size), obstacles, LABEL_CLEARANCE_MM)) continue;
    best = { centre, score };
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
  // A block whose centre is closer than half its width or height to the outline's bounding box cannot have all
  // four corners inside the outline. Keep the original grid phase while omitting those impossible candidates.
  // Large pieces (a circle skirt is over a metre wide) get a coarser first grid so the scan stays a few thousand
  // candidates; the extra halving rounds below bring the result back to the same final resolution.
  const longSide = Math.max(box.maxX - box.minX, box.maxY - box.minY);
  const coarseStep = Math.max(LABEL_GRID_MM, longSide / LABEL_MAX_GRID_CELLS);
  let best = bestFit(gridPoints(box, coarseStep, size.widthMm / 2, size.heightMm / 2), size, obstacles);
  let step = coarseStep;
  const finalStep = LABEL_GRID_MM / 2 ** LABEL_REFINE_ROUNDS;
  while (best && step / 2 >= finalStep) {
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
