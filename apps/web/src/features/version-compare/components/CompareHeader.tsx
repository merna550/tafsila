"use client";
/** The top of the compare page: breadcrumb back to the history and the title (issue #345). */
import { Breadcrumb, PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props of {@link CompareHeader}. */
interface CompareHeaderProps {
  /** The design title, or null while loading. */
  readonly title: string | null;
  /** The history page of the design. */
  readonly historyHref: string;
}

/**
 * Renders the header.
 *
 * @param props - Title and link.
 * @returns The breadcrumb and page title.
 */
export function CompareHeader({ title, historyHref }: Readonly<CompareHeaderProps>): ReactElement {
  const t = useTranslations("compare");
  return (
    <>
      <Breadcrumb
        label={t("breadcrumb")}
        items={[
          {
            key: "designs",
            content: (
              <Link href="/designs" className="font-semibold text-primary underline">
                {t("designs")}
              </Link>
            ),
          },
          {
            key: "design",
            content: (
              <Link href={historyHref} className="font-semibold text-primary underline">
                {title ?? t("fallbackTitle")}
              </Link>
            ),
          },
          { key: "current", content: t("title") },
        ]}
      />
      <PageHeader title={t("title")} />
    </>
  );
}
