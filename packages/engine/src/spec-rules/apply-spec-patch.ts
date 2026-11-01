/**
 * Applies a chat edit's patch to a design and checks it with the engine's spec rules (issue #337, FR-CHAT-02,
 * decision 337, 1): the AI proposes, this pure function decides.
 */
import {
  DESIGN_LENGTH_PATHS,
  designSpecSchema,
  specPatchSchema,
  type DesignLengthPath,
  type DesignSpec,
  type SpecPatch,
  type SpecPatchOp,
} from "@tafsila/schemas";
import {
  candidateValues,
  FEATURE_PATHS,
  featureApplies,
  withFeatureValue,
  withoutIgnoredParts,
} from "./feature-paths";
import { OVERRIDE_LIMITS_MM } from "./override-limits";
import { specRefusals, type RefusalCode } from "./refusals";

/** Why a patch was rejected. */
export type PatchIssueCode =
  | "PATCH_INVALID"
  | "VALUE_NOT_ALLOWED"
  | "FEATURE_NOT_APPLICABLE"
  | "LENGTH_OUT_OF_RANGE"
  | "SLIT_MISSING"
  | RefusalCode;

/** One reason a patch was rejected. */
export interface PatchIssue {
  /** Machine code. */
  readonly code: PatchIssueCode;
  /** The feature or length concerned, when there is one. */
  readonly path?: string;
  /** English detail, also sent back to the model on a retry. */
  readonly message: string;
}

/** One feature or length the patch changed. */
export interface SpecChange {
  /** Feature or length path. */
  readonly path: string;
  /** Value before (undefined when the part did not exist). */
  readonly from: unknown;
  /** Value after (undefined when the part was removed). */
  readonly to: unknown;
}

/** The outcome of `applySpecPatch`. */
export type ApplySpecPatchResult =
  | { readonly ok: true; readonly spec: DesignSpec; readonly changes: readonly SpecChange[] }
  | { readonly ok: false; readonly issues: readonly PatchIssue[] };

/** The result of one op: the new design, or why it was refused. */
type OpOutcome = { spec: DesignSpec; issue?: undefined } | { spec?: undefined; issue: PatchIssue };

/**
 * Applies one `set` op.
 *
 * @param spec - The design.
 * @param op - The op.
 * @returns The new design or an issue.
 */
function applySet(spec: DesignSpec, op: Extract<SpecPatchOp, { op: "set" }>): OpOutcome {
  if (!candidateValues(op.path).includes(op.value)) {
    return {
      issue: {
        code: "VALUE_NOT_ALLOWED",
        path: op.path,
        message: `${String(op.value)} is not a value of ${op.path}`,
      },
    };
  }
  if (op.path !== "category" && !featureApplies(spec.category, op.path)) {
    return {
      issue: {
        code: "FEATURE_NOT_APPLICABLE",
        path: op.path,
        message: `a ${spec.category} has no ${op.path}`,
      },
    };
  }
  return { spec: withFeatureValue(spec, op.path, op.value) };
}

/**
 * Applies one `setLength` op within the picker's limits.
 *
 * @param spec - The design.
 * @param path - The length.
 * @param mm - The new length in mm.
 * @returns The new design or an issue.
 */
function applyLength(spec: DesignSpec, path: DesignLengthPath, mm: number): OpOutcome {
  const { minMm, maxMm } = OVERRIDE_LIMITS_MM[path];
  if (mm < minMm || mm > maxMm) {
    return {
      issue: { code: "LENGTH_OUT_OF_RANGE", path, message: `${path} must be ${minMm} to ${maxMm} mm` },
    };
  }
  const part = path.startsWith("neckline") ? "neckline" : "skirt";
  const owner = spec[part];
  if (
    owner === undefined ||
    !featureApplies(spec.category, part === "neckline" ? "neckline.front" : "skirt.type")
  ) {
    return { issue: { code: "FEATURE_NOT_APPLICABLE", path, message: `a ${spec.category} has no ${part}` } };
  }
  const next = structuredClone(spec);
  if (path === "neckline.depthFrontMm") next.neckline!.depthFrontMm = mm;
  else if (path === "skirt.lengthMm") next.skirt!.lengthMm = mm;
  else if (next.skirt!.slit === undefined) {
    return { issue: { code: "SLIT_MISSING", path, message: "add a slit before setting its length" } };
  } else next.skirt!.slit.lengthMm = mm;
  return { spec: next };
}

