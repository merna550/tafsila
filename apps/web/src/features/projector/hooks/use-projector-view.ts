"use client";
/** The state of the projector view: pan and mirror live in memory, line width and colour are kept per device (issue #286). */
import type { Point } from "@tafsila/schemas";
import { useCallback, useEffect, useState } from "react";
import { clampLineWidth, DEFAULT_VIEW, panBy, type ProjectorView } from "../model/projector-view";
import { readPrefs, writePrefs } from "../model/prefs-store";
import type { ProjectorColor } from "../projector.schema";

/** What {@link useProjectorView} returns. */
export interface ProjectorViewController {
  /** The current view. */
  readonly view: ProjectorView;
  /** Moves the pattern by screen mm. */
  readonly pan: (dxMm: number, dyMm: number) => void;
  /** Sets the pan in screen mm. */
  readonly setPan: (panMm: Point) => void;
  /** Flips the pattern. */
  readonly toggleMirror: () => void;
  /** Changes the line width by a step or to a value; clamped to 1..6. */
  readonly setLineWidth: (px: number) => void;
  /** Changes the line colour. */
  readonly setColor: (color: ProjectorColor) => void;
}

/**
 * Holds the view and saves the line settings after every change.
 *
 * @returns The view and its actions.
 */
export function useProjectorView(): ProjectorViewController {
  const [view, setView] = useState<ProjectorView>(DEFAULT_VIEW);

  useEffect(() => {
    const prefs = readPrefs();
    if (prefs) setView((v) => ({ ...v, lineWidthPx: prefs.lineWidthPx, color: prefs.color }));
  }, []);

  const pan = useCallback((dx: number, dy: number) => setView((v) => panBy(v, { x: dx, y: dy })), []);
  const setPan = useCallback((panMm: Point) => setView((v) => ({ ...v, panMm })), []);
  const toggleMirror = useCallback(() => setView((v) => ({ ...v, mirror: !v.mirror })), []);
  const setLineWidth = useCallback((px: number) => {
    setView((v) => {
      const lineWidthPx = clampLineWidth(px);
      writePrefs(lineWidthPx, v.color);
      return { ...v, lineWidthPx };
    });
  }, []);
  const setColor = useCallback((color: ProjectorColor) => {
    setView((v) => {
      writePrefs(v.lineWidthPx, color);
      return { ...v, color };
    });
  }, []);

  return { view, pan, setPan, toggleMirror, setLineWidth, setColor };
}
