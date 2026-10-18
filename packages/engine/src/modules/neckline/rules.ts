/**
 * Validation rules of the neckline module (issue #139): depth clamping, width clamping and the head-opening
 * plausibility check (FR-VAL-08). The module writes what it resolved into `ctx.resolved`; the rules read it back.
 */
import type { ValidationCheck } from "@tafsila/schemas";
import { HEAD_TO_NECK_RATIO, NECK_MIN_SHOULDER_LEFT_MM } from "../../constants/neckline";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage, type ValidationMessageCode } from "../../validation/messages";
import type { NeckHalf } from "./resolve";

/** Keys of `DraftContext.resolved` written by the neckline module. */
export const NECK_RESOLVED_KEYS = {
  frontDepth: "neckline.front.depthMm",
  frontRequested: "neckline.front.requestedDepthMm",
  frontMin: "neckline.front.minDepthMm",
  frontMax: "neckline.front.maxDepthMm",
  backDepth: "neckline.back.depthMm",
  backRequested: "neckline.back.requestedDepthMm",
  backMin: "neckline.back.minDepthMm",
  backMax: "neckline.back.maxDepthMm",
  widen: "neckline.widenMm",
  widenRequested: "neckline.requestedWidenMm",
  openingMm: "neckline.openingMm",
} as const;

/** The depth keys of each half. */
const DEPTH_KEYS: Readonly<
  Record<
    NeckHalf,
    { depth: string; requested: string; min: string; max: string; code: ValidationMessageCode }
  >
> = {
  front: {
    depth: NECK_RESOLVED_KEYS.frontDepth,
    requested: NECK_RESOLVED_KEYS.frontRequested,
    min: NECK_RESOLVED_KEYS.frontMin,
    max: NECK_RESOLVED_KEYS.frontMax,
    code: "NECK_FRONT_DEPTH_CLAMPED",
  },
  back: {
    depth: NECK_RESOLVED_KEYS.backDepth,
    requested: NECK_RESOLVED_KEYS.backRequested,
    min: NECK_RESOLVED_KEYS.backMin,
    max: NECK_RESOLVED_KEYS.backMax,
    code: "NECK_BACK_DEPTH_CLAMPED",
  },
};

/** Rounds to 0.1 mm for messages. */
const MESSAGE_DECIMALS = 1;

/**
 * Reads one resolved number.
 *
 * @param ctx - Finished context.
 * @param key - Resolved key.
 * @returns The number, 0 when missing.
 */
function read(ctx: DraftContext, key: string): number {
  return ctx.resolved[key] ?? 0;
}

/**
 * A number rounded for a message.
 *
 * @param mm - Value in mm.
 * @returns Rounded value.
 */
function shown(mm: number): number {
  return Number(mm.toFixed(MESSAGE_DECIMALS));
}

/**
 * Whether the neckline module ran.
 *
 * @param ctx - Finished context.
 * @returns True when the neckline was drafted.
 */
function drafted(ctx: DraftContext): boolean {
  return NECK_RESOLVED_KEYS.openingMm in ctx.resolved;
}

/**
 * The depth check of one half: a warning when the asked depth was held inside its limits.
 *
 * @param ctx - Finished context.
 * @param half - Front or back.
 * @returns The warning, or null when the depth was drafted as asked.
 */
function depthWarning(ctx: DraftContext, half: NeckHalf): ValidationCheck | null {
  const keys = DEPTH_KEYS[half];
  const requested = read(ctx, keys.requested);
  const depth = read(ctx, keys.depth);
  if (requested === depth) return null;
  return {
    id: "FR-VAL-08",
    code: keys.code,
    status: "warn",
    message: formatMessage(keys.code, {
      requested: shown(requested),
      mm: shown(depth),
      min: shown(read(ctx, keys.min)),
      max: shown(read(ctx, keys.max)),
    }),
    measuredMm: requested,
    expectedMm: depth,
  };
}

