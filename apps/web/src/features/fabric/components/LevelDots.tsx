/** A five-step meter that shows a fabric property level from 0 to 4 as filled dots (decorative; the level is spoken elsewhere). */
import type { ReactElement } from "react";
import { METER_STEPS } from "../model/property-labels";

/** Props of {@link LevelDots}. */
export interface LevelDotsProps {
  /** Filled steps, 1 to 5 (level 0 to 4 plus one). */
  readonly filled: number;
}

/**
 * Renders the dots.
 *
 * @param props - The filled step count.
 * @returns The meter, hidden from screen readers.
 */
export function LevelDots({ filled }: Readonly<LevelDotsProps>): ReactElement {
  return (
    <span aria-hidden="true" className="inline-flex gap-1">
      {Array.from({ length: METER_STEPS }, (_, step) => (
        <span key={step} className={`size-2.5 rounded-full ${step < filled ? "bg-primary" : "bg-line"}`} />
      ))}
    </span>
  );
}
