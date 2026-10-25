/** The element that receives the gestures and reports the viewport in data attributes for the browser tests (issue #243). */
import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import type { ViewportGestures } from "../hooks/use-viewport-gestures";

/** Digits of the zoom written in `data-zoom`. */
const ZOOM_DIGITS = 4;
/** Digits of the pan written in `data-tx` and `data-ty`. */
const PAN_DIGITS = 1;

/** Props of {@link ViewerSurface}. */
interface ViewerSurfaceProps {
  /** The gesture state and handlers. */
  readonly gestures: ViewportGestures;
  /** Key handler; the viewer adds Escape to the gesture keys. */
  readonly onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  /** The drawing and overlays. */
  readonly children: ReactNode;
}

/**
 * A focusable box that clips the drawing and turns pointer, wheel and key input into zoom and pan.
 * `touch-action: none` keeps the browser from scrolling or zooming the page during a gesture.
 *
 * @param props - Component props.
 * @returns The surface.
 */
export function ViewerSurface({
  gestures: g,
  onKeyDown,
  children,
}: Readonly<ViewerSurfaceProps>): ReactElement {
  return (
    <div
      ref={g.containerRef}
      tabIndex={0}
      data-testid="viewer-canvas"
      data-zoom={g.viewport.zoom.toFixed(ZOOM_DIGITS)}
      data-tx={g.viewport.tx.toFixed(PAN_DIGITS)}
      data-ty={g.viewport.ty.toFixed(PAN_DIGITS)}
      aria-describedby="viewer-hint"
      className="relative w-full touch-none overflow-hidden rounded-lg border border-line bg-surface focus-visible:outline-2 focus-visible:outline-focus"
      style={{ height: "60vh", minHeight: "18rem", overscrollBehavior: "contain" }}
      onPointerDown={g.handlers.onPointerDown}
      onPointerMove={g.handlers.onPointerMove}
      onPointerUp={g.handlers.onPointerUp}
      onPointerCancel={g.handlers.onPointerCancel}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}
