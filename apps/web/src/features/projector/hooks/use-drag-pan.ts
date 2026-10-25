"use client";
/** Pointer handlers that pan the pattern while the pointer is dragged on the canvas (issue #286). */
import { useRef, type PointerEvent } from "react";

/** Handlers to spread on the element that catches the drag. */
export interface DragHandlers {
  readonly onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: () => void;
}

/**
 * Turns a drag into pan calls.
 *
 * @param pan - Moves the pattern by screen mm.
 * @param toMm - Converts a move in px to mm, or null while there is no calibration.
 * @returns The pointer handlers.
 */
export function useDragPan(
  pan: (dxMm: number, dyMm: number) => void,
  toMm: (dxPx: number, dyPx: number) => { x: number; y: number } | null,
): DragHandlers {
  const last = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e) => {
      last.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e) => {
      if (last.current === null) return;
      const mm = toMm(e.clientX - last.current.x, e.clientY - last.current.y);
      last.current = { x: e.clientX, y: e.clientY };
      if (mm) pan(mm.x, mm.y);
    },
    onPointerUp: () => {
      last.current = null;
    },
  };
}
