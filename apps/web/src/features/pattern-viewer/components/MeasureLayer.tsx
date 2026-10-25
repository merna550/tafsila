/** The measure tool's marks on the sheet: snap points while active, the picked points and the line between them (issue #253). */
import type { ReactElement } from "react";
import type { SnapPoint, ViewerMeasure } from "../model/types";

/** Radius of a snap-point dot, in screen pixels. */
const DOT_PX = 3;
/** Radius of a picked point, in screen pixels. */
const PICKED_PX = 6;

/** Props of {@link MeasureLayer}. */
interface MeasureLayerProps {
  /** The tool state. */
  readonly measure: ViewerMeasure;
  /** Every snap point of the scene. */
  readonly snapPoints: readonly SnapPoint[];
  /** Pixels per mm, to keep dots the same size on screen at any zoom. */
  readonly zoom: number;
}

/**
 * Draws inside the viewport group (sheet mm). Nothing is drawn while the tool is off.
 *
 * @param props - Component props.
 * @returns The group, or nothing.
 */
export function MeasureLayer({
  measure,
  snapPoints,
  zoom,
}: Readonly<MeasureLayerProps>): ReactElement | null {
  if (!measure.active) return null;
  const [a, b] = measure.points;
  return (
    <g data-layer="measure" pointerEvents="none">
      {snapPoints.map((p) => (
        <circle
          key={p.id}
          data-snap-id={p.id}
          cx={p.at.x}
          cy={p.at.y}
          r={DOT_PX / zoom}
          className="fill-muted"
          opacity={0.6}
        />
      ))}
      {a && b ? (
        <line
          x1={a.at.x}
          y1={a.at.y}
          x2={b.at.x}
          y2={b.at.y}
          strokeWidth={2}
          className="stroke-primary"
          style={{ vectorEffect: "non-scaling-stroke" }}
          data-testid="measure-line"
        />
      ) : null}
      {measure.points.map((p) => (
        <circle key={p.id} cx={p.at.x} cy={p.at.y} r={PICKED_PX / zoom} className="fill-primary" />
      ))}
    </g>
  );
}
