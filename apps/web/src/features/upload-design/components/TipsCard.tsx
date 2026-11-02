/** The side card with photo tips and the privacy note (NFR-05). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/**
 * Renders the tips and the privacy note.
 *
 * @returns The card.
 */
export function TipsCard(): ReactElement {
  const t = useTranslations("uploadDesign");
  return (
    <div className="flex flex-col gap-3.5 rounded-lg bg-surface p-5 shadow-card">
      <h2 className="m-0 text-lg font-semibold">{t("tipsTitle")}</h2>
      <ul className="m-0 ps-5 text-base leading-relaxed">
        <li>{t("tips.one")}</li>
        <li>{t("tips.two")}</li>
        <li>{t("tips.three")}</li>
      </ul>
      <p className="m-0 text-sm text-muted">{t("privacy")}</p>
    </div>
  );
}
