/** Engine output contract: PatternResult, Piece, Path and friends (SRS §6.3). All lengths are in millimetres. */
import { z } from "zod";
import { garmentCategorySchema } from "./design-spec";
import { edgeKindSchema } from "./engine-options";

/** Largest gap, in mm, tolerated between the end of one segment and the start of the next. */
export const PATH_JOIN_TOLERANCE_MM = 0.01;

/** Arabic and English text pair used for every user-facing string. */
export const localizedTextSchema = z.object({ ar: z.string().min(1), en: z.string().min(1) });

/** A point on the pattern sheet, in mm. */
export const pointSchema = z.object({ x: z.number(), y: z.number() });

/** A point on the pattern sheet, in mm. */
export type Point = z.infer<typeof pointSchema>;

/** A straight segment or a cubic Bezier segment; each stores both ends so it can be read alone. */
export const segmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("line"), from: pointSchema, to: pointSchema }),
  z.object({
    kind: z.literal("cubic"),
    from: pointSchema,
    c1: pointSchema,
    c2: pointSchema,
    to: pointSchema,
  }),
]);

/** One segment of a path. */
export type Segment = z.infer<typeof segmentSchema>;

/**
 * True when two points are closer than the join tolerance on both axes.
 *
 * @param a - First point.
 * @param b - Second point.
 * @returns Whether the points coincide within tolerance.
 */
function samePoint(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) <= PATH_JOIN_TOLERANCE_MM && Math.abs(a.y - b.y) <= PATH_JOIN_TOLERANCE_MM;
}

/**
 * True when each segment starts where the previous one ends.
 *
 * @param segments - Segments in path order.
 * @returns Whether the path has no gaps.
 */
function isContinuous(segments: Segment[]): boolean {
  return segments.every((s, i) => i === 0 || samePoint(segments[i - 1]!.to, s.from));
}

/** An ordered, continuous list of segments (no gaps larger than the join tolerance). */
export const pathSchema = z
  .array(segmentSchema)
  .min(1)
  .refine(isContinuous, { message: "Path segments must join end to start" });

/** An ordered, continuous list of segments. */
export type Path = z.infer<typeof pathSchema>;

/** A path whose last end meets its first start, like a stitch line or a cut line. */
export const closedPathSchema = pathSchema.refine(
  (segments) => samePoint(segments[segments.length - 1]!.to, segments[0]!.from),
  { message: "Path must be closed" },
);

/** Which edge of which piece an edge or notch is sewn to. */
const edgePairSchema = z.object({
  pieceId: z.string().min(1),
  edgeId: z.string().min(1),
  intendedEaseMm: z.number().optional(),
  reversed: z.boolean().optional(),
});

/** What an edge is for: a seam-allowance kind, or `fold` (cut on the fold, never any allowance; decision 130). */
export const pieceEdgeKindSchema = z.enum([...edgeKindSchema.options, "fold"]);

/** What an edge is for: a seam-allowance kind, or `fold`. */
export type PieceEdgeKind = z.infer<typeof pieceEdgeKindSchema>;

/** A named run of stitch-path segments with its seam allowance and the edge it is sewn to. */
export const edgeSchema = z.object({
  id: z.string().min(1),
  fromSegment: z.number().int().min(0),
  toSegment: z.number().int().min(0),
  kind: pieceEdgeKindSchema.optional(),
  seamAllowanceMm: z.number().min(0),
  pairsWith: edgePairSchema.optional(),
});

/** A named edge of a piece. */
export type Edge = z.infer<typeof edgeSchema>;

/** A balance mark placed on an edge, `atMm` along the stitch line from the edge start. */
export const notchSchema = z.object({
  id: z.string().min(1),
  edgeId: z.string().min(1),
  atMm: z.number().min(0),
  pairsWith: edgePairSchema
    .omit({ intendedEaseMm: true })
    .extend({
      /**
       * The end of this notch's edge its distance is compared from (default `start`); the partner is measured
       * from the end that sews to it (`reversed` flips it). A sleeve uses `end` to match from the underarm,
       * where the cap carries no ease (decision 134).
       */
      alignFrom: z.enum(["start", "end"]).optional(),
    })
    .optional(),
});

/** A balance mark on an edge. */
export type Notch = z.infer<typeof notchSchema>;

