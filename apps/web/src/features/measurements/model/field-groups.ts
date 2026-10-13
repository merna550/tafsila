/** The 18 measurement fields grouped and ordered as the form shows them (design: Measurements.dc.html). */
import type { Measurements } from "@tafsila/schemas";

/** A measurement the form edits (every key of the contract except `unit`). */
export type MeasurementField = Exclude<keyof Measurements, "unit">;

/** Ids of the form's groups; `messages` has `measurements.groups.<id>`. */
export type FieldGroupId = "upperBody" | "arms" | "lengths";

/** One group of the form. */
export interface FieldGroup {
  /** Group id. */
  readonly id: FieldGroupId;
  /** Fields in display order. */
  readonly fields: readonly MeasurementField[];
}

/** All groups in display order. */
export const FIELD_GROUPS: readonly FieldGroup[] = [
  {
    id: "upperBody",
    fields: [
      "bust",
      "highBust",
      "underBust",
      "waist",
      "hip",
      "neck",
      "shoulderWidth",
      "bustPointDistance",
      "bustHeight",
    ],
  },
  { id: "arms", fields: ["armLength", "upperArm", "wrist"] },
  {
    id: "lengths",
    fields: ["height", "backLength", "frontLength", "hipDepth", "waistToKnee", "waistToFloor"],
  },
];

/** Every field in display order. */
export const ALL_FIELDS: readonly MeasurementField[] = FIELD_GROUPS.flatMap((group) => group.fields);

/** Fields a person may leave empty. */
export const OPTIONAL_FIELDS: readonly MeasurementField[] = ["underBust"];

/**
 * Tells whether a field may be left empty.
 *
 * @param field - A measurement field.
 * @returns True for optional fields.
 */
export function isOptionalField(field: MeasurementField): boolean {
  return OPTIONAL_FIELDS.includes(field);
}
