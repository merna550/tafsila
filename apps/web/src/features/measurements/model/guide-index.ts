/** Which fields have guide art: the typed index the tests check against the messages. */
import { markOf } from "../guide/guide-marks";
import { ALL_FIELDS, type MeasurementField } from "./field-groups";

/**
 * Tells whether a field has a guide drawing.
 *
 * @param field - A measurement field.
 * @returns True when the drawing exists.
 */
export function hasGuideMark(field: MeasurementField): boolean {
  return markOf(field) !== undefined;
}

/**
 * Finds the field after the given one, for the guide's "next measurement" button.
 *
 * @param field - Current field.
 * @returns The next field in display order, or undefined for the last one.
 */
export function nextGuideField(field: MeasurementField): MeasurementField | undefined {
  return ALL_FIELDS[ALL_FIELDS.indexOf(field) + 1];
}
