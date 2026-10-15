/** Named offsets and shares behind the skirt length options (issue #126, decision 126-ease-tables). */

/** A `mini` hem sits this far above the knee, in mm. */
export const SKIRT_MINI_ABOVE_KNEE_MM = 180;

/** A `midi` hem sits this share of the way from the knee to the floor. */
export const SKIRT_MIDI_KNEE_TO_FLOOR_SHARE = 0.4;

/** An `ankle` hem sits this share of the way from the knee to the floor. */
export const SKIRT_ANKLE_KNEE_TO_FLOOR_SHARE = 0.85;

/** A `floor` hem stops this far above the floor, in mm, so it clears the ground. */
export const SKIRT_FLOOR_CLEARANCE_MM = 20;

/** Smallest knee-to-floor gap, in mm, for which the five length options keep their order. */
export const MIN_KNEE_TO_FLOOR_GAP_MM = 150;

/** Shortest skirt accepted when the spec gives an explicit length, in mm. */
export const MIN_SKIRT_LENGTH_MM = 100;
