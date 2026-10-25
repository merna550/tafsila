/** Reading and writing the optional length overrides of a design (issue #246). */
import type { DesignSpec } from "@tafsila/schemas";
import { PICKER_SLIT_LENGTH_MM, type OverridePath } from "@tafsila/engine/spec-rules";

/**
 * Reads one override.
 *
 * @param spec - The design.
 * @param path - The override.
 * @returns The value in mm, or undefined when the design has no such override.
 */
export function readOverride(spec: DesignSpec, path: OverridePath): number | undefined {
  if (path === "neckline.depthFrontMm") return spec.neckline?.depthFrontMm;
  if (path === "skirt.lengthMm") return spec.skirt?.lengthMm;
  return spec.skirt?.slit?.lengthMm;
}

/**
 * Tells whether the design has the part an override belongs to (the slit length needs a slit).
 *
 * @param spec - The design.
 * @param path - The override.
 * @returns True when the field can be shown.
 */
export function overrideApplies(spec: DesignSpec, path: OverridePath): boolean {
  if (path === "neckline.depthFrontMm") return spec.neckline !== undefined;
  if (path === "skirt.lengthMm") return spec.skirt !== undefined;
  return spec.skirt?.slit !== undefined;
}

/**
 * Sets or removes one override on a copy of the design. An empty slit length goes back to the picker's slit length,
 * because a slit always has one.
 *
 * @param spec - The design.
 * @param path - The override.
 * @param mm - The new value, or undefined to remove it.
 * @returns A copy; the same design when its part is missing.
 */
export function withOverride(spec: DesignSpec, path: OverridePath, mm: number | undefined): DesignSpec {
  if (!overrideApplies(spec, path)) return spec;
  if (path === "neckline.depthFrontMm") {
    return { ...spec, neckline: { ...spec.neckline!, depthFrontMm: mm } };
  }
  if (path === "skirt.lengthMm") {
    return { ...spec, skirt: { ...spec.skirt!, lengthMm: mm } };
  }
  const slit = { ...spec.skirt!.slit!, lengthMm: mm ?? PICKER_SLIT_LENGTH_MM };
  return { ...spec, skirt: { ...spec.skirt!, slit } };
}
