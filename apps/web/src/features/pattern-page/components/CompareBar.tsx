"use client";
/** The bar above the version list: the hint to tick two versions and the button that opens the compare view (issue #345). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props of {@link CompareBar}. */
interface CompareBarProps {
  /** Where "Compare" goes, or null until two versions are ticked. */
  readonly href: string | null;
}

/**
 * Renders the hint and the compare button, which is a link once two versions are ticked.
 *
 * @param props - The target.
 * @returns The bar.
 */
export function CompareBar({ href }: Readonly<CompareBarProps>): ReactElement {
  const t = useTranslations("versionHistory.compare");
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="compare-bar">
      <p className="text-base text-muted">{t("hint")}</p>
      {href === null ? (
        <Button variant="secondary" disabled>
          {t("button")}
        </Button>
      ) : (
        <Link
          href={href}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover"
          data-testid="compare-link"
        >
          {t("button")}
        </Link>
      )}
    </div>
  );
}
