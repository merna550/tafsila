/** Pure logic of the measure tool: which snap point a tap picks, and how the two picked points advance (issue #253, FR-VIEW-03). */
import { measureBetween } from "@tafsila/engine/viewer";
import type { PatternScene, SnapPoint, ViewerMeasure } from "./types";

/** How close a tap must be to a snap point to pick it, in screen pixels (a comfortable finger target). */
export const SNAP_RADIUS_PX = 16;

/** The tool switched off and empty. */
export const MEASURE_OFF: ViewerMeasure = { active: false, points: [] };
/** The tool switched on, nothing picked yet. */
export const MEASURE_ON: ViewerMeasure = { active: true, points: [] };

/**
 * The snap point nearest to a position, if any lies within the radius.
 *
 * @param points - Candidates.
 * @param at - The position on the sheet, in mm.
 * @param radiusMm - Largest accepted distance, in mm.
 * @returns The nearest point, or null when none is close enough.
 */
export function nearestSnap(
  points: readonly SnapPoint[],
  at: { readonly x: number; readonly y: number },
  radiusMm: number,
): SnapPoint | null {
  let best: SnapPoint | null = null;
  let bestMm = radiusMm;
  for (const p of points) {
    const d = measureBetween(p.at, at);
    if (d <= bestMm) {
      best = p;
      bestMm = d;
    }
  }
  return best;
}

/**
 * The state after picking a point: first and second fill up, a third starts over with that point.
 *
 * @param state - The current state.
 * @param snap - The picked point.
 * @returns The next state.
 */
export function nextMeasure(state: ViewerMeasure, snap: SnapPoint): ViewerMeasure {
  const points = state.points.length >= 2 ? [snap] : [...state.points, snap];
  return { active: true, points };
}

/**
 * Every snap point of the scene.
 *
 * @param scene - The pattern.
 * @returns The points of all pieces.
 */
export function allSnapPoints(scene: PatternScene): SnapPoint[] {
  return scene.pieces.flatMap((p) => p.snapPoints);
}

/**
 * The straight distance between the two picked points.
 *
 * @param measure - The tool state.
 * @returns Millimetres, or null until two points are picked.
 */
export function measuredMm(measure: ViewerMeasure): number | null {
  const [a, b] = measure.points;
  return a && b ? measureBetween(a.at, b.at) : null;
}
