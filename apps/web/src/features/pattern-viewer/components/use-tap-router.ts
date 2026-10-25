"use client";
/** Decides what a tap on the canvas does: select a piece, or pick a snap point while the measure tool is on (issue #253). */
import { useCallback, useRef, type RefObject } from "react";
import { SNAP_RADIUS_PX, nearestSnap, nextMeasure } from "../model/measure";
import type { PxPoint, SnapPoint, Viewport, ViewerMeasure } from "../model/types";

/** What {@link useTapRouter} needs from the viewer. */
interface TapRouterInput {
  /** The measure tool state. */
  readonly measure: ViewerMeasure;
  /** Replaces the measure tool state. */
  readonly onMeasureChange: (measure: ViewerMeasure) => void;
  /** Selects a piece, or clears the selection with null. */
  readonly onSelectPiece: (id: string | null) => void;
  /** Every snap point of the scene. */
  readonly snapPoints: readonly SnapPoint[];
}

/**
 * The piece a tap landed on.
 *
 * @param target - The element the press started on.
 * @returns The piece id, or null on empty canvas.
 */
function pieceIdAt(target: EventTarget | null): string | null {
  return target instanceof Element
    ? (target.closest("[data-piece-id]")?.getAttribute("data-piece-id") ?? null)
    : null;
}

/**
 * Builds the tap handler. With the measure tool on, a tap within the snap radius picks the nearest point and a tap
 * elsewhere is ignored; otherwise it selects the piece under it.
 *
 * @param input - Tool state, callbacks and snap points.
 * @returns The tap handler, and a ref the viewer keeps current with the viewport (the tap is in container pixels).
 */
export function useTapRouter(input: TapRouterInput): {
  readonly onTap: (target: EventTarget | null, at: PxPoint) => void;
  readonly viewportRef: RefObject<Viewport>;
} {
  const { measure, onMeasureChange, onSelectPiece, snapPoints } = input;
  const viewportRef = useRef<Viewport>({ zoom: 1, tx: 0, ty: 0 });
  const onTap = useCallback(
    (target: EventTarget | null, at: PxPoint) => {
      if (!measure.active) return onSelectPiece(pieceIdAt(target));
      const { zoom, tx, ty } = viewportRef.current;
      const mm = { x: (at.x - tx) / zoom, y: (at.y - ty) / zoom };
      const snap = nearestSnap(snapPoints, mm, SNAP_RADIUS_PX / zoom);
      if (snap) onMeasureChange(nextMeasure(measure, snap));
    },
    [measure, onMeasureChange, onSelectPiece, snapPoints],
  );
  return { onTap, viewportRef };
}
