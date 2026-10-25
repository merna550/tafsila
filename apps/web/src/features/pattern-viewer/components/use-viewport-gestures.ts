"use client";
/** Zoom and pan of the viewer from Pointer Events (mouse, touch and pen), the wheel and the keyboard (issue #243). */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import {
  PAN_STEP_PX,
  ZOOM_STEP,
  fitViewport,
  focusViewport,
  panBy,
  pinch,
  zoomAt,
  type TouchPair,
} from "../model/viewport";
import type { MmBox, PxPoint, PxSize, Viewport } from "../model/types";

/** Movement in pixels below which a press and release still counts as a tap. */
const TAP_SLOP_PX = 6;
/** Wheel zoom speed: zoom grows by `exp(-deltaY * this)` per event, in pixel mode. */
const WHEEL_ZOOM_PER_PX = 0.002;
/** Wheel `deltaMode` for lines, which a mouse sends instead of pixels: one line is about 20 px. */
const WHEEL_LINE_PX = 20;

/** The handlers to spread on the canvas container. */
export interface GestureHandlers {
  /** Starts a drag or a pinch. */
  readonly onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  /** Pans or pinches. */
  readonly onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  /** Ends a gesture; a tap reports its target. */
  readonly onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  /** Ends a gesture without a tap. */
  readonly onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
  /** Arrow keys pan, plus and minus zoom, zero fits. */
  readonly onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
}

/** What the hook gives the viewer. */
export interface ViewportGestures {
  /** Attach to the element that receives the gestures. */
  readonly containerRef: RefObject<HTMLDivElement | null>;
  /** Container size in pixels (0 before the first layout). */
  readonly size: PxSize;
  /** Current zoom and pan. */
  readonly viewport: Viewport;
  /** Spread on the container. */
  readonly handlers: GestureHandlers;
  /** Fits the whole sheet and resumes auto-fit on resize. */
  readonly fit: () => void;
  /** Zooms in one step around the centre. */
  readonly zoomIn: () => void;
  /** Zooms out one step around the centre. */
  readonly zoomOut: () => void;
  /** Frames a box. */
  readonly zoomToBox: (box: MmBox) => void;
}

/** Called when a press ends without moving: the element it started on and where, in container pixels. */
export type TapHandler = (target: EventTarget | null, at: PxPoint) => void;

/** A press in progress with one finger or the mouse. */
interface Press {
  readonly start: PxPoint;
  readonly target: EventTarget | null;
  moved: boolean;
}

/**
 * Container-relative position of a pointer or mouse event.
 *
 * @param el - The container.
 * @param e - Anything with client coordinates.
 * @returns The position in container pixels.
 */
