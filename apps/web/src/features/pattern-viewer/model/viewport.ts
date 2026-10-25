/** Pure zoom and pan maths for the viewer; no DOM, so Vitest covers it (issue #243). */
import type { MmBox, PxPoint, PxSize, Viewport } from "./types";

/** Smallest zoom, in pixels per mm: a 1.2 m sheet still shows whole on a 360 px phone (about 0.3 px/mm). */
export const ZOOM_MIN = 0.1;
/** Largest zoom, in pixels per mm: 12 px/mm shows a 1 mm gap as a clear 12 px, enough to place a notch. */
export const ZOOM_MAX = 12;
/** Empty border kept around the content when fitting, in pixels. */
export const FIT_MARGIN_PX = 16;
/** Zoom step of the buttons and the plus and minus keys. */
export const ZOOM_STEP = 1.25;
/** Closest zoom when framing targets: a quarter of the maximum, so a short edge keeps its context. */
const FOCUS_ZOOM_DIVISOR = 4;
/** Pan step of the arrow keys, in pixels. */
export const PAN_STEP_PX = 48;

/**
 * Keeps a zoom inside the allowed range.
 *
 * @param zoom - Wanted zoom in px per mm.
 * @returns The zoom within `ZOOM_MIN` and `ZOOM_MAX`.
 */
export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/**
 * The view that shows a box whole, centred, with a margin.
 *
 * @param box - What to show, in mm.
 * @param size - The container size in pixels.
 * @param maxZoom - Highest zoom allowed (so a tiny box is not blown up).
 * @returns The viewport; not clamped from below, so any sheet fits.
 */
export function fitBox(box: MmBox, size: PxSize, maxZoom: number = ZOOM_MAX): Viewport {
  const w = Math.max(size.width - 2 * FIT_MARGIN_PX, 1);
  const h = Math.max(size.height - 2 * FIT_MARGIN_PX, 1);
  const zoom = Math.min(w / Math.max(box.widthMm, 1), h / Math.max(box.heightMm, 1), maxZoom);
  return {
    zoom,
    tx: (size.width - box.widthMm * zoom) / 2 - box.x * zoom,
    ty: (size.height - box.heightMm * zoom) / 2 - box.y * zoom,
  };
}

/**
 * The view that shows the whole sheet.
 *
 * @param sheet - Sheet size in mm.
 * @param size - The container size in pixels.
 * @returns The viewport.
 */
export function fitViewport(sheet: { widthMm: number; heightMm: number }, size: PxSize): Viewport {
  return fitBox({ x: 0, y: 0, ...sheet }, size);
}

/**
 * The view that frames some targets.
 *
 * @param target - Box around the targets, in mm.
 * @param size - The container size in pixels.
 * @returns The viewport, never closer than a quarter of the maximum zoom so a short edge keeps its context.
 */
export function focusViewport(target: MmBox, size: PxSize): Viewport {
  return fitBox(target, size, ZOOM_MAX / FOCUS_ZOOM_DIVISOR);
}

/**
 * Zooms by a factor while the point under `anchor` stays where it is.
 *
 * @param vp - Current view.
 * @param factor - Multiplier for the zoom.
 * @param anchor - Container pixel to keep still (cursor, finger midpoint or the centre).
 * @returns The new view, with the zoom clamped.
 */
export function zoomAt(vp: Viewport, factor: number, anchor: PxPoint): Viewport {
  const zoom = clampZoom(vp.zoom * factor);
  const k = zoom / vp.zoom;
  return { zoom, tx: anchor.x - (anchor.x - vp.tx) * k, ty: anchor.y - (anchor.y - vp.ty) * k };
}

/**
 * Moves the content.
 *
 * @param vp - Current view.
 * @param dx - Pixels to the right.
 * @param dy - Pixels down.
 * @returns The new view.
 */
export function panBy(vp: Viewport, dx: number, dy: number): Viewport {
  return { ...vp, tx: vp.tx + dx, ty: vp.ty + dy };
}

/** Two finger positions in container pixels. */
export type TouchPair = readonly [PxPoint, PxPoint];

/**
 * Middle and spread of two fingers.
 *
 * @param pair - The fingers.
 * @returns Their midpoint and distance.
 */
function pairInfo(pair: TouchPair): { mid: PxPoint; dist: number } {
  const [a, b] = pair;
  return { mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dist: Math.hypot(b.x - a.x, b.y - a.y) };
}

/**
 * Applies one pinch step: zoom by the change in finger spread around the old midpoint, then follow the midpoint.
 *
 * @param vp - Current view.
 * @param prev - Finger positions before the move.
 * @param next - Finger positions after the move.
 * @returns The new view; unchanged when the fingers started on the same point.
 */
export function pinch(vp: Viewport, prev: TouchPair, next: TouchPair): Viewport {
  const before = pairInfo(prev);
  const after = pairInfo(next);
  if (before.dist < 1) return vp;
  const zoomed = zoomAt(vp, after.dist / before.dist, before.mid);
  return panBy(zoomed, after.mid.x - before.mid.x, after.mid.y - before.mid.y);
}

/**
 * Millimetres under one pixel.
 *
 * @param vp - Current view.
 * @returns mm per pixel.
 */
export function mmPerPx(vp: Viewport): number {
  return 1 / vp.zoom;
}
