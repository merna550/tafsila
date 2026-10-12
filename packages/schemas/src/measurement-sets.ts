/** Measurement set contract for /api/measurements (SRS FR-MEAS-04): saved body measurements, optionally for a client. */
import { z } from "zod";
import { measurementsSchema } from "./measurements";
import { pageOf, pageQuerySchema } from "./pagination";

/** Longest label accepted. */
const MAX_LABEL_LENGTH = 120;

/** A label such as "Mona - summer 2026". */
const labelSchema = z.string().trim().min(1).max(MAX_LABEL_LENGTH).meta({ example: "قياسات منى" });

/** Optional size label the set started from (informational only). */
const sizeLabelSchema = z.string().trim().min(1).max(MAX_LABEL_LENGTH).meta({ example: "M" });

/** One suspicious or impossible value reported by the engine, in both languages. */
export const measurementIssueSchema = z.object({
  code: z.string().meta({ example: "MEAS_WAIST_NOT_BELOW_HIP" }),
  fields: z.array(z.string()).meta({ example: ["waist", "hip"] }),
  message_ar: z.string(),
  message_en: z.string(),
});

/** Parsed measurement issue. */
export type MeasurementIssueDto = z.infer<typeof measurementIssueSchema>;

/** A saved measurement set as the API returns it; warnings are computed on every read, never stored. */
export const measurementSetSchema = z.object({
  id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000c1" }),
  clientId: z.uuid().nullable(),
  label: labelSchema,
  sizeLabel: sizeLabelSchema.nullable(),
  measurements: measurementsSchema,
  warnings: z.array(measurementIssueSchema),
  createdAt: z.iso.datetime().meta({ example: "2026-10-11T10:00:00.000Z" }),
});

/** Parsed measurement set. */
export type MeasurementSet = z.infer<typeof measurementSetSchema>;

/** Body of POST /api/measurements. */
export const saveMeasurementSetInputSchema = z.object({
  clientId: z.uuid().optional(),
  label: labelSchema,
  sizeLabel: sizeLabelSchema.optional(),
  measurements: measurementsSchema,
});

/** Parsed save body. */
export type SaveMeasurementSetInput = z.infer<typeof saveMeasurementSetInputSchema>;

/** Body of PUT /api/measurements/{id}: replaces label, size label and measurements (the client is fixed). */
export const updateMeasurementSetInputSchema = saveMeasurementSetInputSchema.omit({ clientId: true });

/** Parsed update body. */
export type UpdateMeasurementSetInput = z.infer<typeof updateMeasurementSetInputSchema>;

/** Query of GET /api/measurements. */
export const listMeasurementSetsQuerySchema = pageQuerySchema.extend({
  clientId: z.uuid().optional(),
});

/** Parsed list query. */
export type ListMeasurementSetsQuery = z.infer<typeof listMeasurementSetsQuerySchema>;

/** Response of GET /api/measurements. */
export const measurementSetPageSchema = pageOf(measurementSetSchema);
