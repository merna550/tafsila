/** Options passed to `generatePattern` (SRS FR-PAT-03). All lengths are in millimetres. */
import { z } from "zod";
import { easeProfileSchema } from "./measurements";

/** The kind of edge a default seam allowance applies to. */
export const edgeKindSchema = z.enum(["side", "neckline", "armhole", "hem", "other"]);

/** The kind of edge a default seam allowance applies to. */
export type EdgeKind = z.infer<typeof edgeKindSchema>;

/** Default seam allowance per edge kind, in mm (FR-PAT-03). */
export const DEFAULT_SEAM_ALLOWANCE_MM: Record<EdgeKind, number> = {
  side: 15,
  neckline: 10,
  armhole: 10,
  hem: 30,
  other: 15,
};

/** Seam allowance settings: defaults per edge kind and overrides keyed "pieceId/edgeId". */
export const seamAllowanceOptionsSchema = z.object({
  defaultsMm: z.record(edgeKindSchema, z.number().min(0)),
  perEdgeMm: z.record(z.string(), z.number().min(0)),
});

/** Everything the caller can tune for one engine run. */
export const engineOptionsSchema = z.object({
  easeProfile: easeProfileSchema,
  seamAllowance: seamAllowanceOptionsSchema.default({
    defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM,
    perEdgeMm: {},
  }),
  fabricWidthMm: z.number().positive(),
  sizeLabel: z.string().min(1),
});

/** Everything the caller can tune for one engine run. */
export type EngineOptions = z.infer<typeof engineOptionsSchema>;
