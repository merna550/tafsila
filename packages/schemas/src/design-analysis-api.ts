/** Contract for POST /designs/{id}/analyze and GET /designs/{id}/analysis (SRS FR-DES-02, FR-DES-03, §9): background photo analysis. */
import { z } from "zod";
import { designAnalysisResultSchema } from "./design-analysis";

/** Categories the engine can draw in v1; anything else answers "coming soon" (FR-DES-02). */
export const SUPPORTED_ANALYSIS_CATEGORIES = ["dress", "skirt", "blouse"] as const;

/** Longest category hint accepted. */
const MAX_HINT_LENGTH = 40;

/** Body of POST /designs/{id}/analyze. The hint is free text so an unsupported one gets its own error code. */
export const analyzeDesignInputSchema = z.object({
  categoryHint: z.string().trim().min(1).max(MAX_HINT_LENGTH).optional().meta({ example: "dress" }),
});

/** Parsed analyse request. */
export type AnalyzeDesignRequest = z.infer<typeof analyzeDesignInputSchema>;

/** Why a stored analysis failed; the text is never the provider's own message. */
export const analysisErrorCodeSchema = z.enum(["AI_OUTPUT_INVALID", "AI_ANALYSIS_FAILED"]);

/** Why a stored analysis failed. */
export type AnalysisErrorCode = z.infer<typeof analysisErrorCodeSchema>;

/** Where an analysis stands: `none` before the first request. */
export const analysisStatusSchema = z.enum(["none", "pending", "done", "failed"]);

/** The state stored in `designs.analysis` and returned by GET /designs/{id}/analysis. */
export const designAnalysisStateSchema = z.object({
  status: analysisStatusSchema,
  /** When the request was accepted (ISO 8601). */
  startedAt: z.iso.datetime().optional(),
  /** When the job ended, `done` or `failed` only (ISO 8601). */
  finishedAt: z.iso.datetime().optional(),
  /** The analysis, when `done`. */
  result: designAnalysisResultSchema.optional(),
  /** Why it failed, when `failed`. */
  errorCode: analysisErrorCodeSchema.optional(),
});

/** The state of a design's analysis. */
export type DesignAnalysisState = z.infer<typeof designAnalysisStateSchema>;

/** Response of GET /designs/{id}/analysis. */
export const designAnalysisResponseSchema = designAnalysisStateSchema;

/** Response of POST /designs/{id}/analyze (202): always `pending`. */
export const analyzeAcceptedResponseSchema = z.object({
  status: z.literal("pending"),
  startedAt: z.iso.datetime(),
});

/** Accepted analysis. */
export type AnalyzeAcceptedResponse = z.infer<typeof analyzeAcceptedResponseSchema>;
