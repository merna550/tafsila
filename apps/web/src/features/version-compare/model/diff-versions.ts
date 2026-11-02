/** Pure comparison of two saved versions: which design features, measurements and ease differ (issue #345, no geometry numbers). */
import type { DesignSpec, EaseProfile, Measurements } from "@tafsila/schemas";

/** A value a difference can show on one side. */
export type DiffValue = string | number | boolean | undefined;

/** Which part of the version a difference comes from. */
export type DiffGroup = "feature" | "measurement" | "ease";

/** One line of "what changed". */
export interface VersionDifference {
  /** Where it comes from; picks the label source. */
  readonly group: DiffGroup;
  /** Feature key such as `sleeve_length` (the `designPicker.paths` key), a measurement name, or `ease`. */
  readonly key: string;
  /** The value in the first (older) version; undefined when that version has no such part. */
  readonly from: DiffValue;
  /** The value in the second (newer) version. */
  readonly to: DiffValue;
}

/** The inputs of a version that the comparison reads. */
export interface ComparableVersion {
  /** The stored design. */
  readonly spec: DesignSpec;
  /** The stored measurements. */
  readonly measurements: Measurements;
  /** The stored ease profile. */
  readonly easeProfile: EaseProfile;
}

/**
 * The features of the bodice and neckline.
 *
 * @param spec - The design.
 * @returns Feature key to value.
 */
function upperFeatures(spec: DesignSpec): Record<string, DiffValue> {
  return {
    bodice_fit: spec.bodice?.fit,
    bodice_shaping: spec.bodice?.shaping,
    bodice_waistSeam: spec.bodice?.waistSeam,
    neckline_front: spec.neckline?.front,
    neckline_back: spec.neckline?.back,
    neckline_collar: spec.neckline?.collar,
  };
}

/**
 * The features of the sleeve and the skirt. A slit reads as its position, and no slit as `none`.
 *
 * @param spec - The design.
 * @returns Feature key to value.
 */
function lowerFeatures(spec: DesignSpec): Record<string, DiffValue> {
  const { sleeve, skirt } = spec;
  return {
    sleeve_type: sleeve?.type,
    sleeve_length: sleeve?.length,
    sleeve_cuff: sleeve?.cuff,
    skirt_type: skirt?.type,
    skirt_length: skirt?.length,
    skirt_slit: skirt === undefined ? undefined : (skirt.slit?.position ?? "none"),
  };
}

/**
 * Flattens a design into one value per feature, keyed like `designPicker.paths`. Pockets become one sorted list, so a
 * change reads as one line.
 *
 * @param spec - The design.
 * @returns Feature key to value; parts the design does not have are absent.
 */
export function flattenSpec(spec: DesignSpec): Readonly<Record<string, DiffValue>> {
  return {
    category: spec.category,
    ...upperFeatures(spec),
    ...lowerFeatures(spec),
    waistband: spec.waistband,
    closure_type: spec.closure.type,
    closure_position: spec.closure.position,
    pockets: [...spec.pockets].sort((x, y) => x.localeCompare(y)).join(","),
    belt: spec.belt,
    lining: spec.lining,
  };
}

/**
 * Lists what differs between two versions, in a stable order: design features, then measurements, then ease.
 *
 * @param a - The first version.
 * @param b - The second version.
 * @returns The differences; empty when the inputs are the same.
 */
export function diffVersions(a: ComparableVersion, b: ComparableVersion): VersionDifference[] {
  const out: VersionDifference[] = [];
  const fa = flattenSpec(a.spec);
  const fb = flattenSpec(b.spec);
  for (const key of Object.keys(fa)) {
    if (fa[key] !== fb[key]) out.push({ group: "feature", key, from: fa[key], to: fb[key] });
  }
  const ma = a.measurements as unknown as Record<string, unknown>;
  const mb = b.measurements as unknown as Record<string, unknown>;
  for (const key of Object.keys(ma).filter((k) => k !== "unit")) {
    if (ma[key] !== mb[key]) {
      out.push({
        group: "measurement",
        key,
        from: ma[key] as number | undefined,
        to: mb[key] as number | undefined,
      });
    }
  }
  if (a.easeProfile !== b.easeProfile) {
    out.push({ group: "ease", key: "ease", from: a.easeProfile, to: b.easeProfile });
  }
  return out;
}
