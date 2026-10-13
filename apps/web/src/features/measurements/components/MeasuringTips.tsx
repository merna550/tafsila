/** The side card with the general measuring tips and the placeholder body drawing. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { GuideIllustration } from "./GuideIllustration";

/**
 * Renders the tips card (placeholder art until the final illustrations).
 *
 * @returns The card.
 */
export function MeasuringTips(): ReactElement {
  const t = useTranslations("measurements.tips");
  return (
    <aside className="flex flex-col gap-4 rounded-lg bg-surface-hover p-5">
      <h2 className="text-xl font-semibold text-text">{t("title")}</h2>
      <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-border p-3">
        <GuideIllustration field="bust" label={t("illustration")} />
      </div>
      <ul className="list-disc space-y-2 ps-5 text-base text-text">
        <li>{t("one")}</li>
        <li>{t("two")}</li>
        <li>{t("three")}</li>
      </ul>
    </aside>
  );
}
