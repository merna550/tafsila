/** Standard size chart contract (SRS FR-MEAS-01, ADR-024). */
import { z } from "zod";
import { measurementsSchema } from "./measurements";

/**
 * A size chart: size label to full body measurements.
 * Labels are free strings, not an enum, so sizes beyond XXL are data only (ADR-024).
 */
export const sizeChartSchema = z
  .record(z.string().min(1), measurementsSchema)
  .refine((chart) => Object.keys(chart).length > 0, {
    message: "A size chart needs at least one size",
  });

/** Validated size chart: size label to measurements in millimetres. */
export type SizeChart = z.infer<typeof sizeChartSchema>;

/** The default size chart as GET /api/size-charts/default returns it. */
export const sizeChartResponseSchema = z.object({
  id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000d1" }),
  name: z.string().min(1).meta({ example: "Egyptian/EU S-XXL" }),
  sizes: sizeChartSchema,
});

/** Parsed default size chart response. */
export type SizeChartResponse = z.infer<typeof sizeChartResponseSchema>;
