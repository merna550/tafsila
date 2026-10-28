/** The "draft" banner: values are still under review and every change is logged. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/**
 * Renders the banner.
 *
 * @returns The note.
 */
export function DraftNote(): ReactElement {
  const t = useTranslations("admin.fabrics.draftNote");
  return (
    <p className="flex flex-wrap gap-2 rounded-md bg-accent-soft px-3.5 py-3 text-base text-text">
      <strong className="text-accent">{t("label")}</strong>
      <span>{t("text")}</span>
    </p>
  );
}
