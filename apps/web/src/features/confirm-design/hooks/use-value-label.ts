"use client";
/** Hook that names the current value of a feature with the picker's own option messages (no second copy of the labels). */
import type { FeaturePath } from "@tafsila/engine/spec-rules";
import type { DesignSpec } from "@tafsila/schemas";
import { useTranslations } from "next-intl";
import { currentChoice, pathMessageKey } from "@/features/design-picker";

/**
 * Builds the function that turns a feature's value into its translated name.
 *
 * @returns `(spec, path) => text`; pockets join their styles, none reads "No pockets".
 */
export function useValueLabel(): (spec: DesignSpec, path: FeaturePath) => string {
  const picker = useTranslations("designPicker");
  const t = useTranslations("confirmDesign.card");
  /**
   * Names one option of a feature.
   *
   * @param path - The feature.
   * @param value - The option value as text.
   * @returns The picker's label.
   */
  const option = (path: FeaturePath, value: string): string =>
    picker(`options.${pathMessageKey(path)}.${value}` as never);
  return (spec, path) => {
    if (path === "pockets") {
      return spec.pockets.length === 0 ? t("noPockets") : spec.pockets.map((v) => option(path, v)).join(", ");
    }
    const value = currentChoice(spec, path);
    return value === undefined ? t("notSet") : option(path, value);
  };
}
