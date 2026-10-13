/** The "temporary" notice shown while the chart still holds demo values. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/**
 * Renders the banner: the values are demo values and an edit applies to new measurements only.
 *
 * @returns The banner.
 */
export function PlaceholderBanner(): ReactElement {
  const t = useTranslations("admin.sizes.placeholder");
  return (
    <div role="note" className="flex gap-2 rounded-md bg-accent-soft px-4 py-3 text-base">
      <strong className="text-accent">{t("label")}</strong>
      <span>{t("text")}</span>
    </div>
  );
}
