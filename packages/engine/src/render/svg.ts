/** Deterministic SVG renderer: a `PatternResult` becomes one text, byte for byte the same every time (NFR-08). */
import type { PatternResult } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";
import { escapeXml, fmt } from "./format";
import {
  cutLayer,
  dartsLayer,
  gridLayer,
  grainLayer,
  labelsLayer,
  notchesLayer,
  scaleLayer,
  stitchLayer,
} from "./layers";
import { layoutSheet, type SheetLayout } from "./sheet-layout";

/** Names of the layers a render can include. */
export const SVG_LAYERS = ["grid", "cut", "stitch", "notches", "grain", "darts", "labels", "scale"] as const;

/** One layer name. */
export type SvgLayer = (typeof SVG_LAYERS)[number];

/** Render options. */
export interface SvgOptions {
  /** Layers to draw; default all. The order given does not matter, the output order is fixed. */
  readonly layers?: readonly SvgLayer[];
  /** Multiplies the physical `width`/`height` only, never the `viewBox`; default 1 (a 1:1 print). */
  readonly scale?: number;
}

/** Draws each layer from the sheet layout. */
const LAYER_RENDERERS: Readonly<Record<SvgLayer, (layout: SheetLayout) => string>> = {
  grid: gridLayer,
  cut: cutLayer,
  stitch: stitchLayer,
  notches: notchesLayer,
  grain: grainLayer,
  darts: dartsLayer,
  labels: labelsLayer,
  scale: scaleLayer,
};

/**
 * Renders a pattern to SVG text. Pure: same result and options give the same text.
 * Units are mm: `viewBox` and `width`/`height` use the same numbers, so printing at 100% is 1:1.
 *
 * @param result - The pattern.
 * @param options - Layers and physical scale.
 * @returns The SVG document as text.
 * @throws {DraftingError} RENDER_BAD_SCALE when the scale is not a positive number.
 */
export function renderSvg(result: PatternResult, options: SvgOptions = {}): string {
  const scale = options.scale ?? 1;
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new DraftingError("RENDER_BAD_SCALE", `Scale must be a positive number, got ${scale}`);
  }
  const wanted = new Set<SvgLayer>(options.layers ?? SVG_LAYERS);
  const layout = layoutSheet(result.pieces);
  const groups = SVG_LAYERS.filter((name) => wanted.has(name)).map(
    (name) => `<g id="layer-${name}">\n${LAYER_RENDERERS[name](layout)}\n</g>`,
  );
  const w = fmt(layout.widthMm);
  const h = fmt(layout.heightMm);
  const title = escapeXml(`Tafsila pattern - ${result.meta.category} - ${result.meta.sizeLabel}`);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(layout.widthMm * scale)}mm" height="${fmt(layout.heightMm * scale)}mm" viewBox="0 0 ${w} ${h}">`,
    `<title>${title}</title>`,
    ...groups,
    "</svg>",
    "",
  ].join("\n");
}
