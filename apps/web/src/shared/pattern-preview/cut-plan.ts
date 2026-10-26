/**
 * The only place that knows the engine's `CutSteps` type: maps it to the page's `CutPlan` (issue #291). Runs in the
 * worker. Texts are filled here in both languages, the reference steps become the piece's reference text, and the
 * geometry is moved so the cut line's box starts at 0,0 for the diagram.
 */
import { pathData, samplePath, type CutPoint, type CutSteps, type PieceCutSteps } from "@tafsila/engine";
import { cutStepText } from "@tafsila/engine/cut-text";
import type { Piece, Point, Segment } from "@tafsila/schemas";
import type { CutPiecePlan, CutPlan, CutPlanLine, CutPlanStep, LocalizedText } from "./cut-plan-types";

/** Step keys that describe the reference line instead of a mark; they become the piece's reference text. */
const REFERENCE_KEYS: readonly string[] = ["cut.reference.fold", "cut.reference.grain", "cut.reference.top"];

/** The top-left corner and size of a piece's cut line. */
interface Box {
  /** Smallest x, mm. */
  readonly minX: number;
  /** Smallest y, mm. */
  readonly minY: number;
  /** Width, mm. */
  readonly widthMm: number;
  /** Height, mm. */
  readonly heightMm: number;
}

/**
 * The box around a cut line.
 *
 * @param cutPath - The cut line.
 * @returns Its box.
 */
function boxOf(cutPath: Piece["cutPath"]): Box {
  const points = samplePath(cutPath);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, widthMm: Math.max(...xs) - minX, heightMm: Math.max(...ys) - minY };
}

/**
 * Moves a point so the box starts at 0,0.
 *
 * @param box - The box.
 * @param p - A point in piece coordinates.
 * @returns The point in diagram coordinates.
 */
function shift(box: Box, p: Point): Point {
  return { x: p.x - box.minX, y: p.y - box.minY };
}

/**
 * Moves a segment into diagram coordinates.
 *
 * @param box - The box.
 * @param seg - A segment.
 * @returns The moved segment.
 */
function shiftSegment(box: Box, seg: Segment): Segment {
  if (seg.kind === "line") return { kind: "line", from: shift(box, seg.from), to: shift(box, seg.to) };
  return {
    kind: "cubic",
    from: shift(box, seg.from),
    c1: shift(box, seg.c1),
    c2: shift(box, seg.c2),
    to: shift(box, seg.to),
  };
}

/**
 * Joins the texts of the reference steps into one text per language.
 *
 * @param steps - The piece's steps.
 * @returns The reference text.
 */
function referenceText(steps: PieceCutSteps["steps"]): LocalizedText {
  const own = steps.filter((s) => REFERENCE_KEYS.includes(s.key));
  return {
    ar: own.map((s) => cutStepText(s, "ar")).join(" "),
    en: own.map((s) => cutStepText(s, "en")).join(" "),
  };
}

/**
 * The point a distance along a direction from a base point, in diagram coordinates.
 *
 * @param box - The cut line's box.
 * @param base - The start, piece coordinates.
 * @param dir - Unit direction.
 * @param mm - Distance, mm.
 * @returns The point.
 */
function alongLine(box: Box, base: Point, dir: Point, mm: number): Point {
  return shift(box, { x: base.x + dir.x * mm, y: base.y + dir.y * mm });
}

/**
 * The reference line and the top line, in diagram coordinates, as long as the piece.
 *
 * @param piece - The engine steps of the piece (for its frame).
 * @param box - The cut line's box.
 * @returns The drawn lines.
 */
function referenceLines(piece: PieceCutSteps, box: Box): CutPlanLine[] {
  const { origin, along, across, kind } = piece.frame;
  const length = Math.max(box.widthMm, box.heightMm);
  return [
    { id: "reference", kind, from: shift(box, origin), to: alongLine(box, origin, along, length) },
    { id: "top", kind: "top", from: shift(box, origin), to: alongLine(box, origin, across, length) },
  ];
}

/**
 * The marking steps of a piece as numbered rows (reference steps left out, numbers start at 1).
 *
 * @param piece - The engine steps of the piece.
 * @returns The rows.
 */
function planSteps(piece: PieceCutSteps): CutPlanStep[] {
  return piece.steps
    .filter((s) => !REFERENCE_KEYS.includes(s.key))
    .map((s, index) => ({
      id: `${piece.pieceId}#${s.n}`,
      no: index + 1,
      text: { ar: cutStepText(s, "ar"), en: cutStepText(s, "en") },
      pointIds: [...s.points],
    }));
}

/**
 * Maps the engine point to a plan point.
 *
 * @param box - The cut line's box.
 * @param point - The engine point.
 * @returns The plan point.
 */
function planPoint(box: Box, point: CutPoint): CutPiecePlan["points"][number] {
  return { id: point.label, label: point.label, at: shift(box, point.at) };
}

/**
 * Maps one piece.
 *
 * @param steps - The engine steps of the piece.
 * @param piece - The drafted piece (cut line and cut details).
 * @returns The page's plan of the piece.
 */
function planPiece(steps: PieceCutSteps, piece: Piece): CutPiecePlan {
  const box = boxOf(piece.cutPath);
  return {
    pieceId: steps.pieceId,
    name: { ar: steps.name.ar, en: steps.name.en },
    cutCount: piece.cut.quantity,
    onFold: piece.cut.onFold,
    reference: { text: referenceText(steps.steps), lines: referenceLines(steps, box) },
    points: steps.points.map((p) => planPoint(box, p)),
    steps: planSteps(steps),
    diagram: {
      widthMm: box.widthMm,
      heightMm: box.heightMm,
      outlineD: pathData(
        piece.cutPath.map((seg) => shiftSegment(box, seg)),
        true,
      ),
    },
  };
}

/**
 * Maps the engine's direct-cut steps to the page's plan.
 *
 * @param steps - The engine result.
 * @param pieces - The drafted pieces the steps came from (same order).
 * @returns The plan the checklist shows.
 */
export function toCutPlan(steps: CutSteps, pieces: readonly Piece[]): CutPlan {
  return {
    engineVersion: steps.engineVersion,
    curveStepMm: steps.curveStepMm,
    pieces: steps.pieces.map((s, index) => planPiece(s, pieces[index]!)),
  };
}
