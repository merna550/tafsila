/** Error body returned by every failing API endpoint; the web API client parses it into an ApiError (ADR-030). */
import { z } from "zod";

/** Schema of the JSON body of every non-2xx API response. */
export const apiErrorBodySchema = z.object({
  /** Stable machine-readable code from the error catalogue (docs/errors.md). */
  code: z.string(),
  /** Message for Arabic users. */
  message_ar: z.string(),
  /** Message for English users. */
  message_en: z.string(),
  /** Extras; `fields` maps a field path to the message shown under that field, `issues` carries bilingual measurement issues. */
  details: z
    .object({
      fields: z.record(z.string(), z.string()).optional(),
      retryAfterSeconds: z.number().int().positive().optional(),
      issues: z
        .array(
          z.object({
            code: z.string(),
            fields: z.array(z.string()),
            message_ar: z.string(),
            message_en: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
  /** Id of the failing request; users can copy it to support. */
  request_id: z.string(),
});

/** Parsed API error body. */
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
