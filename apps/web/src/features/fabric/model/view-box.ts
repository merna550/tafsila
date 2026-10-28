/** Zoom and pan of the marker diagram as pure view-box maths, in mm (FR-FAB-02, issue #318). */

/** The visible part of the diagram. */
export interface ViewBox {
  /** Left edge in mm. */
  readonly x: number;
  /** Top edge in mm. */
  readonly y: number;
  /** Visible width in mm. */
  readonly width: number;
  /** Visible height in mm. */
  readonly height: number;
}

/** Space kept around the strip in the first view, in mm. */
export const VIEW_PADDING_MM = 60;

/** Smallest and largest zoom, as a multiple of the first view. */
export const ZOOM_LIMITS = { min: 1, max: 8 } as const;

/** The factor one zoom button press applies. */
export const ZOOM_STEP = 1.5;

/**
 * The view that shows the whole strip.
 *
 * @param widthMm - Strip length.
 * @param heightMm - Usable width across the fabric.
 * @returns The view box with padding.
 */
export function fullViewBox(widthMm: number, heightMm: number): ViewBox {
  return {
    x: -VIEW_PADDING_MM,
    y: -VIEW_PADDING_MM,
    width: widthMm + VIEW_PADDING_MM * 2,
    height: heightMm + VIEW_PADDING_MM * 2,
  };
}

/**
 * Zooms around the centre of the current view, never beyond the limits.
 *
 * @param view - The current view.
 * @param full - The first view, which fixes the zoom scale.
 * @param factor - Above 1 zooms in, below 1 zooms out.
 * @returns The new view; equal to `full` when fully zoomed out.
 */
export function zoomView(view: ViewBox, full: ViewBox, factor: number): ViewBox {
  const zoom = Math.min(ZOOM_LIMITS.max, Math.max(ZOOM_LIMITS.min, (full.width / view.width) * factor));
  const width = full.width / zoom;
  const height = full.height / zoom;
  const centreX = view.x + view.width / 2;
  const centreY = view.y + view.height / 2;
  const x = Math.min(full.x + full.width - width, Math.max(full.x, centreX - width / 2));
  const y = Math.min(full.y + full.height - height, Math.max(full.y, centreY - height / 2));
  return { x, y, width, height };
}

/**
 * Writes a view as the SVG `viewBox` attribute.
 *
 * @param view - The view.
 * @returns `x y width height`, rounded to whole mm.
 */
export function viewBoxAttr(view: ViewBox): string {
  return [view.x, view.y, view.width, view.height].map((n) => Math.round(n)).join(" ");
}
