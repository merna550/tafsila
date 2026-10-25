/** Unit helpers of the PDF code (decision 282): the engine works in mm, a PDF page in points. */

/** PDF points in one inch. */
const PT_PER_INCH = 72;
/** Millimetres in one inch. */
const MM_PER_INCH = 25.4;

/** Points per millimetre: a PDF point is 1/72 inch and an inch is 25.4 mm. */
export const MM_TO_PT = PT_PER_INCH / MM_PER_INCH;

/**
 * Converts millimetres to PDF points.
 *
 * @param mm - Length in millimetres.
 * @returns The length in points.
 */
export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

/** A4 portrait size in mm. */
const A4_MM = { width: 210, height: 297 } as const;
/** A0 portrait size in mm. */
const A0_MM = { width: 841, height: 1189 } as const;

/** A4 portrait page size in points (210 x 297 mm). */
export const A4_PT = { width: mmToPt(A4_MM.width), height: mmToPt(A4_MM.height) } as const;

/** A0 portrait page size in points (841 x 1189 mm). */
export const A0_PT = { width: mmToPt(A0_MM.width), height: mmToPt(A0_MM.height) } as const;
