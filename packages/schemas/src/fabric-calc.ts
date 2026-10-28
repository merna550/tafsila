/** Contracts of the saved fabric calculation (PUT and GET /api/versions/{id}/fabric) and of the recommendation response (FR-FAB-01, FR-REC-02; ADR-312 item 5). */
import { z } from "zod";
import { fabricAvoidSchema, fabricRecommendationSchema, fabricSchema, RECOMMENDED_COUNT } from "./fabric";
import { fabricOptionsSchema } from "./fabric-options";

/** The fabric kinds a calculation covers (FR-FAB-05). */
export const fabricCalcKindSchema = z.enum(["main", "lining", "interfacing"]);

/** Most placements one fabric kind may store; a dress has far fewer, the cap only bounds the body size. */
export const MAX_PLACEMENTS_PER_KIND = 200;

/** Length to buy is rounded up to this step, in metres (ADR-312 item 4). */
export const LENGTH_STEP_M = 0.1;

/** Largest length to buy for one kind, in metres. */
export const MAX_LENGTH_M = 100;

/** Digits kept when a length is compared with the 0.1 m step (absorbs floating point noise). */
const STEP_TOLERANCE = 1e-6;

/**
 * Tells whether a number of metres is a whole number of 0.1 m steps.
 *
 * @param metres - Length in metres.
 * @returns True when it is a multiple of 0.1.
 */
export function isWholeLengthStep(metres: number): boolean {
  const steps = metres / LENGTH_STEP_M;
  return Math.abs(steps - Math.round(steps)) < STEP_TOLERANCE;
}

/** Longest shape id accepted (`<pieceId>#<n>`). */
const MAX_SHAPE_ID_LENGTH = 80;

/** The only turn besides none that a placement may use, in degrees (ADR-312 item 4). */
const HALF_TURN_DEG = 180;

/** Where one shape lies on the fabric strip, in mm, and the turn it was given (0 or 180 degrees). */
export const fabricPlacementSchema = z.object({
  shapeId: z.string().min(1).max(MAX_SHAPE_ID_LENGTH).meta({ example: "front-bodice#1" }),
  xMm: z.number().min(0).meta({ example: 120 }),
  yMm: z.number().min(0).meta({ example: 0 }),
  turn: z.union([z.literal(0), z.literal(HALF_TURN_DEG)]).meta({ example: 0 }),
});

/** The layout of one fabric kind: the length to buy and where each shape lies. */
export const fabricKindResultSchema = z.object({
  kind: fabricCalcKindSchema,
  lengthM: z
    .number()
    .positive()
    .max(MAX_LENGTH_M)
    .refine(isWholeLengthStep, { message: "Length must be a multiple of 0.1 m" })
    .meta({ example: 2.3, description: "Length to buy in metres, a multiple of 0.1" }),
  placements: z.array(fabricPlacementSchema).max(MAX_PLACEMENTS_PER_KIND),
});

/** The result of a calculation: one entry per fabric kind that has pieces. */
export const fabricCalcResultSchema = z.object({
  kinds: z
    .array(fabricKindResultSchema)
    .min(1)
    .max(fabricCalcKindSchema.options.length)
    .refine((kinds) => new Set(kinds.map((k) => k.kind)).size === kinds.length, {
      message: "Each fabric kind may appear once",
    }),
});

/** A parsed calculation result. */
export type FabricCalcResult = z.infer<typeof fabricCalcResultSchema>;

/** Longest nesting version label accepted (a short version string such as `1.0.0`). */
const MAX_NESTING_VERSION_LENGTH = 40;

/**
 * Body of PUT /api/versions/{id}/fabric. The result is typed loosely here and checked by the server, so a wrong
 * length answers 422 FABRIC_CALC_INVALID with the field named.
 */
export const saveFabricCalcInputSchema = z.object({
  options: fabricOptionsSchema,
  result: z
    .looseObject({})
    .meta({ description: "A fabricCalcResult, validated by the server (422 when wrong)" }),
  nestingVersion: z.string().min(1).max(MAX_NESTING_VERSION_LENGTH).meta({ example: "1.0.0" }),
});

/** Parsed save-calc body. */
export type SaveFabricCalcInput = z.infer<typeof saveFabricCalcInputSchema>;

/** A stored calculation. */
export const fabricCalcSchema = z.object({
  versionId: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000f2" }),
  options: fabricOptionsSchema,
  result: fabricCalcResultSchema,
  nestingVersion: z.string().meta({ example: "1.0.0" }),
  updatedAt: z.iso.datetime().meta({ example: "2026-10-28T10:00:00.000Z" }),
});

/** A parsed stored calculation. */
export type FabricCalc = z.infer<typeof fabricCalcSchema>;

/** Query of GET /api/fabrics/recommend. */
export const recommendFabricsQuerySchema = z.object({
  versionId: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000f2" }),
});

/** Parsed recommend query. */
export type RecommendFabricsQuery = z.infer<typeof recommendFabricsQuerySchema>;

/** What the screen shows of a catalogue fabric: its names and its properties (ADR-319 item 1). */
export const fabricSummarySchema = fabricSchema.pick({
  id: true,
  nameAr: true,
  nameEn: true,
  properties: true,
});

/** A catalogue fabric as the recommendation response carries it. */
export type FabricSummary = z.infer<typeof fabricSummarySchema>;

/** A recommended fabric with its catalogue summary, so the screen needs no second request. */
export const recommendedFabricSchema = fabricRecommendationSchema.extend({ fabric: fabricSummarySchema });

/** A recommended fabric with its summary. */
export type RecommendedFabric = z.infer<typeof recommendedFabricSchema>;

/** An avoided fabric with its catalogue summary. */
export const avoidedFabricSchema = fabricAvoidSchema.extend({ fabric: fabricSummarySchema });

/** An avoided fabric with its summary. */
export type AvoidedFabric = z.infer<typeof avoidedFabricSchema>;

/** Response of GET /api/fabrics/recommend: the ranked fabrics, the avoid list and whether the data is still a draft. */
export const recommendFabricsResponseSchema = z.object({
  recommended: z.array(recommendedFabricSchema).max(RECOMMENDED_COUNT.max),
  avoid: z.array(avoidedFabricSchema),
  isDraft: z.boolean().meta({ description: "True while the catalogue or rules used are not yet reviewed" }),
});

/** Parsed recommend response. */
export type RecommendFabricsResponse = z.infer<typeof recommendFabricsResponseSchema>;
