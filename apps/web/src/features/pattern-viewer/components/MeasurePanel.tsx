"use client";
/** Everything the measure tool shows under the drawing: the readout and the point pickers (issue #253). */
import type { ReactElement } from "react";
import type { PatternScene, ViewerMeasure } from "../model/types";
import { MeasurePointList } from "./MeasurePointList";
import { MeasureReadout } from "./MeasureReadout";

/** Props of {@link MeasurePanel}. */
interface MeasurePanelProps {
  /** The pattern. */
  readonly scene: PatternScene;
  /** The tool state. */
  readonly measure: ViewerMeasure;
  /** Replaces the tool state. */
  readonly onChange: (measure: ViewerMeasure) => void;
}

/**
 * The readout and the pickers, or nothing while the tool is off.
 *
 * @param props - Component props.
 * @returns The panel, or nothing.
 */
export function MeasurePanel({ scene, measure, onChange }: Readonly<MeasurePanelProps>): ReactElement | null {
  if (!measure.active) return null;
  return (
    <div dir="auto" className="mt-2 flex flex-col gap-2">
      <MeasureReadout measure={measure} />
      <MeasurePointList scene={scene} measure={measure} onChange={onChange} />
    </div>
  );
}
