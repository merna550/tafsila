/** Client contract for /api/clients (SRS FR-MEAS-04): a person the tailor sews for. */
import { z } from "zod";
import { pageOf, pageQuerySchema } from "./pagination";

/** Longest client name and note accepted. */
const MAX_NAME_LENGTH = 120;
const MAX_NOTES_LENGTH = 2000;

/** A client name: trimmed, 1 to 120 characters. */
const nameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH).meta({ example: "منى أحمد" });

/** Free notes about the client; null clears them. */
const notesSchema = z.string().trim().max(MAX_NOTES_LENGTH).meta({ example: "تفضل الأكمام الواسعة" });

/** What the list screen shows about a client's measurement sets, computed by the API in one aggregate query. */
export const clientSummarySchema = z.object({
  measurementSetCount: z.number().int().min(0).meta({ example: 2 }),
  latestSizeLabel: z
    .string()
    .nullable()
    .meta({ example: "M", description: "Size label of the newest set; null when it has none" }),
  lastMeasurementAt: z.iso
    .datetime()
    .nullable()
    .meta({ example: "2026-10-11T10:00:00.000Z", description: "When the newest set was saved" }),
});

/** Parsed client summary. */
export type ClientSummary = z.infer<typeof clientSummarySchema>;

/** A client as the API returns it. */
export const clientSchema = z.object({
  id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000a1" }),
  name: nameSchema,
  notes: notesSchema.nullable(),
  createdAt: z.iso.datetime().meta({ example: "2026-10-11T10:00:00.000Z" }),
  summary: clientSummarySchema,
});

/** Parsed client. */
export type Client = z.infer<typeof clientSchema>;

/** Body of POST /api/clients. */
export const createClientInputSchema = z.object({ name: nameSchema, notes: notesSchema.optional() });

/** Parsed create-client body. */
export type CreateClientInput = z.infer<typeof createClientInputSchema>;

/** Body of PATCH /api/clients/{id}: at least one field. */
export const updateClientInputSchema = z
  .object({ name: nameSchema.optional(), notes: notesSchema.nullable().optional() })
  .refine((value) => value.name !== undefined || value.notes !== undefined, {
    message: "Send at least one of name or notes",
  });

/** Parsed update-client body. */
export type UpdateClientInput = z.infer<typeof updateClientInputSchema>;

/** Query of GET /api/clients. */
export const listClientsQuerySchema = pageQuerySchema.extend({
  q: z.string().trim().max(MAX_NAME_LENGTH).optional().meta({ example: "منى", description: "Name search" }),
});

/** Parsed list-clients query. */
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;

/** Response of GET /api/clients. */
export const clientPageSchema = pageOf(clientSchema);
