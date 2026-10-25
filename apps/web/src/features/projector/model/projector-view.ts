/** Pure maths of the projector view: millimetres to screen pixels with separate X and Y factors, pan, mirror and the verification square (issue #286). No React, no geometry of patterns. */
import type { Point } from "@tafsila/schemas";
import {
  LINE_WIDTH_MAX_PX,
  LINE_WIDTH_MIN_PX,
  type ProjectorCalibration,
  type ProjectorColor,
} from "../projector.schema";

/** What the user can change on the projector page. `panMm` is in screen millimetres (what you see). */
export interface ProjectorView {
  /** How far the pattern is moved on the screen, in mm. */
  readonly panMm: Point;
  /** True when the pattern is flipped horizontally. */
  readonly mirror: boolean;
  /** Line width in CSS px. */
  readonly lineWidthPx: number;
  /** Line colour. */
  readonly color: ProjectorColor;
}

/** The view before the user changes anything. */
export const DEFAULT_VIEW: ProjectorView = {
  panMm: { x: 0, y: 0 },
  mirror: false,
  lineWidthPx: 2,
  color: "white",
};

/** Size of the part of the screen the canvas fills, in CSS px. */
export interface Viewport {
  readonly widthPx: number;
  readonly heightPx: number;
}

/** Size of the pattern sheet, in mm. */
export interface SheetBox {
  readonly widthMm: number;
  readonly heightMm: number;
}

/** Fine arrow step, in mm. */
const STEP_FINE_MM = 1;
/** Arrow step with Shift, in mm. */
const STEP_MEDIUM_MM = 10;
/** Arrow step with Alt, in mm. */
const STEP_COARSE_MM = 50;
/** One arrow-key step in mm: fine, with Shift, with Alt. */
export type StepMm = typeof STEP_FINE_MM | typeof STEP_MEDIUM_MM | typeof STEP_COARSE_MM;
/** Decimals kept in SVG numbers: 4 gives a factor of 10000. */
const ROUND_FACTOR = 10_000;

/** Side of the verification square, in mm (FR-PROJ-03). */
export const VERIFICATION_SIDE_MM = 100;
/** Space between the verification square and the viewport edges, in px. */
const SQUARE_MARGIN_PX = 24;

/**
 * Rounds a number for an SVG attribute, so the string is stable and short.
 *
 * @param n - Any number.
 * @returns The number with at most 4 decimals.
 */
function num(n: number): number {
  return Math.round(n * ROUND_FACTOR) / ROUND_FACTOR;
}

/**
 * Converts millimetres to CSS px with the calibration factors of each axis.
 *
 * @param c - The calibration.
 * @param p - A point or size in mm.
 * @returns The same in px.
 */
export function mmToPx(c: ProjectorCalibration, p: Point): Point {
  return { x: p.x * c.pxPerMmX, y: p.y * c.pxPerMmY };
}

/**
 * Converts CSS px to millimetres with the calibration factors of each axis.
 *
 * @param c - The calibration.
 * @param p - A point or size in px.
 * @returns The same in mm.
 */
export function pxToMm(c: ProjectorCalibration, p: Point): Point {
  return { x: p.x / c.pxPerMmX, y: p.y / c.pxPerMmY };
}

/**
 * The SVG transform of the pattern group: centre the sheet on the screen, move by the pan, flip when mirrored, and scale mm to px.
 * Strokes use `non-scaling-stroke`, so unequal factors never change a line's weight.
 *
 * @param c - The calibration.
 * @param view - Pan and mirror.
 * @param viewport - The canvas size.
 * @param box - The sheet size.
 * @returns The `transform` attribute value.
 */
export function patternTransform(
  c: ProjectorCalibration,
  view: ProjectorView,
  viewport: Viewport,
  box: SheetBox,
): string {
  const pan = mmToPx(c, view.panMm);
  const parts = [`translate(${num(viewport.widthPx / 2 + pan.x)} ${num(viewport.heightPx / 2 + pan.y)})`];
  if (view.mirror) parts.push("scale(-1 1)");
  parts.push(`scale(${num(c.pxPerMmX)} ${num(c.pxPerMmY)})`);
  parts.push(`translate(${num(-box.widthMm / 2)} ${num(-box.heightMm / 2)})`);
  return parts.join(" ");
}

/** A rectangle in CSS px. */
export interface PxRect {
  readonly x: number;
  readonly y: number;
  readonly widthPx: number;
  readonly heightPx: number;
}

/**
 * The 10 x 10 cm verification square: fixed near the bottom start corner of the viewport, never panned or mirrored.
 *
 * @param c - The calibration.
 * @param viewport - The canvas size.
 * @returns The rectangle in px.
 */
export function verificationSquare(c: ProjectorCalibration, viewport: Viewport): PxRect {
  const size = mmToPx(c, { x: VERIFICATION_SIDE_MM, y: VERIFICATION_SIDE_MM });
  return {
    x: SQUARE_MARGIN_PX,
    y: viewport.heightPx - SQUARE_MARGIN_PX - size.y,
    widthPx: size.x,
    heightPx: size.y,
  };
}

/**
 * Moves the pattern on the screen.
 *
 * @param view - The view.
 * @param deltaMm - Move in screen mm (right and down are positive).
 * @returns The new view.
 */
export function panBy(view: ProjectorView, deltaMm: Point): ProjectorView {
  return { ...view, panMm: { x: view.panMm.x + deltaMm.x, y: view.panMm.y + deltaMm.y } };
}

/**
 * Turns a move seen on the screen into a move in sheet space: left stays left on screen, so it flips when mirrored.
 * The pan itself needs no conversion because it is applied outside the flip; piece moves of #287 do.
 *
 * @param delta - Move on the screen.
 * @param mirror - Whether the pattern is mirrored.
 * @returns The move in sheet space.
 */
export function screenDeltaToSceneMm(delta: Point, mirror: boolean): Point {
  return { x: mirror ? -delta.x : delta.x, y: delta.y };
}

/**
 * Keeps a line width inside the allowed range.
 *
 * @param n - Wanted width in px.
 * @returns The width, between 1 and 6.
 */
export function clampLineWidth(n: number): number {
  return Math.min(LINE_WIDTH_MAX_PX, Math.max(LINE_WIDTH_MIN_PX, n));
}

/**
 * Chooses the step of an arrow key: Alt 50 mm, Shift 10 mm, else 1 mm (Alt wins over Shift).
 *
 * @param event - The modifier keys.
 * @param event.shiftKey - Shift is down.
 * @param event.altKey - Alt is down.
 * @returns The step in mm.
 */
export function stepMm(event: { shiftKey: boolean; altKey: boolean }): StepMm {
  if (event.altKey) return STEP_COARSE_MM;
  return event.shiftKey ? STEP_MEDIUM_MM : STEP_FINE_MM;
}
