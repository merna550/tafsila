"use client";
/** The top of the history page: breadcrumb, title with the number of versions, and the way back to the pattern. */
import { Breadcrumb, PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props of {@link VersionHistoryHeader}. */
interface VersionHistoryHeaderProps {
  /** The design title. */
  readonly title: string;
  /** Number of versions, or null while loading. */
  readonly total: number | null;
  /** The pattern page of the design. */
  readonly patternHref: string;
}

/**
 * Renders the header.
 *
 * @param props - Title, count and link.
 * @returns The header.
 */
export function VersionHistoryHeader({
  title,
  total,
  patternHref,
}: Readonly<VersionHistoryHeaderProps>): ReactElement {
  const t = useTranslations("versionHistory");
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
              <Link href={patternHref} className="font-semibold text-primary underline">
                {title}
              </Link>
            ),
          },
          { key: "current", content: t("title") },
        ]}
      />
      <PageHeader
        title={
          <>
            {t("title")}{" "}
            {total === null ? null : (
              <span className="text-base font-normal text-muted">{t("count", { count: total })}</span>
            )}
          </>
        }
        actions={
          <Link
            href={patternHref}
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 font-semibold text-text hover:bg-surface-hover"
          >
            {t("backToPattern")}
          </Link>
        }
      />
    </>
  );
}
