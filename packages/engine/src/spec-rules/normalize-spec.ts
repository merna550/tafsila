/** Turns any schema-valid design into one the engine accepts, changing as little as possible (issue #238). */
import type { DesignSpec } from "@tafsila/schemas";
import {
  candidateValues,
  FEATURE_PATHS,
  ignoredPartsSet,
  partOf,
  withFeatureValue,
  withoutIgnoredParts,
  withRequiredParts,
  type FeaturePath,
} from "./feature-paths";
import { specRefusals, type RefusalCode } from "./refusals";
import { judgeValue } from "./spec-options";

/** The outcome of `normalizeSpec`. */
export interface NormalizedSpec {
  /** The accepted design. */
  readonly spec: DesignSpec;
  /** The features that were changed, so the UI can tell the user; empty when the design was already valid. */
  readonly changed: readonly FeaturePath[];
}

/**
 * The features that can resolve each refusal, best first (decision 238, 3): the add-on is changed, never the garment
 * category or the part the user built the design around.
 */
const FIXES: Readonly<Record<RefusalCode, readonly FeaturePath[]>> = {
  DRESS_ONE_PIECE_SKIRT_UNSUPPORTED: ["skirt.type"],
  SLIT_NOT_DRAFTED: ["skirt.slit"],
  CLOSURE_UNSUPPORTED: ["closure.position", "closure.type"],
  COLLAR_NECKLINE_UNSUPPORTED: ["neckline.collar"],
  COLLAR_DEPTH_UNSUPPORTED: ["neckline.collar"],
  COLLAR_CLOSURE_UNSUPPORTED: ["neckline.collar"],
  SLEEVE_LENGTH_UNSUPPORTED: ["sleeve.length", "sleeve.type"],
  SLEEVE_CUFF_UNSUPPORTED: ["sleeve.cuff", "sleeve.type"],
  POCKET_UNSUPPORTED: ["pockets"],
  SPEC_PART_MISSING: [],
  BODICE_SHOULDER_INVALID: [],
  BODICE_LENGTHS_INVALID: [],
  BODICE_BUST_POINT_OUT_OF_BLOCK: [],
  SLEEVE_CAP_UNSOLVABLE: [],
  SLEEVE_LENGTH_TOO_SHORT: [],
  SKIRT_LENGTH_OUT_OF_BODY: [],
  SKIRT_LENGTH_INVALID_BODY: [],
  CLOSURE_ZIP_TOO_LONG: [],
  POCKET_NO_ROOM: [],
  SLEEVE_PUFF_UNSOLVABLE: [],
};

/** Safety bound on fix rounds: a fix can reveal the next refusal, but each round removes one. */
const MAX_ROUNDS = 12;

/**
 * Tries the values of one feature and picks the first that removes the refusal, preferring one that leaves the design
 * fully accepted.
 *
 * @param spec - The design.
 * @param path - The feature to change.
 * @param code - The refusal to remove.
 * @returns The changed design, or undefined when no value helps.
 */
function fixFeature(spec: DesignSpec, path: FeaturePath, code: RefusalCode): DesignSpec | undefined {
  if (path === "pockets") return keepAllowedPockets(spec);
  const values = candidateValues(path).map((value) => withFeatureValue(spec, path, value));
  const different = values.filter((next) => JSON.stringify(next) !== JSON.stringify(spec));
  return (
    different.find((next) => specRefusals(next).length === 0) ??
    different.find((next) => !specRefusals(next).includes(code))
  );
}

/**
 * Removes the pocket styles the design cannot take.
 *
 * @param spec - The design.
 * @returns A copy with only the allowed styles, or undefined when none was refused.
 */
function keepAllowedPockets(spec: DesignSpec): DesignSpec | undefined {
  const kept = spec.pockets.filter((style) => judgeValue(spec, "pockets", style).allowed);
  return kept.length === spec.pockets.length ? undefined : { ...spec, pockets: kept };
}

/**
 * Applies the first fix that works for a refusal.
 *
 * @param spec - The design.
 * @param code - The refusal to remove.
 * @returns The fixed design and the feature changed, or undefined when nothing fixes it.
 */
function fixRefusal(
  spec: DesignSpec,
  code: RefusalCode,
): { spec: DesignSpec; path: FeaturePath } | undefined {
  for (const path of FIXES[code]) {
    const fixed = fixFeature(spec, path, code);
    if (fixed) return { spec: fixed, path };
  }
  return undefined;
}

/**
 * Drops the parts the category ignores and fills the ones it needs.
 *
 * @param spec - The design.
 * @returns The design and the features of every part that was dropped or added.
 */
function fitToCategory(spec: DesignSpec): NormalizedSpec {
  const dropped = ignoredPartsSet(spec);
  const filled = withRequiredParts(withoutIgnoredParts(spec));
  const added = (["bodice", "neckline", "sleeve", "skirt", "waistband"] as const).filter(
    (part) => filled[part] !== undefined && spec[part] === undefined,
  );
  const touched = new Set<string>([...dropped, ...added]);
  return { spec: filled, changed: FEATURE_PATHS.filter((path) => touched.has(partOf(path) ?? "")) };
}

/**
 * Makes a design the engine accepts: parts the category ignores are dropped, missing required parts are added, then each
 * refusal is resolved by changing the add-on feature that causes it to its first accepted value (an unsupported
 * pocket is removed). The category and the main shapes are never changed.
 *
 * @param spec - Any schema-valid design.
 * @returns The accepted design and the features that changed (empty, with an equal design, when nothing was refused).
 */
export function normalizeSpec(spec: DesignSpec): NormalizedSpec {
  let { spec: current, changed } = fitToCategory(spec);
  const touched = new Set<FeaturePath>(changed);
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const [code] = specRefusals(current);
    if (code === undefined) break;
    const fixed = fixRefusal(current, code);
    if (!fixed) break;
    current = fixed.spec;
    touched.add(fixed.path);
  }
  changed = FEATURE_PATHS.filter((path) => touched.has(path));
  return { spec: current, changed };
}
