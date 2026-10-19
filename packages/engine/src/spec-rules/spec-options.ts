/** What the design picker may offer for each feature of a design (issue #238). */
import type { DesignSpec } from "@tafsila/schemas";
import {
  candidateValues,
  FEATURE_PATHS,
  featureApplies,
  withFeatureValue,
  type FeaturePath,
  type FeatureValue,
} from "./feature-paths";
import { refusalMessage, specRefusals, type RefusalCode } from "./refusals";

/** Why a value is refused. */
export interface OptionReason {
  /** The first refusal code. */
  readonly code: RefusalCode;
  /** Arabic text for the user. */
  readonly ar: string;
  /** English text. */
  readonly en: string;
}

/** One candidate value of a feature. */
export interface OptionValue {
  /** The value (for `pockets` one style, for `skirt.slit` a position or `"none"`). */
  readonly value: FeatureValue;
  /** False when the engine would refuse the design with this value. */
  readonly allowed: boolean;
  /** Present when not allowed. */
  readonly reason?: OptionReason;
}

/** The options of one feature. */
export interface FeatureOptions {
  /** False when the category does not use the feature (a skirt on a blouse); its values are empty. */
  readonly applies: boolean;
  /** Every schema value, allowed or refused. */
  readonly values: readonly OptionValue[];
}

/** The options of every feature. */
export type SpecOptions = Readonly<Record<FeaturePath, FeatureOptions>>;

/**
 * Judges one value of one feature by setting it on a copy of the design.
 *
 * @param spec - The design.
 * @param path - The feature.
 * @param value - The candidate value.
 * @returns The value, whether the engine accepts the design with it, and the first refusal.
 */
export function judgeValue(spec: DesignSpec, path: FeaturePath, value: FeatureValue): OptionValue {
  const next = withFeatureValue(spec, path, value);
  const [code] = specRefusals(next);
  if (code === undefined) return { value, allowed: true };
  return { value, allowed: false, reason: { code, ...refusalMessage(code, next) } };
}

/**
 * Lists, for each feature, which values the engine accepts when only that feature changes. Meant for a design that is
 * already valid (start from `defaultSpec` and `normalizeSpec`): another refusal in the design would refuse every value.
 * Refusals that depend on the body (pocket room, neckline depth, zip length) are not here; they stay report checks.
 *
 * @param spec - The current design.
 * @returns The options per feature path.
 */
export function specOptions(spec: DesignSpec): SpecOptions {
  const entries = FEATURE_PATHS.map((path): [FeaturePath, FeatureOptions] => {
    if (!featureApplies(spec.category, path)) return [path, { applies: false, values: [] }];
    return [
      path,
      { applies: true, values: candidateValues(path).map((value) => judgeValue(spec, path, value)) },
    ];
  });
  return Object.fromEntries(entries) as Record<FeaturePath, FeatureOptions>;
}
