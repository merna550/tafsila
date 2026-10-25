"use client";
/** The measured distance in cm, announced politely to screen readers (issue #253, FR-VIEW-03). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { mmToCmText } from "@/shared/format";
import { measuredMm } from "../model/measure";
import type { ViewerMeasure } from "../model/types";

/** Props of {@link MeasureReadout}. */
interface MeasureReadoutProps {
  /** The tool state. */
  readonly measure: ViewerMeasure;
}

/**
 * Says what to do next, or the distance once two points are picked. Renders nothing while the tool is off.
 *
 * @param props - Component props.
 * @returns The readout, or nothing.
 */
export function MeasureReadout({ measure }: Readonly<MeasureReadoutProps>): ReactElement | null {
  const t = useTranslations("patternViewer.measure");
  if (!measure.active) return null;
  const mm = measuredMm(measure);
  const prompt = measure.points.length === 0 ? "pickFirst" : "pickSecond";
  const text = mm === null ? t(prompt) : t("result", { value: mmToCmText(mm) });
  return (
    <p
      aria-live="polite"
      dir="auto"
      className="text-sm font-semibold text-text"
      data-testid="measure-readout"
    >
      {text}
    </p>
  );
}
