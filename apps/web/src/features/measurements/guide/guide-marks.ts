/** Placeholder guide art: where each measurement is drawn on the shared body outline (final illustrations come before the beta). */
import marksData from "./guide-marks.json";
import type { MeasurementField } from "../model/field-groups";

/** Width of the drawing's coordinate box. */
export const GUIDE_VIEW_WIDTH = 120;

/** Height of the drawing's coordinate box. */
export const GUIDE_VIEW_HEIGHT = 200;

/** Centre line of the body outline. */
const CENTRE = 60;

/** Flatness of a ring seen from slightly above. */
const RING_RY = 5;

/** A ring around the body at height `y`. */
interface RingData {
  readonly kind: "ring";
  readonly y: number;
  readonly rx: number;
  readonly dot: readonly number[];
}

/** A straight line between two points. */
interface LineData {
  readonly kind: "line";
  readonly from: readonly number[];
  readonly to: readonly number[];
  readonly dot: readonly number[];
}

/** One entry of `guide-marks.json`. */
type MarkData = RingData | LineData;

/** The dashed line that shows one measurement and the dot where it starts. */
export interface GuideMark {
  /** Path data of the dashed line. */
  readonly path: string;
  /** Start of the measurement (the saffron dot). */
  readonly dot: readonly [number, number];
}

/**
 * Turns one JSON entry into SVG path data.
 *
 * @param data - A ring or a line.
 * @returns The mark to draw.
 */
function toMark(data: MarkData): GuideMark {
  const dot: readonly [number, number] = [data.dot[0] ?? 0, data.dot[1] ?? 0];
  if (data.kind === "line") {
    return { path: `M${data.from.join(" ")} L${data.to.join(" ")}`, dot };
  }
  const left = CENTRE - data.rx;
  const right = CENTRE + data.rx;
  const arc = `A${data.rx} ${RING_RY} 0 0 0`;
  return { path: `M${left} ${data.y} ${arc} ${right} ${data.y} ${arc} ${left} ${data.y}`, dot };
}

/** One mark per measurement field: a test fails when a field is missing. */
export const GUIDE_MARKS: Readonly<Record<string, GuideMark>> = Object.fromEntries(
  Object.entries(marksData as Record<string, MarkData>).map(([field, data]) => [field, toMark(data)]),
);

/**
 * Finds the mark of a field.
 *
 * @param field - A measurement field.
 * @returns Its mark, or undefined when the drawing is missing.
 */
export function markOf(field: MeasurementField): GuideMark | undefined {
  return Object.hasOwn(GUIDE_MARKS, field) ? GUIDE_MARKS[field] : undefined;
}
