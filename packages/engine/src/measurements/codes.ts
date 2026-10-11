/** Stable codes and bilingual messages for measurement issues (engine report codes, not API error codes). */
import type { MeasurementKey } from "../constants/measurement-ranges";

/** Stable identifier of a measurement rule. */
export type MeasurementIssueCode =
  | "MEAS_OUT_OF_RANGE"
  | "MEAS_HIGH_BUST_EXCEEDS_BUST"
  | "MEAS_UNDER_BUST_NOT_BELOW_BUST"
  | "MEAS_KNEE_BELOW_FLOOR_LENGTH"
  | "MEAS_WAIST_NOT_BELOW_HIP"
  | "MEAS_BUST_POINTS_TOO_WIDE"
  | "MEAS_FRONT_SHORTER_THAN_BACK"
  | "MEAS_WAIST_TO_FLOOR_UNUSUAL";

/** One problem found in a set of measurements. */
export interface MeasurementIssue {
  /** Stable rule code. */
  readonly code: MeasurementIssueCode;
  /** Measurements the issue is about. */
  readonly fields: readonly MeasurementKey[];
  /** Arabic message for the user. */
  readonly message_ar: string;
  /** English message for the user. */
  readonly message_en: string;
}

/** Result of validating measurements: errors block, warnings never do. */
export interface MeasurementReport {
  readonly errors: readonly MeasurementIssue[];
  readonly warnings: readonly MeasurementIssue[];
}

/** Arabic and English display names of each measurement. */
export const MEASUREMENT_LABELS: Readonly<Record<MeasurementKey, { ar: string; en: string }>> = {
  height: { ar: "الطول", en: "height" },
  bust: { ar: "الصدر", en: "bust" },
  highBust: { ar: "أعلى الصدر", en: "high bust" },
  underBust: { ar: "تحت الصدر", en: "under bust" },
  waist: { ar: "الوسط", en: "waist" },
  hip: { ar: "الورك", en: "hip" },
  hipDepth: { ar: "عمق الورك", en: "hip depth" },
  neck: { ar: "الرقبة", en: "neck" },
  shoulderWidth: { ar: "عرض الكتف", en: "shoulder width" },
  backLength: { ar: "طول الظهر", en: "back length" },
  frontLength: { ar: "طول الأمام", en: "front length" },
  bustPointDistance: { ar: "المسافة بين نقطتي الصدر", en: "bust point distance" },
  bustHeight: { ar: "ارتفاع الصدر", en: "bust height" },
  armLength: { ar: "طول الذراع", en: "arm length" },
  upperArm: { ar: "أعلى الذراع", en: "upper arm" },
  wrist: { ar: "المعصم", en: "wrist" },
  waistToKnee: { ar: "من الوسط للركبة", en: "waist to knee" },
  waistToFloor: { ar: "من الوسط للأرض", en: "waist to floor" },
};

/** Fixed bilingual messages of the cross-check rules (centimetres are not used: values stay in mm). */
export const CROSS_CHECK_MESSAGES: Readonly<
  Record<Exclude<MeasurementIssueCode, "MEAS_OUT_OF_RANGE">, { ar: string; en: string }>
> = {
  MEAS_HIGH_BUST_EXCEEDS_BUST: {
    ar: "أعلى الصدر لا يمكن أن يكون أكبر من الصدر. راجعي القياسين.",
    en: "High bust cannot be larger than bust. Please check both.",
  },
  MEAS_UNDER_BUST_NOT_BELOW_BUST: {
    ar: "تحت الصدر يجب أن يكون أصغر من الصدر. راجعي القياسين.",
    en: "Under bust must be smaller than bust. Please check both.",
  },
  MEAS_KNEE_BELOW_FLOOR_LENGTH: {
    ar: "من الوسط للركبة يجب أن يكون أقصر من الوسط للأرض. راجعي القياسين.",
    en: "Waist to knee must be shorter than waist to floor. Please check both.",
  },
  MEAS_WAIST_NOT_BELOW_HIP: {
    ar: "الوسط أكبر من أو يساوي الورك، وهذا غير معتاد. تأكدي من القياسين.",
    en: "Waist is not smaller than hip, which is unusual. Please double-check.",
  },
  MEAS_BUST_POINTS_TOO_WIDE: {
    ar: "المسافة بين نقطتي الصدر أكبر من نصف محيط الصدر، وهذا غير معتاد. تأكدي من القياسين.",
    en: "Bust point distance is more than half the bust, which is unusual. Please double-check.",
  },
  MEAS_FRONT_SHORTER_THAN_BACK: {
    ar: "طول الأمام أقصر من طول الظهر، وعادة يكون الأمام أطول فوق الصدر. تأكدي من القياسين.",
    en: "Front length is shorter than back length; the front is normally longer over the bust. Please double-check.",
  },
  MEAS_WAIST_TO_FLOOR_UNUSUAL: {
    ar: "من الوسط للأرض غير متناسب مع الطول. تأكدي من القياسين.",
    en: "Waist to floor does not fit the height (expected 50% to 70% of it). Please double-check.",
  },
};
