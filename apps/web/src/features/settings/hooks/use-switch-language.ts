"use client";
/** Hook behind the language toggle: opens the same page in the other language at once and saves the choice to the profile in the background. */
import { useToast } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, type AppLocale } from "@/shared/i18n";
import { useUpdateProfile } from "./use-update-profile";

/** What the toggle needs. */
export interface LanguageSwitch {
  /** The current page language. */
  readonly current: AppLocale;
  /** Switches to a language; does nothing when it is already the current one. */
  readonly switchTo: (locale: AppLocale) => void;
}

/**
 * Prepares the switch: navigation is instant, the profile save is best effort (a failure shows a toast and keeps the switch).
 *
 * @returns The current language and the switch function.
 */
export function useSwitchLanguage(): LanguageSwitch {
  const current = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("settings.display");
  const { showToast } = useToast();
  const { mutateAsync } = useUpdateProfile();
  /**
   * Switches the page language and saves it to the profile.
   *
   * @param locale - The language the person picked.
   */
  const switchTo = (locale: AppLocale): void => {
    if (locale === current) return;
    // mutateAsync keeps running after this page unmounts during the navigation; mutate's callbacks would be dropped.
    mutateAsync({ locale }).catch(() => showToast({ title: t("languageSaveFailed"), tone: "warning" }));
    router.replace(pathname, { locale });
  };
  return { current, switchTo };
}