/**
 * Depth checks: one warning per clamped half, else one pass.
 *
 * @param ctx - Finished context.
 * @returns The checks.
 */
function depthChecks(ctx: DraftContext): readonly ValidationCheck[] {
  const warnings = (["front", "back"] as const)
    .map((half) => depthWarning(ctx, half))
    .filter((c): c is ValidationCheck => c !== null);
  if (warnings.length > 0) return warnings;
  return [
    {
      id: "FR-VAL-08",
      code: "NECK_DEPTH_OK",
      status: "pass",
      message: formatMessage("NECK_DEPTH_OK", {
        mm: shown(read(ctx, NECK_RESOLVED_KEYS.frontDepth)),
        expected: shown(read(ctx, NECK_RESOLVED_KEYS.backDepth)),
      }),
    },
  ];
}

/** Depth override and style depths: clamped with a warning outside their limits (decision 139, 1). */
export const neckDepthRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "NECK_FRONT_DEPTH_CLAMPED",
  appliesTo: drafted,
  run: (ctx) => depthChecks(ctx)[0]!,
  runMany: depthChecks,
};

/**
 * The width check: a warning when the style's widening was held to keep a sewable shoulder.
 *
 * @param ctx - Finished context.
 * @returns The check.
 */
function widthCheck(ctx: DraftContext): ValidationCheck {
  const widen = read(ctx, NECK_RESOLVED_KEYS.widen);
  const requested = read(ctx, NECK_RESOLVED_KEYS.widenRequested);
  const clamped = widen !== requested;
  const code = clamped ? "NECK_WIDTH_CLAMPED" : "NECK_WIDTH_OK";
  return {
    id: "FR-VAL-08",
    code,
    status: clamped ? "warn" : "pass",
    message: formatMessage(code, {
      mm: shown(widen),
      requested: shown(requested),
      min: NECK_MIN_SHOULDER_LEFT_MM,
    }),
    measuredMm: requested,
    expectedMm: widen,
  };
}

/** Neck width: held so each shoulder keeps `NECK_MIN_SHOULDER_LEFT_MM`, with a warning (decision 139, 2). */
export const neckWidthRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "NECK_WIDTH_CLAMPED",
  appliesTo: drafted,
  run: widthCheck,
};

/**
 * Whether nothing opens at the neck: no closure, or a side zip (decision 139, 5).
 *
 * @param ctx - Finished context.
 * @returns True when the head must pass through the neck seam.
 */
export function closedAtNeck(ctx: DraftContext): boolean {
  const { type, position } = ctx.spec.closure;
  return type === "none" || position === "side";
}

/**
 * The head-opening check: the whole neck seam against the head, estimated as `HEAD_TO_NECK_RATIO` × neck.
 *
 * @param ctx - Finished context.
 * @returns The check.
 */
function headOpeningCheck(ctx: DraftContext): ValidationCheck {
  const openingMm = read(ctx, NECK_RESOLVED_KEYS.openingMm);
  const headMm = ctx.measurements.neck * HEAD_TO_NECK_RATIO;
  const fits = openingMm >= headMm;
  const code = fits ? "NECK_HEAD_OPENING_OK" : "NECK_HEAD_OPENING_TIGHT";
  return {
    id: "FR-VAL-08",
    code,
    status: fits ? "pass" : "warn",
    message: formatMessage(code, { mm: shown(openingMm), expected: shown(headMm) }),
    measuredMm: openingMm,
    expectedMm: headMm,
  };
}

/** A neck with no closure must slip over the head (FR-VAL-08, decision 139, 5). */
export const headOpeningRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "NECK_HEAD_OPENING_TIGHT",
  appliesTo: (ctx) => drafted(ctx) && closedAtNeck(ctx),
  run: headOpeningCheck,
};

/** Every neckline rule. */
export const NECKLINE_RULES: readonly ValidationRule[] = [neckDepthRule, neckWidthRule, headOpeningRule];
