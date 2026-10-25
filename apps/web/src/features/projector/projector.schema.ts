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

/** The line colours of the projector view; white or yellow shows best on a dark table cover. */
export const PROJECTOR_COLORS = ["white", "yellow"] as const;

/** One of {@link PROJECTOR_COLORS}. */
export type ProjectorColor = (typeof PROJECTOR_COLORS)[number];

/** Smallest line width the view allows, in CSS px. */
export const LINE_WIDTH_MIN_PX = 1;
/** Largest line width the view allows, in CSS px. */
export const LINE_WIDTH_MAX_PX = 6;

/** The view settings kept per device: line width and colour. Pan and mirror are not kept (issue #286). */
export const projectorPrefsSchema = z.object({
  version: z.literal(1),
  lineWidthPx: z.number().min(LINE_WIDTH_MIN_PX).max(LINE_WIDTH_MAX_PX),
  color: z.enum(PROJECTOR_COLORS),
});

/** Stored line width and colour. */
export type ProjectorPrefs = z.infer<typeof projectorPrefsSchema>;

/** The piece handling kept per viewer and version: which piece is shown and where pieces were moved (issue #287). The active piece is not kept. */
export const projectorPlacementSchema = z.object({
  version: z.literal(1),
  selection: z.string(),
  placements: z.record(
    z.string(),
    z.object({
      offsetMm: z.object({ x: z.number(), y: z.number() }),
      // eslint-disable-next-line no-magic-numbers -- the half turn is the one allowed angle besides 0
      rotationDeg: z.union([z.literal(0), z.literal(180)]),
    }),
  ),
});

/** Stored selection and placements of one version. */
export type ProjectorPlacementStored = z.infer<typeof projectorPlacementSchema>;
