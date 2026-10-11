/** The white card that holds one auth screen; the terms line sits at its bottom, as in the design. */
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";

/**
 * Wraps a form in the auth card.
 *
 * @param props - The card content.
 * @param props.children - Tabs, form and the Google button.
 * @returns The card.
 */
export function AuthCard({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  const t = useTranslations("auth");
  return (
    <section className="flex min-w-0 flex-1 basis-80 flex-col gap-5 rounded-xl bg-surface px-6 py-8 shadow-card">
      {children}
      <p className="mt-auto text-center text-sm leading-5 text-muted">{t("terms")}</p>
    </section>
  );
}
