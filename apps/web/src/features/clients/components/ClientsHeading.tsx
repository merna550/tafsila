/** Heading of the clients list: the title with the number of clients and the "new client" action. */
import { PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";

/** Props for {@link ClientsHeading}. */
interface ClientsHeadingProps {
  /** Number of clients, or null while loading. */
  readonly total: number | null;
  /** The "new client" button; omitted on the first-visit empty state. */
  readonly action?: ReactNode;
}

/**
 * Renders the page header of the list.
 *
 * @param props - Count and action.
 * @returns The header.
 */
export function ClientsHeading({ total, action }: Readonly<ClientsHeadingProps>): ReactElement {
  const t = useTranslations("clients");
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
