/** The "Display" card: language toggle and the unit shown as text (centimeters only for now). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { AppLocale } from "@/shared/i18n";
import { LanguageToggle } from "./LanguageToggle";

/** Props for {@link DisplayCard}. */
interface DisplayCardProps {
  /** The current page language. */
  readonly current: AppLocale;
  /** Called with the language the person picked. */
  readonly onSelect: (locale: AppLocale) => void;
}

/**
 * Renders the display card.
 *
 * @param props - Current language and the selection handler.
 * @returns The card.
 */
export function DisplayCard({ current, onSelect }: Readonly<DisplayCardProps>): ReactElement {
  const t = useTranslations("settings.display");
  return (
    <section
      aria-labelledby="settings-display"
      className="flex flex-col gap-4 rounded-lg bg-surface p-6 shadow-card"
    >
      <h2 id="settings-display" className="text-xl font-semibold text-text">
        {t("title")}
      </h2>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-text">{t("language")}</span>
        <LanguageToggle current={current} onSelect={onSelect} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-text">{t("units")}</span>
        <span className="text-lg text-text">{t("centimeters")}</span>
        <span className="text-sm text-muted">{t("inchesSoon")}</span>
      </div>
    </section>
  );
}
