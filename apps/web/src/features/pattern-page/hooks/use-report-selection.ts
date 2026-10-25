"use client";
/** Hook that ties a chosen report row to the viewer: the row highlights its targets and frames them. */
import { useState } from "react";
import type { ViewerController, ViewerTarget } from "@/features/pattern-viewer";
import type { ReportSelection } from "../model/report-selection";

/**
 * The page owns the effects (decision 249): a chosen row highlights and frames its targets.
 *
 * @param viewer - The viewer state.
 * @returns The chosen row and the handler.
 */
export function useReportSelection(viewer: ViewerController): ReportSelection {
  const [key, setKey] = useState<string | null>(null);
  /**
   * Applies a choice to the row key and the viewer.
   *
   * @param next - The chosen row, or null.
   * @param targets - What it points at.
   */
  const select = (next: string | null, targets: readonly ViewerTarget[]): void => {
    setKey(next);
    viewer.setHighlight(targets);
    if (next !== null) viewer.ref.current?.zoomTo(targets);
  };
  return { key, select };
}
