/** The warm panel beside (desktop) or above (mobile) the auth card: mannequin, headline and subtitle. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Mannequin } from "./Mannequin";

/**
 * Renders the hero panel of the sign-in and sign-up screens.
 *
 * @returns The panel.
 */
export function AuthHero(): ReactElement {
  const t = useTranslations("auth.hero");
  return (
    <section className="flex min-w-0 flex-1 basis-96 flex-col gap-6 overflow-hidden rounded-xl bg-accent-soft p-8">
      <div className="flex min-h-64 flex-1 items-center justify-center">
        <Mannequin label={t("mannequinLabel")} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold leading-snug">{t("title")}</h1>
        <p className="text-lg leading-7 text-muted">{t("subtitle")}</p>
      </div>
    </section>
  );
}
