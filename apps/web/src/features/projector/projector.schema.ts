/** Zod shapes of the projector feature: the calibration kept in `localStorage` (issue #285). */
import { z } from "zod";

/** The screen a calibration was made on; a change of any value invalidates the calibration. */
export const screenInfoSchema = z.object({
  widthPx: z.number().positive(),
  heightPx: z.number().positive(),
  devicePixelRatio: z.number().positive(),
});

/** Screen size in device-independent pixels (`window.screen`) and `window.devicePixelRatio`. */
export type ScreenInfo = z.infer<typeof screenInfoSchema>;

/** Calibration of one projector: CSS px per real millimetre on each axis, with the setup it belongs to. */
export const projectorCalibrationSchema = z.object({
  version: z.literal(1),
  pxPerMmX: z.number().positive(),
  pxPerMmY: z.number().positive(),
  screen: screenInfoSchema,
  calibratedAt: z.iso.datetime(),
});

/** One stored calibration. */
export type ProjectorCalibration = z.infer<typeof projectorCalibrationSchema>;
