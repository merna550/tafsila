/** The "not supported yet" panel: what the AI saw that the engine cannot draw, in the user's language (FR-DES-07). */
import type { BilingualText } from "@tafsila/schemas";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { AppLocale } from "@/shared/i18n";

/** Props for {@link UnsupportedPanel}. */
interface UnsupportedPanelProps {
  /** What the AI saw that the catalogue does not hold. */
  readonly items: readonly { readonly text: BilingualText }[];
}

/**
 * Renders the panel, or nothing when the catalogue covered everything.
 *
 * @param props - The unsupported items.
 * @returns The panel, or null.
 */
export function UnsupportedPanel({ items }: Readonly<UnsupportedPanelProps>): ReactElement | null {
  const t = useTranslations("confirmDesign.unsupported");
  const locale = useLocale() as AppLocale;
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="unsupported-title"
      className="flex flex-col gap-2 rounded-lg border border-warning bg-accent-soft p-4"
    >
      <h2 id="unsupported-title" className="m-0 text-base font-bold">
        {t("title")}
      </h2>
      <p className="m-0 text-sm text-muted">{t("hint")}</p>
      <ul className="m-0 flex list-disc flex-col gap-1 ps-5">
        {items.map((item) => (
          <li key={item.text.en}>{item.text[locale]}</li>
        ))}
      </ul>
    </section>
  );
}
