/** Two toggle buttons for the language; the current one has `aria-pressed`. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { AppLocale } from "@/shared/i18n";

/** Props for {@link LanguageToggle}. */
interface LanguageToggleProps {
  /** The current page language. */
  readonly current: AppLocale;
  /** Called with the language the person picked. */
  readonly onSelect: (locale: AppLocale) => void;
}

/**
 * Renders the toggle.
 *
 * @param props - Current language and the selection handler.
 * @returns The toggle.
 */
export function LanguageToggle({ current, onSelect }: Readonly<LanguageToggleProps>): ReactElement {
  const t = useTranslations("settings.display");
  const options: ReadonlyArray<{ locale: AppLocale; label: string }> = [
    { locale: "ar", label: t("arabic") },
    { locale: "en", label: t("english") },
  ];
  return (
    <div className="flex max-w-sm gap-1 rounded-md bg-bg p-1">
      {options.map(({ locale, label }) => {
        const pressed = locale === current;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={pressed}
            onClick={() => onSelect(locale)}
            className={`min-h-11 flex-1 rounded-sm text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              pressed ? "bg-surface text-text shadow-card" : "text-muted hover:bg-surface-hover"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
