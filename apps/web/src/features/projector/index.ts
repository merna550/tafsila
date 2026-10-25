/** Public entry of the projector feature: the calibration screen and the calibration hook other projector screens use. */
export { CalibrationScreen } from "./CalibrationScreen";
export { useCalibration, type CalibrationController } from "./hooks/use-calibration";
export type { ProjectorCalibration, ScreenInfo } from "./projector.schema";
