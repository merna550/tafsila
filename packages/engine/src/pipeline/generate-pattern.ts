/** The single engine entry: DesignSpec + Measurements + Options to PatternResult (FR-PAT-01). */
import {
  DEFAULT_SEAM_ALLOWANCE_MM,
  garmentCategorySchema,
  type Piece,
  type PatternResult,
  type ValidationCheck,
} from "@tafsila/schemas";
import { ENGINE_VERSION } from "../version";
import { bbox, samplePath } from "../geometry";
import { assertCategory } from "./category-rules";
import { defaultRegistry } from "./default-registry";
import { createContext, type DraftContext, type PieceDraft } from "./draft-context";
import { checkInput } from "./input-check";
import { inputHash, rawInputHash } from "./input-hash";
import { INPUT_ERROR_MESSAGES, isInputError } from "./input-errors";
import type { ModuleRegistry } from "./registry";
import {
  blocks,
  buildReport,
  finishing,
  layout,
  modulesStep,
  resolve,
  sewingOrder,
  validateStep,
} from "./steps";

/** Options used when the caller gives none. */
export const DEFAULT_ENGINE_OPTIONS = {
  easeProfile: "regular",
  seamAllowance: { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: {} },
  fabricWidthMm: 1400,
  sizeLabel: "custom",
} as const;

/**
 * Fills the parts the finishing step has not provided yet (cut path = stitch path, no labels, bounding box).
 *
 * @param piece - A piece in progress.
 * @returns A complete piece.
 */
function completePiece(piece: PieceDraft): Piece {
  const cutPath = piece.cutPath ?? piece.stitchPath;
  const box = bbox(samplePath(cutPath));
  return {
    ...piece,
    cutPath,
    labels: piece.labels ?? [],
    bbox: piece.bbox ?? { widthMm: box.maxX - box.minX, heightMm: box.maxY - box.minY },
  };
}

/**
 * Turns the final context into the engine output.
 *
 * @param ctx - Context after the last step.
 * @param hash - The input hash.
 * @returns The frozen result.
 */
function toResult(ctx: DraftContext, hash: string): PatternResult {
  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    pieces: ctx.pieces.map(completePiece),
    sewingOrder: [],
    validation: buildReport(ctx.checks),
    meta: { category: ctx.spec.category, sizeLabel: ctx.options.sizeLabel, createdFrom: hash },
  });
}

/**
 * The result for refused input: no pieces and a failing report.
 *
 * @param spec - The raw design, used only to name the category when it is readable.
 * @param options - The raw options, used only to read the size label.
 * @param checks - The checks found by the input check.
 * @param hash - Hash of the raw input.
 * @returns The frozen result.
 */
function refusedResult(
  spec: unknown,
  options: unknown,
  checks: readonly ValidationCheck[],
  hash: string,
): PatternResult {
  const category = garmentCategorySchema.safeParse((spec as { category?: unknown } | null)?.category);
  const label = (options as { sizeLabel?: unknown } | null)?.sizeLabel;
  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    pieces: [],
    sewingOrder: [],
    validation: buildReport(checks),
    meta: {
      category: category.success ? category.data : "dress",
      sizeLabel: typeof label === "string" && label.length > 0 ? label : "unknown",
      createdFrom: hash,
    },
  });
}

/**
 * Drafts a pattern. Pure and deterministic. Bad input gives a `fail` result with no pieces; it never throws.
 * That includes body proportions a block cannot draft and a skirt length outside the body (input codes of
 * `INPUT_ERROR_MESSAGES`, decision 128, 10). Only programming errors (unsupported part combinations,
 * duplicate modules, step order) throw `DraftingError`.
 *
 * @param spec - The design (checked with `designSpecSchema`).
 * @param measurements - The body measurements in mm.
 * @param options - Engine options; defaults to {@link DEFAULT_ENGINE_OPTIONS}.
 * @param registry - Feature modules; defaults to the real registry.
 * @returns The pattern result.
 */
export function generatePattern(
  spec: unknown,
  measurements: unknown,
  options: unknown = DEFAULT_ENGINE_OPTIONS,
  registry: ModuleRegistry = defaultRegistry,
): PatternResult {
  const checked = checkInput(spec, measurements, options);
  if (!checked.input) {
    return refusedResult(spec, options, checked.checks, rawInputHash(spec, measurements, options));
  }
  const { spec: s, measurements: m, options: o } = checked.input;
  assertCategory(s);
  const steps = [
    resolve,
    blocks,
    modulesStep(registry),
    finishing,
    layout,
    validateStep(registry),
    sewingOrder,
  ];
  const hash = inputHash(s, m, o);
  try {
    const done = steps.reduce((ctx, step) => step(ctx), createContext(s, m, o, checked.checks));
    return toResult(done, hash);
  } catch (error) {
    if (!isInputError(error)) throw error;
    const check: ValidationCheck = {
      id: "FR-MEAS-01",
      code: error.code,
      status: "fail",
      message: { ...INPUT_ERROR_MESSAGES[error.code] },
    };
    return refusedResult(s, o, [...checked.checks, check], hash);
  }
}
