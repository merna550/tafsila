/** Skirt length from the spec and the body (issue #126). */
import type { DesignSpec, Measurements } from "@tafsila/schemas";
import {
  MIN_KNEE_TO_FLOOR_GAP_MM,
  MIN_SKIRT_LENGTH_MM,
  SKIRT_ANKLE_KNEE_TO_FLOOR_SHARE,
  SKIRT_FLOOR_CLEARANCE_MM,
  SKIRT_MIDI_KNEE_TO_FLOOR_SHARE,
  SKIRT_MINI_ABOVE_KNEE_MM,
} from "../constants/skirt-length";
import { DraftingError } from "../errors/drafting-error";

/** The skirt part of a design spec. */
type Skirt = NonNullable<DesignSpec["skirt"]>;

/**
 * Returns the skirt length in mm from the waist: `lengthMm` when given, else the named length from the body.
 *
 * @param skirt - Skirt part of the spec.
 * @param measurements - Body measurements (uses `waistToKnee` and `waistToFloor`).
 * @returns Length in mm.
 * @throws {DraftingError} `SKIRT_LENGTH_OUT_OF_BODY` or `SKIRT_LENGTH_INVALID_BODY`.
 */
export function resolveSkirtLength(skirt: Skirt, measurements: Measurements): number {
  const { waistToKnee: knee, waistToFloor: floor } = measurements;
  if (skirt.lengthMm !== undefined) {
    if (skirt.lengthMm < MIN_SKIRT_LENGTH_MM || skirt.lengthMm > floor) {
      throw new DraftingError(
        "SKIRT_LENGTH_OUT_OF_BODY",
        `Skirt length ${skirt.lengthMm} mm must be between ${MIN_SKIRT_LENGTH_MM} mm and waist-to-floor ${floor} mm`,
      );
    }
    return skirt.lengthMm;
  }
  if (floor - knee < MIN_KNEE_TO_FLOOR_GAP_MM) {
    throw new DraftingError(
      "SKIRT_LENGTH_INVALID_BODY",
      `Knee-to-floor gap ${floor - knee} mm is below ${MIN_KNEE_TO_FLOOR_GAP_MM} mm`,
    );
  }
  const gap = floor - knee;
  const byLength: Record<Skirt["length"], number> = {
    mini: knee - SKIRT_MINI_ABOVE_KNEE_MM,
    knee,
    midi: knee + SKIRT_MIDI_KNEE_TO_FLOOR_SHARE * gap,
    ankle: knee + SKIRT_ANKLE_KNEE_TO_FLOOR_SHARE * gap,
    floor: floor - SKIRT_FLOOR_CLEARANCE_MM,
  };
  return byLength[skirt.length];
}