function local(el: HTMLElement, e: { clientX: number; clientY: number }): PxPoint {
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/**
 * Keyboard action for a key: physical arrow directions (the canvas never mirrors), plus, minus and zero.
 *
 * @param key - `KeyboardEvent.key`.
 * @returns The change to apply, or null for any other key.
 */
function keyAction(key: string): ((vp: Viewport, centre: PxPoint, fit: Viewport) => Viewport) | null {
  switch (key) {
    case "ArrowLeft":
      return (vp) => panBy(vp, -PAN_STEP_PX, 0);
    case "ArrowRight":
      return (vp) => panBy(vp, PAN_STEP_PX, 0);
    case "ArrowUp":
      return (vp) => panBy(vp, 0, -PAN_STEP_PX);
    case "ArrowDown":
      return (vp) => panBy(vp, 0, PAN_STEP_PX);
    case "+":
    case "=":
      return (vp, c) => zoomAt(vp, ZOOM_STEP, c);
    case "-":
    case "_":
      return (vp, c) => zoomAt(vp, 1 / ZOOM_STEP, c);
    case "0":
      return (_vp, _c, fit) => fit;
    default:
      return null;
  }
}

/**
 * Tracks the container's size.
 *
 * @param ref - The container.
 * @returns Its size in pixels (0 before the first layout).
 */
function useContainerSize(ref: RefObject<HTMLDivElement | null>): PxSize {
  const [size, setSize] = useState<PxSize>({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /**
     * Stores the current size.
     *
     * @returns Nothing.
     */
    const read = (): void => setSize({ width: el.clientWidth, height: el.clientHeight });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * Zooms at the cursor on the wheel (a trackpad pinch arrives as a wheel too). The listener is not passive so the page
 * does not scroll or zoom meanwhile.
 *
 * @param ref - The container.
 * @param apply - Applies a change to the viewport.
 */
function useWheelZoom(
  ref: RefObject<HTMLDivElement | null>,
  apply: (change: (vp: Viewport) => Viewport) => void,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /**
     * Zooms at the cursor.
     *
     * @param e - The wheel event.
     */
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * WHEEL_LINE_PX : e.deltaY;
      const anchor = local(el, e);
      apply((vp) => zoomAt(vp, Math.exp(-px * WHEEL_ZOOM_PER_PX), anchor));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref, apply]);
}

/**
 * Pointer handlers: one pointer drags, two pinch, a press that never moved is a tap.
 *
 * @param apply - Applies a change to the viewport.
 * @param onTap - Called with the element a tap started on.
 * @returns The pointer handlers.
 */
function usePointerHandlers(
  apply: (change: (vp: Viewport) => Viewport) => void,
  onTap: TapHandler,
): Pick<GestureHandlers, "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel"> {
  const pointers = useRef(new Map<number, PxPoint>());
  const press = useRef<Press | null>(null);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const at = local(e.currentTarget, e);
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, at);
    if (pointers.current.size === 1) press.current = { start: at, target: e.target, moved: false };
    else if (press.current) press.current.moved = true;
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const before = pointers.current.get(e.pointerId);
      if (!before) return;
      const at = local(e.currentTarget, e);
      const ids = [...pointers.current.keys()].slice(0, 2);
      if (ids.length === 2 && ids.includes(e.pointerId)) {
        const prev = ids.map((id) => pointers.current.get(id)!) as unknown as TouchPair;
        const next = ids.map((id) =>
          id === e.pointerId ? at : pointers.current.get(id)!,
        ) as unknown as TouchPair;
        pointers.current.set(e.pointerId, at);
        apply((vp) => pinch(vp, prev, next));
        return;
      }
      pointers.current.set(e.pointerId, at);
      const current = press.current;
      if (current && Math.hypot(at.x - current.start.x, at.y - current.start.y) > TAP_SLOP_PX)
        current.moved = true;
      if (pointers.current.size === 1) apply((vp) => panBy(vp, at.x - before.x, at.y - before.y));
    },
    [apply],
  );

  const end = useCallback(
    (e: PointerEvent<HTMLElement>, allowTap: boolean) => {
      if (!pointers.current.delete(e.pointerId)) return;
      const current = press.current;
      if (pointers.current.size === 0) {
        press.current = null;
        if (allowTap && current && !current.moved) onTap(current.target, current.start);
      } else if (current) current.moved = true;
    },
    [onTap],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: useCallback((e) => end(e, true), [end]),
    onPointerCancel: useCallback((e) => end(e, false), [end]),
  };
}

/**
 * Owns the viewport. It fits the sheet on the first layout and on every resize until the user moves it.
 *
 * @param sheet - Sheet size in mm, to fit.
 * @param onTap - Called with the element a press started on when it ends without moving.
 * @returns The viewport, the handlers to spread on the container and the actions.
 */
export function useViewportGestures(
  sheet: { readonly widthMm: number; readonly heightMm: number },
  onTap: TapHandler,
): ViewportGestures {
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useContainerSize(containerRef);
  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, tx: 0, ty: 0 });
  const touched = useRef(false);
  const fitted = useMemo(() => fitViewport(sheet, size), [sheet, size]);
  const centre = useMemo(() => ({ x: size.width / 2, y: size.height / 2 }), [size]);

  useEffect(() => {
    if (!touched.current && size.width > 0) setViewport(fitted);
  }, [fitted, size.width]);

  const apply = useCallback((change: (vp: Viewport) => Viewport) => {
    touched.current = true;
    setViewport(change);
  }, []);
  useWheelZoom(containerRef, apply);
  const pointerHandlers = usePointerHandlers(apply, onTap);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const action = keyAction(e.key);
      if (!action || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      apply((vp) => action(vp, centre, fitted));
      if (e.key === "0") touched.current = false;
    },
    [apply, centre, fitted],
  );

  const fit = useCallback(() => {
    touched.current = false;
    setViewport(fitted);
  }, [fitted]);

  return {
    containerRef,
    size,
    viewport,
    handlers: useMemo(() => ({ ...pointerHandlers, onKeyDown }), [pointerHandlers, onKeyDown]),
    fit,
    zoomIn: useCallback(() => apply((vp) => zoomAt(vp, ZOOM_STEP, centre)), [apply, centre]),
    zoomOut: useCallback(() => apply((vp) => zoomAt(vp, 1 / ZOOM_STEP, centre)), [apply, centre]),
    zoomToBox: useCallback((box: MmBox) => apply(() => focusViewport(box, size)), [apply, size]),
  };
}
