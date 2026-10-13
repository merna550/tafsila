/** The bottom row: save (disabled while an error exists), cancel, and the line that says why saving is blocked. */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props for {@link SaveBar}. */
interface SaveBarProps {
  /** True when saving is allowed. */
  readonly canSave: boolean;
  /** True while the request runs. */
  readonly pending: boolean;
  /** Number of engine errors blocking the save. */
  readonly errorCount: number;
  /** Where "cancel" goes (the client profile). */
  readonly cancelHref: string;
}

/**
 * Renders the buttons and the blocking reason.
 *
 * @param props - Save state and the cancel target.
 * @returns The bar.
 */
export function SaveBar({ canSave, pending, errorCount, cancelHref }: Readonly<SaveBarProps>): ReactElement {
  const t = useTranslations("measurements.save");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={!canSave || pending}>
        {t("submit")}
      </Button>
      <Link
        href={cancelHref}
        className="inline-flex min-h-12 items-center rounded-md border border-border bg-surface px-5 text-lg font-semibold text-text hover:bg-surface-hover"
      >
        {t("cancel")}
      </Link>
      {canSave ? null : (
        <p className="text-sm font-semibold text-danger" role="status">
          {errorCount > 0 ? t("errors", { count: errorCount }) : t("incomplete")}
        </p>
      )}
    </div>
  );
}