/** A dart: its tip and the two legs on the edge it opens from. */
export const dartSchema = z.object({
  id: z.string().min(1),
  edgeId: z.string().min(1),
  apex: pointSchema,
  legs: z.tuple([pointSchema, pointSchema]),
  bustPointLimit: z
    .object({
      point: pointSchema,
      axis: z.enum(["x", "y"]),
      direction: z.enum(["positive", "negative"]),
      setbackMm: z.number().min(0),
    })
    .optional(),
});

/** A dart on a piece. */
export type Dart = z.infer<typeof dartSchema>;

/** A geometric declaration used to measure one garment circumference from finished pieces. */
export const bodyLineSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string().min(1),
    measurement: z.enum(["bust", "waist", "hip"]),
    kind: z.literal("edge"),
    edgeId: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    measurement: z.enum(["bust", "waist", "hip"]),
    kind: z.literal("horizontal"),
    atMm: z.number(),
  }),
]);

/** One body line declared by a pattern piece. */
export type BodyLine = z.infer<typeof bodyLineSchema>;

/** A text or mark printed on a piece. */
export const labelSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["name", "size", "cut", "scale-square"]),
  text: localizedTextSchema,
  at: pointSchema,
  rotationDeg: z.number(),
  sizeMm: z.number().positive().optional(),
});

/** A label on a piece. */
export type Label = z.infer<typeof labelSchema>;

/** One pattern piece with everything needed to cut and sew it. */
export const pieceSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  cut: z.object({
    quantity: z.number().int().min(1),
    onFold: z.boolean(),
    mirror: z.boolean(),
    fabric: z.enum(["main", "lining", "interfacing"]),
  }),
  stitchPath: closedPathSchema,
  cutPath: closedPathSchema,
  edges: z.array(edgeSchema),
  notches: z.array(notchSchema),
  bodyLines: z.array(bodyLineSchema),
  sleeveCap: z
    .object({
      /** The cap edges, in path order; their lengths add up to the cap (decision 134). */
      edgeIds: z.array(z.string().min(1)).min(1),
      armholeRefs: z.array(edgePairSchema.pick({ pieceId: true, edgeId: true })).min(1),
    })
    .optional(),
  grainLine: z.tuple([pointSchema, pointSchema]),
  darts: z.array(dartSchema),
  labels: z.array(labelSchema),
  bbox: z.object({ widthMm: z.number().min(0), heightMm: z.number().min(0) }),
});

/** One pattern piece. */
export type Piece = z.infer<typeof pieceSchema>;

/** One step of the sewing order. */
export const sewingStepSchema = z.object({
  order: z.number().int().min(1),
  action: z.enum(["sew", "press", "finish", "attach"]),
  edges: z.array(z.string()),
  text: localizedTextSchema,
});

/** One step of the sewing order. */
export type SewingStep = z.infer<typeof sewingStepSchema>;

/** Outcome of a validation check or of the whole report. */
export const validationStatusSchema = z.enum(["pass", "warn", "fail"]);

/** Ids of the validation rules (FR-VAL-01..08) plus input measurement rejection (FR-MEAS-01). */
export const validationCheckIdSchema = z.enum([
  "FR-VAL-01",
  "FR-VAL-02",
  "FR-VAL-03",
  "FR-VAL-04",
  "FR-VAL-05",
  "FR-VAL-06",
  "FR-VAL-07",
  "FR-VAL-08",
  "FR-MEAS-01",
]);

/** A single validation check result. */
export const validationCheckSchema = z.object({
  id: validationCheckIdSchema,
  code: z.string().min(1).optional(),
  status: validationStatusSchema,
  message: localizedTextSchema,
  measuredMm: z.number().optional(),
  expectedMm: z.number().optional(),
  refs: z.array(z.string()).optional(),
});

/** A single validation check result. */
export type ValidationCheck = z.infer<typeof validationCheckSchema>;

/** The validation outcome for a whole pattern. */
export const validationReportSchema = z.object({
  status: validationStatusSchema,
  checks: z.array(validationCheckSchema),
});

/** The validation outcome for a whole pattern. */
export type ValidationReport = z.infer<typeof validationReportSchema>;

/** The engine output: pieces, sewing order, validation report and metadata. */
export const patternResultSchema = z.object({
  engineVersion: z.string().regex(/^\d+\.\d+\.\d+/),
  pieces: z.array(pieceSchema),
  sewingOrder: z.array(sewingStepSchema),
  validation: validationReportSchema,
  meta: z.object({
    category: garmentCategorySchema,
    sizeLabel: z.string().min(1),
    createdFrom: z.string().min(1),
  }),
});

/** The engine output. */
export type PatternResult = z.infer<typeof patternResultSchema>;
