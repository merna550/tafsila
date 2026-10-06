/** Body measurements contract (SRS §6.2). All lengths are in millimetres. */
import { z } from "zod";

/** Smallest and largest plausible body length accepted from users, in mm. */
const MIN_LENGTH_MM = 50;
const MAX_LENGTH_MM = 2500;

/** A single body length in millimetres within plausible human limits. */
const lengthMm = z.number().min(MIN_LENGTH_MM).max(MAX_LENGTH_MM);

/** Body measurements used by the pattern engine (custom or derived from a standard size). */
export const measurementsSchema = z.object({
  unit: z.literal("mm"),
  height: lengthMm,
  bust: lengthMm,
  highBust: lengthMm,
  underBust: lengthMm.optional(),
  waist: lengthMm,
  hip: lengthMm,
  hipDepth: lengthMm,
  neck: lengthMm,
  shoulderWidth: lengthMm,
  backLength: lengthMm,
  frontLength: lengthMm,
  bustPointDistance: lengthMm,
  bustHeight: lengthMm,
  armLength: lengthMm,
  upperArm: lengthMm,
  wrist: lengthMm,
  waistToKnee: lengthMm,
  waistToFloor: lengthMm,
});

/** Validated body measurements in millimetres. */
export type Measurements = z.infer<typeof measurementsSchema>;

/** How much room the garment has over the body. */
export const easeProfileSchema = z.enum(["fitted", "regular", "loose"]);

/** Ease profile chosen by the user for a pattern. */
export type EaseProfile = z.infer<typeof easeProfileSchema>;
