/** Placeholder line drawing for the guide: one shared body outline with the dashed line of one measurement. */
import type { ReactElement } from "react";
import type { MeasurementField } from "../model/field-groups";
import { GUIDE_VIEW_HEIGHT, markOf, GUIDE_VIEW_WIDTH } from "../guide/guide-marks";

/** Props for {@link GuideIllustration}. */
interface GuideIllustrationProps {
  /** The measurement to draw. */
  readonly field: MeasurementField;
  /** Accessible description (already translated). */
  readonly label: string;
}

/** Body outline: head, torso, arms and legs as plain strokes. */
const OUTLINE = [
  "M42 40 L78 40 L84 60 L82 110 L88 140 L32 140 L38 110 L36 60 Z",
  "M38 42 L24 100",
  "M82 42 L96 100",
  "M44 140 L42 196",
  "M76 140 L78 196",
].join(" ");

/**
 * Draws the placeholder illustration of a measurement.
 *
 * @param props - The measurement and its description.
 * @returns An SVG image.
 */
export function GuideIllustration({ field, label }: Readonly<GuideIllustrationProps>): ReactElement {
  const mark = markOf(field);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${GUIDE_VIEW_WIDTH} ${GUIDE_VIEW_HEIGHT}`}
      className="h-full max-h-72 w-full"
    >
      <circle cx="60" cy="22" r="12" className="fill-background stroke-border" strokeWidth="1.5" />
      <path d={OUTLINE} className="fill-background stroke-border" strokeWidth="1.5" strokeLinejoin="round" />
      {mark ? (
        <>
          <path d={mark.path} className="fill-none stroke-primary" strokeWidth="2" strokeDasharray="4 3" />
          <circle cx={mark.dot[0]} cy={mark.dot[1]} r="3" className="fill-saffron" />
        </>
      ) : null}
    </svg>
  );
}