/**
 * Applies one op of any kind.
 *
 * @param spec - The design.
 * @param op - The op.
 * @returns The new design or an issue.
 */
function applyOp(spec: DesignSpec, op: SpecPatchOp): OpOutcome {
  switch (op.op) {
    case "set":
      return applySet(spec, op);
    case "setLength":
      return applyLength(spec, op.path, op.mm);
    case "addPocket":
      return {
        spec: spec.pockets.includes(op.type) ? spec : { ...spec, pockets: [...spec.pockets, op.type] },
      };
    case "removePocket":
      return { spec: { ...spec, pockets: spec.pockets.filter((style) => style !== op.type) } };
  }
}

/**
 * Reads a feature or length the way the user sees it (a slit as its position or `"none"`).
 *
 * @param spec - The design.
 * @param path - A feature or length path.
 * @returns The value, or undefined when its part is absent.
 */
function readPath(spec: DesignSpec, path: string): unknown {
  if (path === "skirt.slit")
    return spec.skirt === undefined ? undefined : (spec.skirt.slit?.position ?? "none");
  let node: unknown = spec;
  for (const key of path.split(".")) node = (node as Record<string, unknown> | undefined)?.[key];
  return node;
}

/**
 * Lists what differs between two designs, in feature order then length order.
 *
 * @param before - The design before the patch.
 * @param after - The design after.
 * @returns One change per feature or length whose value differs.
 */
export function specChanges(before: DesignSpec, after: DesignSpec): SpecChange[] {
  return [...FEATURE_PATHS, ...DESIGN_LENGTH_PATHS]
    .map((path) => ({ path, from: readPath(before, path), to: readPath(after, path) }))
    .filter((change) => JSON.stringify(change.from) !== JSON.stringify(change.to));
}

/**
 * Applies a patch's ops in order, then the engine's spec rules. Nothing is guessed: an unknown value, a feature the
 * category has no part for, a length outside the picker limits or a combination the engine refuses rejects the whole
 * patch.
 *
 * @param spec - A valid design.
 * @param patch - The patch (validated again here, so model output can be passed as is).
 * @returns The new design and its changes, or the issues.
 * @example
 * applySpecPatch(blouse, { ops: [{ op: "set", path: "sleeve.length", value: "long" }] }).ok; // true
 */
export function applySpecPatch(spec: DesignSpec, patch: SpecPatch): ApplySpecPatchResult {
  const parsed = specPatchSchema.safeParse(patch);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        code: "PATCH_INVALID",
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  let current = spec;
  for (const op of parsed.data.ops) {
    const outcome = applyOp(current, op);
    if (outcome.issue) return { ok: false, issues: [outcome.issue] };
    current = outcome.spec;
  }
  return checkSpec(spec, withoutIgnoredParts(current));
}

/**
 * Runs the schema and the engine's refusals on the patched design.
 *
 * @param before - The design before the patch.
 * @param after - The patched design.
 * @returns The accepted result, or the refusals.
 */
function checkSpec(before: DesignSpec, after: DesignSpec): ApplySpecPatchResult {
  const schema = designSpecSchema.safeParse(after);
  if (!schema.success) {
    return {
      ok: false,
      issues: schema.error.issues.map((issue) => ({
        code: "PATCH_INVALID",
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  const refusals = specRefusals(after);
  if (refusals.length > 0) {
    return {
      ok: false,
      issues: refusals.map((code) => ({ code, message: `the engine refuses this design: ${code}` })),
    };
  }
  return { ok: true, spec: after, changes: specChanges(before, after) };
}
