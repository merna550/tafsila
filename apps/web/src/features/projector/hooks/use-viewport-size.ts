"use client";
/** The size of the canvas area in CSS px, kept up to date with a ResizeObserver (issue #286). */
import { useEffect, useState, type RefObject } from "react";
import type { Viewport } from "../model/projector-view";

/**
 * Measures an element and follows its size.
 *
 * @param ref - The element that fills the canvas area.
 * @returns The size, or zero before the first measure.
 */
export function useViewportSize(ref: RefObject<HTMLElement | null>): Viewport {
  const [size, setSize] = useState<Viewport>({ widthPx: 0, heightPx: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /** Copies the element's size. */
    const measure = (): void => {
      setSize({ widthPx: el.clientWidth, heightPx: el.clientHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
