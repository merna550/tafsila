"use client";
/** The banner above an old version: view only, with "Back to the newest" and "Restore this version". */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props for {@link ReadOnlyVersionBanner}. */
interface ReadOnlyVersionBannerProps {
  /** Where "Back to the newest" goes. */
  readonly backHref: string;
  /** Asks to restore this version. */
  readonly onRestore: () => void;
  /** Hides the restore button for the current version. */
  readonly canRestore: boolean;
}

/**
 * Renders the banner.
 *
 * @param props - The back link and the restore action.
 * @returns The banner.
 */
export function ReadOnlyVersionBanner({
  backHref,
  onRestore,
  canRestore,
}: Readonly<ReadOnlyVersionBannerProps>): ReactElement {
  const t = useTranslations("versionHistory.readOnly");
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface p-4"
      data-testid="read-only-banner"
    >
      <p className="text-base text-text">
        <strong>{t("lead")}</strong> {t("rest")}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 font-semibold text-text hover:bg-surface-hover"
          data-testid="back-to-newest"
        >
          {t("back")}
        </Link>
        {canRestore ? (
          <Button onClick={onRestore} data-testid="restore-this">
            {t("restore")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
