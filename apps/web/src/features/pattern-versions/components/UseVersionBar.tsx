"use client";
/** The "Use this version" bar of a saved version: says which version printing, projecting and cutting use, and offers the projector (issue #286). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props of {@link UseVersionBar}. */
interface UseVersionBarProps {
  /** Version number. */
  readonly versionNo: number;
  /** Engine version the version was made with. */
  readonly engineVersion: string;
  /** Where the projector view of this version is. */
  readonly projectorHref: string;
}

const BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-md px-5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-focus";

/**
 * Renders the bar. Below the `md` width the projector button is disabled and says why.
 *
 * @param props - Version number, engine version and the projector link.
 * @returns The bar.
 */
export function UseVersionBar({
  versionNo,
  engineVersion,
  projectorHref,
}: Readonly<UseVersionBarProps>): ReactElement {
  const t = useTranslations("versionHistory.useBar");
  return (
    <section
      aria-labelledby="use-version-title"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
      data-testid="use-version-bar"
    >
      <div>
        <h2 id="use-version-title" className="text-base font-semibold">
          {t("title")}
        </h2>
        <p className="text-sm text-muted">{t("text", { n: versionNo, engine: engineVersion })}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={projectorHref}
          data-testid="open-projector"
          className={`${BUTTON} hidden bg-primary text-on-primary hover:bg-primary-hover md:inline-flex`}
        >
          {t("projector")}
        </Link>
        <span
          aria-disabled="true"
          aria-describedby="projector-disabled-reason"
          data-testid="open-projector-disabled"
          className={`${BUTTON} cursor-not-allowed border border-border bg-surface-hover text-muted md:hidden`}
        >
          {t("projector")}
        </span>
        <p id="projector-disabled-reason" className="w-full text-xs text-muted md:hidden">
          {t("projectorDisabled")}
        </p>
      </div>
    </section>
  );
}
