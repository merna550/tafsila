/** Which fields of a set differ from the standard size it started from ("overridden" fields). Not stored: derived on read. */
import type { Measurements, SizeChart } from "@tafsila/schemas";
import { ALL_FIELDS, type MeasurementField } from "./field-groups";

/**
 * Finds the chart's measurements for a size.
 *
 * @param chart - Size chart.
 * @param sizeLabel - Size label such as "M".
 * @returns The size's measurements, or undefined for an unknown label.
 */
export function sizeOf(chart: SizeChart, sizeLabel: string): Measurements | undefined {
  return Object.hasOwn(chart, sizeLabel) ? chart[sizeLabel] : undefined;
}

/**
 * Lists the fields whose value differs from the size. An unknown size marks every field as changed.
 *
 * @param chart - Size chart.
 * @param sizeLabel - Size the set started from.
 * @param measurements - Current values.
 * @returns Changed fields in display order.
 */
export function diffFromSize(
  chart: SizeChart,
  sizeLabel: string,
  measurements: Partial<Measurements>,
): MeasurementField[] {
  const base = sizeOf(chart, sizeLabel);
  return ALL_FIELDS.filter((field) => !base || base[field] !== measurements[field]);
}

/**
 * Puts the size's value back into one field.
 *
 * @param chart - Size chart.
 * @param sizeLabel - Size the set started from.
 * @param measurements - Current values.
 * @param field - Field to reset.
 * @returns New values; unchanged when the size is unknown.
 */
export function resetField(
  chart: SizeChart,
  sizeLabel: string,
  measurements: Partial<Measurements>,
  field: MeasurementField,
): Partial<Measurements> {
  const base = sizeOf(chart, sizeLabel);
  if (!base) return measurements;
  const next = { ...measurements };
  if (base[field] === undefined) delete next[field];
  else next[field] = base[field];
  return next;
}
