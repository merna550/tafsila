/** Heading of the designs list: the title with the number of designs and the "new pattern" action. */
import { PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";

/** Props for {@link DesignsHeading}. */
interface DesignsHeadingProps {
  /** Number of designs, or null while loading. */
  readonly total: number | null;
  /** The "new pattern" link. */
  readonly action?: ReactNode;
}

/**
 * Renders the page header of the list.
 *
 * @param props - Count and action.
 * @returns The header.
 */
export function DesignsHeading({ total, action }: Readonly<DesignsHeadingProps>): ReactElement {
  const t = useTranslations("designs");
  return (
    <PageHeader
      title={
        <>
          {t("title")}{" "}
          {total === null ? null : (
            <span className="text-base font-normal text-muted">{t("count", { count: total })}</span>
          )}
        </>
      }
      actions={action}
    />
  );
}
